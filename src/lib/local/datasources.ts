/**
 * Local datasource storage (.bon/datasources.yaml)
 *
 * Single file containing both config and credentials.
 * Credentials may contain:
 * - Plain values: "my_password"
 * - dbt env var syntax: "{{ env_var('MY_PASSWORD') }}"
 *
 * Env vars are resolved at deploy time, not import time.
 */

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { LocalDatasource, DatasourcesFile } from "./types.js";

const BON_DIR = ".bon";
const DATASOURCES_FILE = "datasources.yaml";

function getBonDir(cwd: string = process.cwd()): string {
  return path.join(cwd, BON_DIR);
}

function getDatasourcesPath(cwd: string = process.cwd()): string {
  return path.join(getBonDir(cwd), DATASOURCES_FILE);
}

/**
 * Ensure .bon directory exists
 */
export function ensureBonDir(cwd: string = process.cwd()): void {
  const bonDir = getBonDir(cwd);
  if (!fs.existsSync(bonDir)) {
    fs.mkdirSync(bonDir, { recursive: true });
  }
}

/**
 * Load all local datasources
 */
export function loadLocalDatasources(cwd: string = process.cwd()): LocalDatasource[] {
  const filePath = getDatasourcesPath(cwd);

  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = YAML.parse(content) as DatasourcesFile | null;
    return parsed?.datasources ?? [];
  } catch {
    return [];
  }
}

/**
 * Save all local datasources (with secure permissions since it contains credentials)
 */
export function saveLocalDatasources(
  datasources: LocalDatasource[],
  cwd: string = process.cwd()
): void {
  ensureBonDir(cwd);
  const filePath = getDatasourcesPath(cwd);

  const file: DatasourcesFile = { datasources };

  // Add header comment
  const header = `# Bonnard datasources configuration
# This file contains credentials - add to .gitignore
# Env vars like {{ env_var('PASSWORD') }} are resolved at deploy time

`;

  const content = header + YAML.stringify(file, { indent: 2 });

  // Write with secure permissions (owner read/write only)
  fs.writeFileSync(filePath, content, { mode: 0o600 });
}

/**
 * Add a single datasource (updates existing or appends new)
 */
export function addLocalDatasource(
  datasource: LocalDatasource,
  cwd: string = process.cwd()
): void {
  const existing = loadLocalDatasources(cwd);
  const index = existing.findIndex((ds) => ds.name === datasource.name);

  if (index >= 0) {
    existing[index] = datasource;
  } else {
    existing.push(datasource);
  }

  saveLocalDatasources(existing, cwd);
}

/**
 * Remove a datasource by name
 */
export function removeLocalDatasource(name: string, cwd: string = process.cwd()): boolean {
  const existing = loadLocalDatasources(cwd);
  const filtered = existing.filter((ds) => ds.name !== name);

  if (filtered.length === existing.length) {
    return false; // Not found
  }

  saveLocalDatasources(filtered, cwd);
  return true;
}

/**
 * Get a single datasource by name
 */
export function getLocalDatasource(
  name: string,
  cwd: string = process.cwd()
): LocalDatasource | null {
  const datasources = loadLocalDatasources(cwd);
  return datasources.find((ds) => ds.name === name) ?? null;
}

/**
 * Check if a datasource name already exists locally
 */
export function datasourceExists(name: string, cwd: string = process.cwd()): boolean {
  return getLocalDatasource(name, cwd) !== null;
}

/**
 * Resolve {{ env_var('VAR_NAME') }} patterns in credentials
 * Used at deploy time to resolve env vars before uploading
 */
export function resolveEnvVarsInCredentials(
  credentials: Record<string, string>
): { resolved: Record<string, string>; missing: string[] } {
  const resolved: Record<string, string> = {};
  const missing: string[] = [];
  const envVarPattern = /\{\{\s*env_var\(['"]([\w_]+)['"]\)\s*\}\}/;

  for (const [key, value] of Object.entries(credentials)) {
    const match = value.match(envVarPattern);
    if (match) {
      const varName = match[1];
      const envValue = process.env[varName];
      if (envValue !== undefined) {
        resolved[key] = envValue;
      } else {
        missing.push(varName);
        resolved[key] = value; // Keep original if not resolved
      }
    } else {
      resolved[key] = value;
    }
  }

  return { resolved, missing };
}
