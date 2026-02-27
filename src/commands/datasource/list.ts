import pc from "picocolors";
import { loadLocalDatasources } from "../../lib/local/index.js";
import { loadCredentials } from "../../lib/credentials.js";

interface ListOptions {
  local?: boolean;
  remote?: boolean;
}

/**
 * Format warehouse type for display
 */
function formatType(type: string): string {
  const labels: Record<string, string> = {
    snowflake: "Snowflake",
    postgres: "Postgres",
    bigquery: "BigQuery",
    databricks: "Databricks",
  };
  return labels[type] || type;
}

/**
 * Format source for display
 */
function formatSource(source: string): string {
  const labels: Record<string, string> = {
    dbt: "dbt",
    manual: "manual",
    mcp: "mcp",
  };
  return labels[source] || source;
}

/**
 * List local datasources
 */
function listLocalDatasources(): void {
  const datasources = loadLocalDatasources();

  if (datasources.length === 0) {
    console.log(pc.dim("No local data sources found."));
    console.log(pc.dim("Run `bon datasource add` or `bon datasource add --from-dbt` to create one."));
    return;
  }

  console.log(pc.bold("Local Data Sources") + pc.dim(" (.bon/datasources.yaml)"));
  console.log();

  // Calculate column widths
  const maxNameLen = Math.max(...datasources.map((ds) => ds.name.length), 4);
  const maxTypeLen = Math.max(...datasources.map((ds) => formatType(ds.type).length), 4);

  // Header
  const header = `  ${"NAME".padEnd(maxNameLen)}  ${"TYPE".padEnd(maxTypeLen)}  SOURCE     ORIGIN`;
  console.log(pc.dim(header));
  console.log(pc.dim("  " + "─".repeat(header.length - 2)));

  for (const ds of datasources) {
    const name = ds.name.padEnd(maxNameLen);
    const type = formatType(ds.type).padEnd(maxTypeLen);
    const source = formatSource(ds.source).padEnd(10);

    let origin = "";
    if (ds.source === "dbt" && ds.dbtProfile) {
      origin = `${ds.dbtProfile}/${ds.dbtTarget}`;
    }

    console.log(`  ${pc.bold(name)}  ${type}  ${source} ${pc.dim(origin)}`);
  }

  console.log();
  console.log(pc.dim(`${datasources.length} datasource${datasources.length !== 1 ? "s" : ""}`));
}

/**
 * List remote datasources (requires login)
 */
async function listRemoteDatasources(): Promise<void> {
  const creds = loadCredentials();

  if (!creds) {
    console.log(pc.dim("Not logged in. Run `bon login` to see remote data sources."));
    return;
  }

  try {
    const { get } = await import("../../lib/api.js");

    interface DataSource {
      id: string;
      name: string;
      warehouse_type: string;
      config: Record<string, unknown>;
      status: string;
      created_at: string;
    }

    const result = (await get("/api/datasources")) as {
      dataSources: DataSource[];
    };

    if (result.dataSources.length === 0) {
      console.log(pc.dim("No remote data sources found."));
      return;
    }

    console.log(pc.bold("Remote Data Sources") + pc.dim(" (Bonnard server)"));
    console.log();

    // Calculate column widths
    const maxNameLen = Math.max(...result.dataSources.map((ds) => ds.name.length), 4);
    const maxTypeLen = Math.max(
      ...result.dataSources.map((ds) => ds.warehouse_type.length),
      4
    );

    // Header
    const header = `  ${"NAME".padEnd(maxNameLen)}  ${"TYPE".padEnd(maxTypeLen)}  STATUS`;
    console.log(pc.dim(header));
    console.log(pc.dim("  " + "─".repeat(header.length - 2)));

    for (const ds of result.dataSources) {
      const name = ds.name.padEnd(maxNameLen);
      const type = ds.warehouse_type.padEnd(maxTypeLen);
      const statusColor =
        ds.status === "active"
          ? pc.green
          : ds.status === "error"
            ? pc.red
            : pc.yellow;

      console.log(`  ${pc.bold(name)}  ${type}  ${statusColor(ds.status)}`);
    }

    console.log();
    console.log(
      pc.dim(`${result.dataSources.length} datasource${result.dataSources.length !== 1 ? "s" : ""}`)
    );
  } catch (err) {
    console.log(pc.yellow(`Could not fetch remote sources: ${(err as Error).message}`));
  }
}

/**
 * Main list command
 */
export async function datasourceListCommand(options: ListOptions = {}): Promise<void> {
  const showLocal = options.local || (!options.local && !options.remote);
  const showRemote = options.remote || (!options.local && !options.remote);

  if (showLocal) {
    listLocalDatasources();
  }

  if (showLocal && showRemote) {
    console.log();
  }

  if (showRemote) {
    await listRemoteDatasources();
  }
}
