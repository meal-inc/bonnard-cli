/**
 * Map dbt profile config to Bonnard datasource format
 *
 * Values are copied as-is, including {{ env_var(...) }} patterns.
 * Env vars are resolved at deploy time, not import time.
 */

import type { LocalDatasource, WarehouseType } from "../local/types.js";
import type { ParsedConnection, DbtTarget } from "./profiles.js";

export interface MappedDatasource {
  datasource: LocalDatasource;
}

/**
 * Generate a datasource name from profile/target
 */
export function generateDatasourceName(profileName: string, targetName: string): string {
  return `${profileName}-${targetName}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

/**
 * Extract string value from config, handling numbers
 */
function getString(config: DbtTarget, key: string): string | undefined {
  const value = config[key];
  if (value === undefined || value === null) return undefined;
  return String(value);
}

/**
 * Map Snowflake dbt config to Bonnard format
 */
function mapSnowflake(config: DbtTarget): { config: Record<string, string>; credentials: Record<string, string> } {
  return {
    config: {
      ...(getString(config, "account") && { account: getString(config, "account")! }),
      ...(getString(config, "database") && { database: getString(config, "database")! }),
      ...(getString(config, "warehouse") && { warehouse: getString(config, "warehouse")! }),
      ...(getString(config, "schema") && { schema: getString(config, "schema")! }),
      ...(getString(config, "role") && { role: getString(config, "role")! }),
    },
    credentials: {
      ...(getString(config, "user") && { username: getString(config, "user")! }),
      ...(getString(config, "password") && { password: getString(config, "password")! }),
    },
  };
}

/**
 * Map Postgres dbt config to Bonnard format
 */
function mapPostgres(config: DbtTarget): { config: Record<string, string>; credentials: Record<string, string> } {
  const database = getString(config, "dbname") || getString(config, "database");

  return {
    config: {
      ...(getString(config, "host") && { host: getString(config, "host")! }),
      ...(getString(config, "port") && { port: getString(config, "port")! }),
      ...(database && { database }),
      ...(getString(config, "schema") && { schema: getString(config, "schema")! }),
      ...(getString(config, "sslmode") && { sslmode: getString(config, "sslmode")! }),
    },
    credentials: {
      ...(getString(config, "user") && { username: getString(config, "user")! }),
      ...(getString(config, "password") && { password: getString(config, "password")! }),
    },
  };
}

/**
 * Map BigQuery dbt config to Bonnard format
 */
function mapBigQuery(config: DbtTarget): { config: Record<string, string>; credentials: Record<string, string> } {
  const credentials: Record<string, string> = {};

  // Handle keyfile (path to JSON file) or keyfile_json (inline JSON)
  if (config.keyfile && typeof config.keyfile === "string") {
    try {
      const fs = require("node:fs");
      const keyfileContent = fs.readFileSync(config.keyfile, "utf-8");
      credentials.service_account_json = keyfileContent;
    } catch {
      credentials.keyfile_path = config.keyfile;
    }
  } else if (config.keyfile_json) {
    credentials.service_account_json = JSON.stringify(config.keyfile_json);
  }

  return {
    config: {
      ...(getString(config, "project") && { project_id: getString(config, "project")! }),
      ...(getString(config, "dataset") && { dataset: getString(config, "dataset")! }),
      ...(getString(config, "location") && { location: getString(config, "location")! }),
    },
    credentials,
  };
}

/**
 * Map Databricks dbt config to Bonnard format
 */
function mapDatabricks(config: DbtTarget): { config: Record<string, string>; credentials: Record<string, string> } {
  return {
    config: {
      ...(getString(config, "host") && { hostname: getString(config, "host")! }),
      ...(getString(config, "http_path") && { http_path: getString(config, "http_path")! }),
      ...(getString(config, "catalog") && { catalog: getString(config, "catalog")! }),
      ...(getString(config, "schema") && { schema: getString(config, "schema")! }),
    },
    credentials: {
      ...(getString(config, "token") && { token: getString(config, "token")! }),
    },
  };
}

/**
 * Map a parsed dbt connection to Bonnard format
 * Values are copied as-is, including {{ env_var(...) }} patterns
 */
export function mapDbtConnection(connection: ParsedConnection): MappedDatasource {
  const { profileName, targetName, type, config } = connection;

  let mapped: { config: Record<string, string>; credentials: Record<string, string> };

  switch (type) {
    case "snowflake":
      mapped = mapSnowflake(config);
      break;
    case "postgres":
      mapped = mapPostgres(config);
      break;
    case "bigquery":
      mapped = mapBigQuery(config);
      break;
    case "databricks":
      mapped = mapDatabricks(config);
      break;
    default:
      throw new Error(`Unsupported warehouse type: ${type}`);
  }

  return {
    datasource: {
      name: generateDatasourceName(profileName, targetName),
      type,
      source: "dbt",
      dbtProfile: profileName,
      dbtTarget: targetName,
      config: mapped.config,
      credentials: mapped.credentials,
    },
  };
}
