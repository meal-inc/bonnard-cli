import pc from "picocolors";
import {
  addLocalDatasource,
  datasourceExists,
  isDatasourcesTrackedByGit,
  type LocalDatasource,
} from "../../lib/local/index.js";
import {
  dbtProfilesExist,
  parseDbtProfiles,
  getDefaultProfilesPath,
  mapDbtConnection,
  generateDatasourceName,
  type ParsedConnection,
} from "../../lib/dbt/index.js";

// Dynamic import for @inquirer/prompts (ESM)
async function prompts() {
  return import("@inquirer/prompts");
}

type WarehouseType = "snowflake" | "postgres" | "redshift" | "bigquery" | "databricks" | "duckdb";

interface FieldDef {
  name: string;
  flag?: string; // CLI flag name if different from name
  message: string;
  required?: boolean;
  secret?: boolean;
  default?: string;
}

interface WarehouseConfig {
  value: WarehouseType;
  label: string;
  configFields: FieldDef[];
  credentialFields: FieldDef[];
}

const WAREHOUSE_CONFIGS: WarehouseConfig[] = [
  {
    value: "snowflake",
    label: "Snowflake",
    configFields: [
      { name: "account", message: "Account identifier (e.g. xy12345.us-east-1)", required: true },
      { name: "database", message: "Database name", required: true },
      { name: "schema", message: "Schema name", required: true },
      { name: "warehouse", message: "Warehouse name", required: true },
      { name: "role", message: "Role (optional)" },
    ],
    credentialFields: [
      { name: "username", flag: "user", message: "Username", required: true },
      { name: "password", message: "Password", secret: true, required: true },
    ],
  },
  {
    value: "postgres",
    label: "Postgres",
    configFields: [
      { name: "host", message: "Host", required: true },
      { name: "port", message: "Port", default: "5432" },
      { name: "database", message: "Database name", required: true },
      { name: "schema", message: "Schema", default: "public" },
    ],
    credentialFields: [
      { name: "username", flag: "user", message: "Username", required: true },
      { name: "password", message: "Password", secret: true, required: true },
    ],
  },
  {
    value: "redshift",
    label: "Redshift",
    configFields: [
      { name: "host", message: "Host (cluster endpoint)", required: true },
      { name: "port", message: "Port", default: "5439" },
      { name: "database", message: "Database name", required: true },
      { name: "schema", message: "Schema", default: "public" },
    ],
    credentialFields: [
      { name: "username", flag: "user", message: "Username", required: true },
      { name: "password", message: "Password", secret: true, required: true },
    ],
  },
  {
    value: "bigquery",
    label: "BigQuery",
    configFields: [
      { name: "project_id", flag: "projectId", message: "GCP Project ID", required: true },
      { name: "dataset", message: "Dataset name", required: true },
      { name: "location", message: "Location (e.g. US, EU)" },
    ],
    credentialFields: [
      { name: "service_account_json", flag: "serviceAccountJson", message: "Service account JSON" },
      { name: "keyfile_path", flag: "keyfile", message: "Path to service account key file" },
    ],
  },
  {
    value: "databricks",
    label: "Databricks",
    configFields: [
      { name: "hostname", message: "Server hostname", required: true },
      { name: "http_path", flag: "httpPath", message: "HTTP path", required: true },
      { name: "catalog", message: "Catalog name" },
      { name: "schema", message: "Schema name" },
    ],
    credentialFields: [
      { name: "token", message: "Personal access token", secret: true, required: true },
    ],
  },
  {
    value: "duckdb",
    label: "DuckDB",
    configFields: [
      { name: "database_path", flag: "databasePath", message: "Database path (file path, :memory:, or md:db_name for MotherDuck)", required: true },
      { name: "schema", message: "Schema name", default: "main" },
    ],
    credentialFields: [
      { name: "motherduck_token", flag: "motherduckToken", message: "MotherDuck token (required for md: paths)", secret: true },
    ],
  },
];

interface AddOptions {
  // Demo mode
  demo?: boolean;
  // dbt import options
  fromDbt?: boolean | string;
  target?: string;
  all?: boolean;
  defaultTargets?: boolean;
  // Manual add options
  name?: string;
  type?: string;
  // Config fields
  account?: string;
  database?: string;
  schema?: string;
  warehouse?: string;
  role?: string;
  host?: string;
  port?: string;
  projectId?: string;
  dataset?: string;
  location?: string;
  hostname?: string;
  httpPath?: string;
  catalog?: string;
  // Credential fields (direct)
  user?: string;
  password?: string;
  token?: string;
  serviceAccountJson?: string;
  keyfile?: string;
  // DuckDB options
  databasePath?: string;
  motherduckToken?: string;
  // Credential fields (env var reference)
  passwordEnv?: string;
  tokenEnv?: string;
  motherduckTokenEnv?: string;
  // Behavior
  force?: boolean;
}

/**
 * Convert env var name to dbt-style reference
 */
function envVarRef(varName: string): string {
  return `{{ env_var('${varName}') }}`;
}

/**
 * Format warehouse type for display
 */
function formatType(type: string): string {
  const labels: Record<string, string> = {
    snowflake: "Snowflake",
    postgres: "Postgres",
    redshift: "Redshift",
    bigquery: "BigQuery",
    databricks: "Databricks",
    duckdb: "DuckDB",
  };
  return labels[type] || type;
}

/**
 * Get value from options, checking both direct and flag name
 */
function getOptionValue(options: AddOptions, field: FieldDef): string | undefined {
  const flagName = field.flag || field.name;
  // Convert snake_case to camelCase for options lookup
  const camelName = flagName.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  return (options as Record<string, string | undefined>)[camelName];
}

/**
 * Check if running in non-interactive mode (name and type provided via flags)
 */
function isNonInteractive(options: AddOptions): boolean {
  return !!(options.name && options.type);
}

/**
 * Import datasources from dbt profiles.yml
 */
async function importFromDbt(options: AddOptions): Promise<void> {
  const profilesPath = getDefaultProfilesPath();

  if (!dbtProfilesExist(profilesPath)) {
    console.error(pc.red(`dbt profiles not found at ${profilesPath}`));
    console.log(pc.dim("Make sure dbt is configured with ~/.dbt/profiles.yml"));
    process.exit(1);
  }

  let connections: ParsedConnection[];
  try {
    connections = parseDbtProfiles(profilesPath);
  } catch (err) {
    console.error(pc.red(`Failed to parse dbt profiles: ${(err as Error).message}`));
    process.exit(1);
  }

  if (connections.length === 0) {
    console.log(pc.yellow("No supported connections found in dbt profiles."));
    console.log(pc.dim("Supported types: snowflake, postgres, redshift, bigquery, databricks, duckdb"));
    process.exit(0);
  }

  // If specific profile/target provided via --from-dbt <profile>
  if (typeof options.fromDbt === "string") {
    const parts = options.fromDbt.split("/");
    const profileName = parts[0];
    const targetName = options.target || parts[1];

    const filtered = connections.filter((c) => {
      if (c.profileName !== profileName) return false;
      if (targetName) return c.targetName === targetName;
      return c.isDefaultTarget;
    });

    if (filtered.length === 0) {
      console.error(pc.red(`Profile "${profileName}"${targetName ? `/${targetName}` : ""} not found`));
      process.exit(1);
    }

    await importConnections(filtered);
    return;
  }

  // If --all flag, import everything
  if (options.all) {
    await importConnections(connections);
    return;
  }

  // If --default-targets, import only default targets (non-interactive)
  if (options.defaultTargets) {
    const defaults = connections.filter((c) => c.isDefaultTarget);
    await importConnections(defaults);
    return;
  }

  // Interactive mode: multi-select
  const { checkbox } = await prompts();

  console.log();
  console.log(pc.bold(`Found ${connections.length} connections in ~/.dbt/profiles.yml:`));
  console.log();

  // Build choices for checkbox
  const choices = connections.map((conn) => {
    const name = `${conn.profileName}/${conn.targetName}`;
    const typeLabel = formatType(conn.type);
    const defaultLabel = conn.isDefaultTarget ? pc.cyan(" (default)") : "";

    return {
      name: `${name.padEnd(30)} ${typeLabel}${defaultLabel}`,
      value: conn,
      checked: conn.isDefaultTarget,
    };
  });

  const selected = await checkbox({
    message: "Select connections to import:",
    choices,
    pageSize: 15,
  });

  if (selected.length === 0) {
    console.log(pc.yellow("No connections selected."));
    return;
  }

  await importConnections(selected as ParsedConnection[]);
}

/**
 * Import selected connections
 */
async function importConnections(connections: ParsedConnection[]): Promise<void> {
  console.log();

  // Check for git-tracked datasources file
  if (isDatasourcesTrackedByGit()) {
    console.log(
      pc.yellow("Warning: .bon/datasources.yaml is tracked by git. Add it to .gitignore!")
    );
  }

  let imported = 0;
  let skipped = 0;

  for (const conn of connections) {
    const { profileName, targetName } = conn;
    const name = generateDatasourceName(profileName, targetName);

    // Check if already exists
    if (datasourceExists(name)) {
      console.log(pc.dim(`• ${profileName}/${targetName} → ${name} (already exists, skipped)`));
      skipped++;
      continue;
    }

    try {
      const mapped = mapDbtConnection(conn);
      addLocalDatasource(mapped.datasource);

      console.log(pc.green(`✓ ${profileName}/${targetName} → ${name} (${conn.type})`));
      imported++;
    } catch (err) {
      console.log(pc.red(`✗ ${profileName}/${targetName}: ${(err as Error).message}`));
      skipped++;
    }
  }

  console.log();
  if (imported > 0) {
    console.log(pc.green(`Imported ${imported} datasource${imported !== 1 ? "s" : ""}`));
    console.log(pc.dim("  .bon/datasources.yaml"));
  }
  if (skipped > 0) {
    console.log(pc.dim(`Skipped ${skipped} connection${skipped !== 1 ? "s" : ""}`));
  }
}

/**
 * Add datasource manually (with flags and/or interactive prompts)
 */
async function addManual(options: AddOptions): Promise<void> {
  const { input, select, password, confirm } = await prompts();
  const nonInteractive = isNonInteractive(options);

  // Check for git-tracked datasources file
  if (isDatasourcesTrackedByGit()) {
    console.log(
      pc.yellow("Warning: .bon/datasources.yaml is tracked by git. Add it to .gitignore!")
    );
  }

  // Step 1: Get name
  let name = options.name;
  if (!name) {
    name = await input({ message: "Datasource name:" });
  }

  // Check if exists
  if (datasourceExists(name)) {
    if (options.force) {
      console.log(pc.dim(`Overwriting existing datasource "${name}"`));
    } else if (nonInteractive) {
      console.error(pc.red(`Datasource "${name}" already exists. Use --force to overwrite.`));
      process.exit(1);
    } else {
      const overwrite = await confirm({
        message: `Datasource "${name}" already exists. Overwrite?`,
        default: false,
      });
      if (!overwrite) {
        console.log(pc.yellow("Cancelled."));
        return;
      }
    }
  }

  // Step 2: Get type
  let warehouseType = options.type as WarehouseType | undefined;
  if (!warehouseType) {
    warehouseType = await select({
      message: "Warehouse type:",
      choices: WAREHOUSE_CONFIGS.map((w) => ({
        name: w.label,
        value: w.value,
      })),
    });
  }

  // Validate type
  const warehouseConfig = WAREHOUSE_CONFIGS.find((w) => w.value === warehouseType);
  if (!warehouseConfig) {
    console.error(pc.red(`Invalid warehouse type: ${warehouseType}`));
    console.log(pc.dim("Valid types: snowflake, postgres, redshift, bigquery, databricks, duckdb"));
    process.exit(1);
  }

  // Step 3: Collect config fields
  const config: Record<string, string> = {};
  for (const field of warehouseConfig.configFields) {
    let value = getOptionValue(options, field);

    if (!value && !nonInteractive) {
      // Only prompt in interactive mode
      const defaultHint = field.default ? ` (default: ${field.default})` : "";
      value = await input({
        message: field.message + defaultHint + ":",
        default: field.default,
      });
    }

    if (value) {
      config[field.name] = value;
    } else if (field.required) {
      console.error(pc.red(`Missing required field: ${field.name}`));
      process.exit(1);
    }
    // Skip optional fields without values in non-interactive mode
  }

  // Step 4: Collect credentials
  const credentials: Record<string, string> = {};
  for (const field of warehouseConfig.credentialFields) {
    let value: string | undefined;

    // Check for env var reference flags first
    if (field.name === "password" && options.passwordEnv) {
      value = envVarRef(options.passwordEnv);
    } else if (field.name === "token" && options.tokenEnv) {
      value = envVarRef(options.tokenEnv);
    } else if (field.name === "motherduck_token" && options.motherduckTokenEnv) {
      value = envVarRef(options.motherduckTokenEnv);
    } else {
      // Check direct value from flags
      value = getOptionValue(options, field);
    }

    if (!value && !nonInteractive) {
      // Only prompt in interactive mode
      if (field.secret) {
        value = await password({ message: field.message + ":" });
      } else {
        value = await input({ message: field.message + ":" });
      }
    }

    if (value) {
      credentials[field.name] = value;
    } else if (field.required) {
      console.error(pc.red(`Missing required credential: ${field.name}`));
      process.exit(1);
    }
    // Skip optional credentials without values in non-interactive mode
  }

  // Step 5: Save datasource
  const datasource: LocalDatasource = {
    name,
    type: warehouseType,
    source: "manual",
    config,
    credentials,
  };

  addLocalDatasource(datasource);

  console.log();
  console.log(pc.green(`✓ Datasource "${name}" saved to .bon/datasources.yaml`));
  console.log();
  console.log(pc.dim(`Connection will be tested during \`bon deploy\``));
}

/**
 * Add the Contoso demo datasource (read-only retail dataset)
 */
async function addDemo(options: AddOptions): Promise<void> {
  const name = "contoso_demo";

  if (datasourceExists(name) && !options.force) {
    console.log(pc.yellow(`Datasource "${name}" already exists. Use --force to overwrite.`));
    return;
  }

  // Check for git-tracked datasources file
  if (isDatasourcesTrackedByGit()) {
    console.log(
      pc.yellow("Warning: .bon/datasources.yaml is tracked by git. Add it to .gitignore!")
    );
  }

  const datasource: LocalDatasource = {
    name,
    type: "postgres",
    source: "demo",
    config: {
      host: "aws-1-eu-west-1.pooler.supabase.com",
      port: "5432",
      database: "postgres",
      schema: "contoso",
    },
    credentials: {
      username: "demo_reader.yvbfzqogtdsqqkpyztlu",
      password: "contoso-demo-2025!",
    },
  };

  addLocalDatasource(datasource);

  console.log();
  console.log(pc.green(`✓ Demo datasource "${name}" saved to .bon/datasources.yaml`));
  console.log();
  console.log(pc.dim("Contoso is a read-only retail dataset with tables like:"));
  console.log(pc.dim("  fact_sales, dim_product, dim_store, dim_customer"));
  console.log();
  console.log(pc.dim(`Connection will be tested during \`bon deploy\``));
}

/**
 * Main datasource add command
 */
export async function datasourceAddCommand(options: AddOptions = {}): Promise<void> {
  if (options.demo) {
    await addDemo(options);
  } else if (options.fromDbt !== undefined) {
    await importFromDbt(options);
  } else {
    await addManual(options);
  }
}
