import pc from "picocolors";
import { loadCredentials } from "../../lib/credentials.js";
import { getLocalDatasource, resolveEnvVarsInCredentials } from "../../lib/local/index.js";
import { post, getRemoteDatasources } from "../../lib/api.js";
import { confirm } from "@inquirer/prompts";

interface PushOptions {
  force?: boolean;
}

/**
 * Push a local datasource to Bonnard server
 */
export async function datasourcePushCommand(
  name: string,
  options: PushOptions = {}
): Promise<void> {
  // Step 1: Check login
  const creds = loadCredentials();
  if (!creds) {
    console.error(pc.red("Not logged in. Run `bon login` first."));
    process.exit(1);
  }

  // Step 2: Load local datasource
  const datasource = getLocalDatasource(name);
  if (!datasource) {
    console.error(pc.red(`Datasource "${name}" not found in .bon/datasources.yaml`));
    console.log(pc.dim("Run `bon datasource list --local` to see available datasources."));
    process.exit(1);
  }

  // Step 3: Resolve env vars in credentials
  const { resolved, missing } = resolveEnvVarsInCredentials(datasource.credentials);

  if (missing.length > 0) {
    console.error(pc.red(`Missing environment variables: ${missing.join(", ")}`));
    console.log(pc.dim("Set them in your environment or use plain values in .bon/datasources.yaml"));
    process.exit(1);
  }

  // Step 4: Check if already exists on remote
  try {
    const remoteDatasources = await getRemoteDatasources();
    const existsRemote = remoteDatasources.some((ds) => ds.name === name);

    if (existsRemote && !options.force) {
      const shouldOverwrite = await confirm({
        message: `Datasource "${name}" already exists on remote. Overwrite?`,
        default: false,
      });

      if (!shouldOverwrite) {
        console.log(pc.dim("Aborted."));
        process.exit(0);
      }
    }
  } catch (err) {
    // If we can't fetch remote datasources, continue anyway
    // The server will handle conflicts
    console.log(pc.dim(`Note: Could not check remote datasources: ${(err as Error).message}`));
  }

  // Step 5: Push to remote
  console.log(pc.dim(`Pushing "${name}"...`));

  try {
    await post("/api/datasources", {
      name: datasource.name,
      warehouse_type: datasource.type,
      config: datasource.config,
      credentials: resolved,
    });

    console.log(pc.green(`✓ Datasource "${name}" pushed to Bonnard`));
  } catch (err) {
    const message = (err as Error).message;

    // Handle conflict (already exists)
    if (message.includes("already exists")) {
      console.error(pc.red(`Datasource "${name}" already exists on remote.`));
      console.log(pc.dim("Use --force to overwrite."));
      process.exit(1);
    }

    console.error(pc.red(`Failed to push datasource: ${message}`));
    process.exit(1);
  }
}

/**
 * Push a datasource programmatically (for use by deploy command)
 * Returns true on success, false on failure
 */
export async function pushDatasource(
  name: string,
  options: { silent?: boolean } = {}
): Promise<boolean> {
  const datasource = getLocalDatasource(name);
  if (!datasource) {
    if (!options.silent) {
      console.error(pc.red(`Datasource "${name}" not found locally`));
    }
    return false;
  }

  const { resolved, missing } = resolveEnvVarsInCredentials(datasource.credentials);

  if (missing.length > 0) {
    if (!options.silent) {
      console.error(pc.red(`Missing env vars for "${name}": ${missing.join(", ")}`));
    }
    return false;
  }

  try {
    await post("/api/datasources", {
      name: datasource.name,
      warehouse_type: datasource.type,
      config: datasource.config,
      credentials: resolved,
    });
    return true;
  } catch {
    return false;
  }
}
