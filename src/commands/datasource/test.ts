import pc from "picocolors";
import { post } from "../../lib/api.js";
import { loadLocalDatasources } from "../../lib/local/index.js";
import { pushDatasource } from "./push.js";

interface TestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Test datasource connection(s).
 *
 * If name is provided, pushes and tests that single datasource.
 * If no name, pushes and tests all local datasources.
 */
export async function datasourceTestCommand(name?: string): Promise<void> {
  const localDatasources = loadLocalDatasources(process.cwd());

  if (localDatasources.length === 0) {
    console.log(pc.yellow("No datasources found in .bon/datasources.yaml"));
    console.log(pc.dim("Run `bon datasource add` to add one."));
    process.exit(1);
  }

  // Determine which datasources to test
  const toTest = name
    ? localDatasources.filter((d) => d.name === name)
    : localDatasources;

  if (name && toTest.length === 0) {
    console.log(pc.red(`Datasource "${name}" not found in .bon/datasources.yaml`));
    process.exit(1);
  }

  // Push datasources to remote first (ensures latest config is synced)
  console.log(pc.dim("Syncing datasources..."));

  for (const ds of toTest) {
    const success = await pushDatasource(ds.name, { silent: true });
    if (!success) {
      console.log(pc.red(`✗ Failed to sync "${ds.name}"`));
      process.exit(1);
    }
  }

  console.log(pc.dim("Testing connections..."));
  console.log();

  let failed = false;

  for (const ds of toTest) {
    try {
      const result = (await post("/api/datasources/test", {
        name: ds.name,
      })) as TestResult;

      if (result.success) {
        const latency = result.details?.latencyMs
          ? ` (${result.details.latencyMs}ms)`
          : "";
        console.log(pc.green(`✓ ${ds.name}${latency}`));
      } else {
        console.log(pc.red(`✗ ${ds.name}: ${result.message}`));
        failed = true;
      }
    } catch (err) {
      console.log(
        pc.red(`✗ ${ds.name}: ${err instanceof Error ? err.message : err}`)
      );
      failed = true;
    }
  }

  if (failed) {
    console.log();
    console.log(pc.red("Some connection tests failed."));
    process.exit(1);
  }

  console.log();
  console.log(pc.green("All connections verified."));
}
