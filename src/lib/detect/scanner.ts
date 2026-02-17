/**
 * Project environment scanner
 *
 * Detects data tools (dbt, dagster, etc.), warehouse connections,
 * and existing model files in the user's project directory.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import YAML from "yaml";
import { parseDbtProfiles, dbtProfilesExist } from "../dbt/profiles.js";
import type { DetectedTool, WarehouseInfo, ProjectEnvironment } from "./types.js";
import type { WarehouseType } from "../local/types.js";

// Tool detection rules: filename -> tool name
const CONFIG_FILES: Record<string, string> = {
  "dbt_project.yml": "dbt",
  "dagster.yaml": "dagster",
  "prefect.yaml": "prefect",
  "evidence.config.yaml": "evidence",
  "cube.js": "cube",
  "cube.py": "cube",
  "manifest.lkml": "looker",
  "airflow.cfg": "airflow",
};

// Directory presence -> tool name
const CONFIG_DIRS: Record<string, string> = {
  dags: "airflow",
  great_expectations: "great-expectations",
  gx: "great-expectations",
};

// Subdirectories to check (1-level deep scan)
const SCAN_DIRS = [
  "dbt",
  "transform",
  "analytics",
  "data",
  "warehouse",
  "data-warehouse",
  "orchestration",
  "dagster",
  "airflow",
];

// Python packages -> tool name
const PYTHON_PACKAGES: Record<string, string> = {
  "dbt-core": "dbt",
  "dbt-snowflake": "dbt",
  "dbt-postgres": "dbt",
  "dbt-bigquery": "dbt",
  "dbt-databricks": "dbt",
  dagster: "dagster",
  sqlmesh: "sqlmesh",
  "apache-airflow": "airflow",
  prefect: "prefect",
  "soda-core": "soda",
};

// npm packages -> tool name (prefix matching)
const NPM_PACKAGES: Record<string, string> = {
  "@cubejs-backend/": "cube",
  "@evidence-dev/": "evidence",
};

// Safe (non-secret) config fields to extract from dbt profiles
const SAFE_DBT_FIELDS = [
  "account",
  "host",
  "database",
  "dbname",
  "schema",
  "warehouse",
  "role",
  "port",
  "project",
  "dataset",
  "location",
  "hostname",
  "http_path",
  "catalog",
];

// Env var patterns for warehouse detection
const ENV_WAREHOUSE_PATTERNS: { pattern: RegExp; type: WarehouseType; source: string }[] = [
  { pattern: /^CUBEJS_DB_TYPE=(.+)$/m, type: "snowflake", source: "env" },
  { pattern: /^SNOWFLAKE_ACCOUNT=(.+)$/m, type: "snowflake", source: "env" },
  { pattern: /^PGHOST=(.+)$/m, type: "postgres", source: "env" },
  { pattern: /^DATABASE_URL=postgres/m, type: "postgres", source: "env" },
];

/**
 * Scan root and subdirs for known config files/directories
 */
function scanForConfigFiles(cwd: string): DetectedTool[] {
  const tools: DetectedTool[] = [];
  const seen = new Set<string>();

  function checkDir(dir: string, prefix: string) {
    // Check config files
    for (const [filename, toolName] of Object.entries(CONFIG_FILES)) {
      if (seen.has(toolName)) continue;
      const filePath = path.join(dir, filename);
      if (fs.existsSync(filePath)) {
        const relativePath = prefix ? `${prefix}/${filename}` : filename;
        tools.push({ name: toolName, configPath: relativePath });
        seen.add(toolName);
      }
    }

    // Check config directories
    for (const [dirname, toolName] of Object.entries(CONFIG_DIRS)) {
      if (seen.has(toolName)) continue;
      const dirPath = path.join(dir, dirname);
      try {
        if (fs.statSync(dirPath).isDirectory()) {
          const relativePath = prefix ? `${prefix}/${dirname}/` : `${dirname}/`;
          tools.push({ name: toolName, configPath: relativePath });
          seen.add(toolName);
        }
      } catch {
        // Does not exist
      }
    }
  }

  // Phase 1: root
  checkDir(cwd, "");

  // Phase 2: 1-level deep subdirs
  for (const subdir of SCAN_DIRS) {
    const subdirPath = path.join(cwd, subdir);
    try {
      if (fs.statSync(subdirPath).isDirectory()) {
        checkDir(subdirPath, subdir);
      }
    } catch {
      // Does not exist
    }
  }

  return tools;
}

/**
 * Scan dependency files for known data tool packages
 */
function scanDependencyFiles(cwd: string): DetectedTool[] {
  const tools: DetectedTool[] = [];

  // Python: pyproject.toml
  const pyprojectPath = path.join(cwd, "pyproject.toml");
  if (fs.existsSync(pyprojectPath)) {
    try {
      const content = fs.readFileSync(pyprojectPath, "utf-8");
      for (const [pkg, toolName] of Object.entries(PYTHON_PACKAGES)) {
        if (content.includes(pkg)) {
          tools.push({ name: toolName, configPath: "pyproject.toml" });
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  // Python: requirements.txt
  const requirementsPath = path.join(cwd, "requirements.txt");
  if (fs.existsSync(requirementsPath)) {
    try {
      const content = fs.readFileSync(requirementsPath, "utf-8");
      for (const [pkg, toolName] of Object.entries(PYTHON_PACKAGES)) {
        // Match package name at start of line or after whitespace
        if (content.includes(pkg)) {
          tools.push({ name: toolName, configPath: "requirements.txt" });
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  // JavaScript: package.json
  const packageJsonPath = path.join(cwd, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const content = fs.readFileSync(packageJsonPath, "utf-8");
      const pkg = JSON.parse(content);
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      for (const depName of Object.keys(allDeps)) {
        for (const [prefix, toolName] of Object.entries(NPM_PACKAGES)) {
          if (depName.startsWith(prefix)) {
            tools.push({ name: toolName, configPath: "package.json" });
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  return tools;
}

/**
 * Deduplicate tools by name, keeping the first occurrence (config file > dependency)
 */
function deduplicateTools(tools: DetectedTool[]): DetectedTool[] {
  const seen = new Set<string>();
  return tools.filter((tool) => {
    if (seen.has(tool.name)) return false;
    seen.add(tool.name);
    return true;
  });
}

/**
 * Extract safe (non-secret) fields from a config object.
 * If a value looks like a dbt env_var reference, record it as "via env: VAR_NAME".
 */
function extractSafeFields(config: Record<string, unknown>): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const field of SAFE_DBT_FIELDS) {
    const value = config[field];
    if (value === undefined || value === null) continue;
    const strValue = String(value);
    // Detect {{ env_var('X') }} patterns
    const envMatch = strValue.match(/\{\{\s*env_var\s*\(\s*['"]([^'"]+)['"]/);
    if (envMatch) {
      safe[field] = `via env: ${envMatch[1]}`;
    } else {
      safe[field] = strValue;
    }
  }
  return safe;
}

/**
 * Try to extract warehouse info from dbt profiles
 */
function extractWarehouseFromDbt(cwd: string, tools: DetectedTool[]): WarehouseInfo | null {
  const dbtTool = tools.find((t) => t.name === "dbt");
  if (!dbtTool) return null;

  // Read dbt_project.yml to get profile name
  const dbtProjectPath = path.join(cwd, dbtTool.configPath);
  let profileName: string | undefined;

  try {
    const content = fs.readFileSync(dbtProjectPath, "utf-8");
    const parsed = YAML.parse(content) as Record<string, unknown>;
    profileName = parsed?.profile as string | undefined;

    // Also store dbt project name as metadata
    const projectName = parsed?.name as string | undefined;
    if (projectName) {
      dbtTool.metadata = { ...dbtTool.metadata, project: projectName };
    }
    if (profileName) {
      dbtTool.metadata = { ...dbtTool.metadata, profile: profileName };
    }
  } catch {
    // Can't read dbt_project.yml
  }

  if (!dbtProfilesExist()) return null;

  try {
    const connections = parseDbtProfiles();

    // Find the matching profile's default target
    let connection = profileName
      ? connections.find((c) => c.profileName === profileName && c.isDefaultTarget)
      : null;

    // Fallback: just use the first connection
    if (!connection && connections.length > 0) {
      connection = connections[0];
    }

    if (!connection) return null;

    return {
      type: connection.type,
      source: "dbt-profiles",
      config: extractSafeFields(connection.config as unknown as Record<string, unknown>),
    };
  } catch {
    return null;
  }
}

/**
 * Try to extract warehouse info from .env file
 */
function extractWarehouseFromEnv(cwd: string): WarehouseInfo | null {
  const envPath = path.join(cwd, ".env");
  if (!fs.existsSync(envPath)) return null;

  try {
    const content = fs.readFileSync(envPath, "utf-8");

    // Check CUBEJS_DB_TYPE first (explicit type declaration)
    const cubeDbType = content.match(/^CUBEJS_DB_TYPE=(.+)$/m);
    if (cubeDbType) {
      const typeMap: Record<string, WarehouseType> = {
        snowflake: "snowflake",
        postgres: "postgres",
        redshift: "redshift",
        bigquery: "bigquery",
        databricks: "databricks",
      };
      const type = typeMap[cubeDbType[1].trim().toLowerCase()];
      if (type) {
        return { type, source: "env", config: { CUBEJS_DB_TYPE: cubeDbType[1].trim() } };
      }
    }

    // Check for specific warehouse env vars
    if (content.match(/^SNOWFLAKE_ACCOUNT=/m)) {
      const account = content.match(/^SNOWFLAKE_ACCOUNT=(.+)$/m);
      return {
        type: "snowflake",
        source: "env",
        config: account ? { account: account[1].trim() } : {},
      };
    }

    if (content.match(/^PGHOST=/m) || content.match(/^DATABASE_URL=postgres/m)) {
      return { type: "postgres", source: "env", config: {} };
    }
  } catch {
    // Ignore read errors
  }

  return null;
}

/**
 * Extract warehouse info from detected tools and environment
 */
function extractWarehouseInfo(cwd: string, tools: DetectedTool[]): WarehouseInfo | null {
  const hasDbt = tools.some((t) => t.name === "dbt");

  // Try dbt first (most specific) — only if dbt was detected in this project
  if (hasDbt) {
    const fromDbt = extractWarehouseFromDbt(cwd, tools);
    if (fromDbt) return fromDbt;
  }

  // Try .env file
  return extractWarehouseFromEnv(cwd);
}

/**
 * Collect existing model files from detected tool directories.
 * Non-recursive scan of likely model dirs, capped at 20 paths.
 */
function collectModelFiles(cwd: string, tools: DetectedTool[]): string[] {
  const modelFiles: string[] = [];
  const extensions = new Set([".sql", ".yml", ".yaml", ".lkml"]);

  // Determine model directories based on detected tools
  const modelDirSet = new Set<string>();

  for (const tool of tools) {
    if (tool.name === "dbt") {
      // dbt models are typically in models/ relative to dbt_project.yml
      const dbtDir = path.dirname(path.join(cwd, tool.configPath));
      modelDirSet.add(path.join(dbtDir, "models"));
    } else if (tool.name === "looker") {
      const lookDir = path.dirname(path.join(cwd, tool.configPath));
      modelDirSet.add(lookDir);
    }
  }

  // Also check common model directories
  for (const dir of ["models", "marts", "staging", "intermediate"]) {
    modelDirSet.add(path.join(cwd, dir));
  }

  for (const dir of modelDirSet) {
    if (modelFiles.length >= 20) break;
    try {
      if (!fs.statSync(dir).isDirectory()) continue;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (modelFiles.length >= 20) break;
        if (entry.isFile() && extensions.has(path.extname(entry.name))) {
          modelFiles.push(path.relative(cwd, path.join(dir, entry.name)));
        }
        // 1-level deep: check subdirectories
        if (entry.isDirectory()) {
          try {
            const subEntries = fs.readdirSync(path.join(dir, entry.name), { withFileTypes: true });
            for (const subEntry of subEntries) {
              if (modelFiles.length >= 20) break;
              if (subEntry.isFile() && extensions.has(path.extname(subEntry.name))) {
                modelFiles.push(path.relative(cwd, path.join(dir, entry.name, subEntry.name)));
              }
            }
          } catch {
            // Ignore
          }
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  return modelFiles;
}

/**
 * Detect the project environment by scanning for data tools,
 * warehouse connections, and existing model files.
 */
export function detectProjectEnvironment(cwd: string): ProjectEnvironment {
  // Phase 1+2: file/directory existence checks
  const configTools = scanForConfigFiles(cwd);

  // Phase 3: dependency file scan
  const depTools = scanDependencyFiles(cwd);

  // Deduplicate (config file matches take priority)
  const tools = deduplicateTools([...configTools, ...depTools]);

  // Phase 4: warehouse extraction
  const warehouse = extractWarehouseInfo(cwd, tools);

  // Collect existing model files
  const existingModels = collectModelFiles(cwd, tools);

  return { tools, warehouse, existingModels };
}
