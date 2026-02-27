import pc from "picocolors";
import { loadCredentials } from "../../lib/credentials.js";
import { post } from "../../lib/api.js";

export async function datasourceTestCommand(name: string) {
  const creds = loadCredentials();

  if (!creds) {
    console.log(pc.red("Not logged in. Run `bon login` to test datasources."));
    process.exit(1);
  }

  console.log(pc.dim(`Testing ${name} via remote API...`));
  console.log();

  try {
    const result = (await post("/api/datasources/test", { name })) as {
      success: boolean;
      message: string;
      details?: Record<string, unknown>;
    };

    if (result.success) {
      console.log(pc.green(result.message));
      if (result.details) {
        if (result.details.warehouse) {
          console.log(pc.dim(`  Warehouse: ${result.details.warehouse}`));
        }
        if (result.details.account) {
          console.log(pc.dim(`  Account:   ${result.details.account}`));
        }
        if (result.details.latencyMs != null) {
          console.log(pc.dim(`  Latency:   ${result.details.latencyMs}ms`));
        }
      }
    } else {
      console.log(pc.red(result.message));
      process.exit(1);
    }
  } catch (err) {
    console.error(pc.red(`Failed to test data source: ${(err as Error).message}`));
    process.exit(1);
  }
}
