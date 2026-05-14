import pc from "picocolors";
import { removeLocalDatasource, datasourceExists } from "../../lib/local/index.js";
import { loadCredentials } from "../../lib/credentials.js";

interface RemoveOptions {
  remote?: boolean;
}

export async function datasourceRemoveCommand(name: string, options: RemoveOptions = {}) {
  // Check if exists locally
  const existsLocally = datasourceExists(name);

  // If --remote flag, only remove from remote
  if (options.remote) {
    await removeRemote(name);
    return;
  }

  // Default: remove from local
  if (existsLocally) {
    const removed = removeLocalDatasource(name);
    if (removed) {
      console.log(pc.green(`✓ Removed "${name}" from local storage`));
    }
  } else {
    console.error(pc.red(`Datasource "${name}" not found.`));
    console.log(pc.dim("Use --remote to remove from remote server."));
    process.exit(1);
  }
}

/**
 * Remove datasource from remote server
 */
async function removeRemote(name: string): Promise<void> {
  const creds = loadCredentials();

  if (!creds) {
    console.error(pc.red("Not logged in. Run `bon login` to remove remote datasources."));
    process.exit(1);
  }

  try {
    const { del } = await import("../../lib/api.js");
    await del(`/api/datasources/${encodeURIComponent(name)}`);
    console.log(pc.green(`✓ Removed "${name}" from remote server`));
  } catch (err) {
    console.error(pc.red(`Failed to remove remote datasource: ${(err as Error).message}`));
    process.exit(1);
  }
}
