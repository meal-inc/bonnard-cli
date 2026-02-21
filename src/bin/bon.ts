#!/usr/bin/env node
import { createRequire } from "node:module";
import { program } from "commander";
import { startUpdateCheck } from "../lib/update-check.js";
import { initCommand } from "../commands/init.js";

const require = createRequire(import.meta.url);
const { version } = require("../../package.json");
import { loginCommand } from "../commands/login.js";
import { logoutCommand } from "../commands/logout.js";
import { whoamiCommand } from "../commands/whoami.js";
import { datasourceAddCommand } from "../commands/datasource/add.js";
import { datasourceListCommand } from "../commands/datasource/list.js";
import { datasourceRemoveCommand } from "../commands/datasource/remove.js";
import { validateCommand } from "../commands/validate.js";
import { deployCommand } from "../commands/deploy.js";
import { deploymentsCommand } from "../commands/deployments.js";
import { annotateCommand } from "../commands/annotate.js";
import { pullCommand } from "../commands/pull.js";
import { diffCommand } from "../commands/diff.js";
import { mcpCommand } from "../commands/mcp.js";
import { mcpTestCommand } from "../commands/mcp-test.js";
import { docsCommand, docsSchemaCommand } from "../commands/docs.js";
import { cubeQueryCommand } from "../commands/cube/query.js";
import { metabaseConnectCommand } from "../commands/metabase/connect.js";
import { metabaseExploreCommand } from "../commands/metabase/explore.js";
import { metabaseAnalyzeCommand } from "../commands/metabase/analyze.js";
import { keysListCommand } from "../commands/keys/list.js";
import { keysCreateCommand } from "../commands/keys/create.js";
import { keysRevokeCommand } from "../commands/keys/revoke.js";

program
  .name("bon")
  .description("Bonnard semantic layer CLI")
  .version(version);

program
  .command("init")
  .description("Create bon.yaml, bonnard/cubes/, bonnard/views/, .bon/, and agent templates (.claude/, .cursor/)")
  .action(initCommand);

program
  .command("login")
  .description("Authenticate with Bonnard via your browser")
  .action(loginCommand);

program
  .command("logout")
  .description("Remove stored credentials")
  .action(logoutCommand);

program
  .command("whoami")
  .description("Show current login status")
  .option("--verify", "Verify session is still valid with the server")
  .action(whoamiCommand);

const datasource = program
  .command("datasource")
  .description("Manage warehouse data source connections");

datasource
  .command("add")
  .description("Add a data source to .bon/datasources.yaml. Use --name and --type together for non-interactive mode")
  // Demo mode
  .option("--demo", "Add a read-only demo datasource (Contoso retail dataset) for testing")
  // dbt import options
  .option("--from-dbt [profile]", "Import from dbt profiles.yml (optionally specify profile/target)")
  .option("--target <target>", "Target name when using --from-dbt")
  .option("--all", "Import all connections from dbt profiles")
  .option("--default-targets", "Import only default targets from dbt profiles (non-interactive)")
  // Manual add options
  .option("--name <name>", "Datasource name (required for non-interactive mode)")
  .option("--type <type>", "Warehouse type: snowflake, postgres, redshift, bigquery, databricks, duckdb (required for non-interactive mode)")
  // Snowflake options
  .option("--account <account>", "Snowflake account identifier")
  .option("--database <database>", "Database name")
  .option("--schema <schema>", "Schema name")
  .option("--warehouse <warehouse>", "Warehouse name (Snowflake)")
  .option("--role <role>", "Role (Snowflake)")
  // Postgres options
  .option("--host <host>", "Host (Postgres)")
  .option("--port <port>", "Port (Postgres, default: 5432)")
  // BigQuery options
  .option("--project-id <projectId>", "GCP Project ID (BigQuery)")
  .option("--dataset <dataset>", "Dataset name (BigQuery)")
  .option("--location <location>", "Location (BigQuery)")
  // Databricks options
  .option("--hostname <hostname>", "Server hostname (Databricks)")
  .option("--http-path <httpPath>", "HTTP path (Databricks)")
  .option("--catalog <catalog>", "Catalog name (Databricks)")
  // DuckDB options
  .option("--database-path <databasePath>", "Database path: file path, :memory:, or md:db_name for MotherDuck (DuckDB)")
  .option("--motherduck-token <token>", "MotherDuck token (DuckDB, for md: paths)")
  .option("--motherduck-token-env <varName>", "Env var name for MotherDuck token, stores as {{ env_var('NAME') }}")
  // Credentials (direct value)
  .option("--user <user>", "Username")
  .option("--password <password>", "Password (use --password-env for env var reference)")
  .option("--token <token>", "Access token (use --token-env for env var reference)")
  .option("--service-account-json <json>", "Service account JSON (BigQuery)")
  .option("--keyfile <path>", "Path to service account key file (BigQuery)")
  // Credentials (env var reference - stores {{ env_var('X') }})
  .option("--password-env <varName>", "Env var name for password, stores as {{ env_var('NAME') }}")
  .option("--token-env <varName>", "Env var name for token, stores as {{ env_var('NAME') }}")
  // Behavior options
  .option("--force", "Overwrite existing datasource without prompting")
  .action(datasourceAddCommand);

datasource
  .command("list")
  .description("List data sources (shows both local and remote by default)")
  .option("--local", "Show only local data sources from .bon/datasources.yaml")
  .option("--remote", "Show only remote data sources from Bonnard server (requires login)")
  .action(datasourceListCommand);

datasource
  .command("remove")
  .description("Remove a data source from .bon/datasources.yaml (local by default)")
  .argument("<name>", "Data source name")
  .option("--remote", "Remove from Bonnard server instead of local (requires login)")
  .action(datasourceRemoveCommand);

program
  .command("validate")
  .description("Validate YAML syntax in bonnard/cubes/ and bonnard/views/")
  .action(validateCommand);

program
  .command("deploy")
  .description("Deploy cubes and views to Bonnard. Requires login, validates, syncs datasources")
  .option("--ci", "Non-interactive mode")
  .requiredOption("-m, --message <text>", "Deploy message describing your changes")
  .action(deployCommand);

program
  .command("pull")
  .description("Download deployed cubes and views from Bonnard")
  .action(pullCommand);

program
  .command("deployments")
  .description("List deployment history")
  .option("--all", "Show all deployments (default: last 10)")
  .option("--format <format>", "Output format: table or json", "table")
  .action(deploymentsCommand);

program
  .command("diff")
  .description("Show changes in a deployment")
  .argument("<id>", "Deployment ID")
  .option("--format <format>", "Output format: table or json", "table")
  .option("--breaking", "Show only breaking changes")
  .action(diffCommand);

program
  .command("annotate")
  .description("Annotate deployment changes with reasoning")
  .argument("<id>", "Deployment ID")
  .option("--data <json>", "Annotations JSON")
  .action(annotateCommand);

const mcp = program
  .command("mcp")
  .description("MCP connection info and setup instructions")
  .action(mcpCommand);

mcp
  .command("test")
  .description("Test MCP server connectivity")
  .action(mcpTestCommand);

program
  .command("query")
  .description("Execute a query against the deployed semantic layer")
  .argument("<query>", "JSON query or SQL (with --sql flag)")
  .option("--sql", "Use SQL API instead of JSON format")
  .option("--limit <limit>", "Max rows to return")
  .option("--format <format>", "Output format: toon or json", "toon")
  .action(cubeQueryCommand);

const docs = program
  .command("docs")
  .description("Browse documentation for building cubes and views")
  .argument("[topic]", "Topic to display (e.g., cubes, cubes.measures)")
  .option("-r, --recursive", "Show topic and all child topics")
  .option("-s, --search <query>", "Search topics for a keyword")
  .option("-f, --format <format>", "Output format: markdown or json", "markdown")
  .action(docsCommand);

docs
  .command("schema")
  .description("Show JSON schema for a type (cube, view, measure, etc.)")
  .argument("<type>", "Schema type to display")
  .action(docsSchemaCommand);

const keys = program
  .command("keys")
  .description("Manage API keys for the Bonnard SDK");

keys
  .command("list")
  .description("List all API keys for your organization")
  .action(keysListCommand);

keys
  .command("create")
  .description("Create a new API key")
  .requiredOption("--name <name>", "Key name (e.g. 'Production SDK')")
  .requiredOption("--type <type>", "Key type: publishable or secret")
  .action(keysCreateCommand);

keys
  .command("revoke")
  .description("Revoke an API key by name or prefix")
  .argument("<name-or-prefix>", "Key name or key prefix to revoke")
  .action(keysRevokeCommand);

const metabase = program
  .command("metabase")
  .description("Connect to and explore Metabase content");

metabase
  .command("connect")
  .description("Configure Metabase API connection")
  .option("--url <url>", "Metabase instance URL")
  .option("--api-key <key>", "Metabase API key")
  .option("--force", "Overwrite existing configuration")
  .action(metabaseConnectCommand);

metabase
  .command("explore")
  .description("Browse Metabase databases, collections, cards, and dashboards")
  .argument("[resource]", "databases, collections, cards, dashboards, card, dashboard, database, table, collection")
  .argument("[id]", "Resource ID (e.g. card <id>, dashboard <id>, database <id>, table <id>, collection <id>)")
  .action(metabaseExploreCommand);

metabase
  .command("analyze")
  .description("Analyze Metabase instance and generate a structured report for semantic layer planning")
  .option("--output <path>", "Output file path", ".bon/metabase-analysis.md")
  .option("--top-cards <n>", "Number of top cards to include in report", "50")
  .action(metabaseAnalyzeCommand);

// Start update check in background (cached, non-blocking)
const showUpdateNotice = startUpdateCheck(version);

await program.parseAsync();
await showUpdateNotice();
