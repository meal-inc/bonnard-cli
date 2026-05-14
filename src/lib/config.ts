import fs from "node:fs";
import { parse } from "yaml";
import { getProjectPaths } from "./project.js";

export interface BonConfig {
  project?: { name?: string };
  mode?: string;
  url?: string;
  admin_token?: string;
}

let cachedConfig: BonConfig | null | undefined;

/**
 * Parse bon.yaml from the working directory.
 * Returns null if the file doesn't exist or can't be parsed.
 */
export function loadConfig(cwd?: string): BonConfig | null {
  if (cachedConfig !== undefined) return cachedConfig;

  const paths = getProjectPaths(cwd || process.cwd());
  try {
    const raw = fs.readFileSync(paths.config, "utf-8");
    cachedConfig = (parse(raw) as BonConfig) || null;
  } catch {
    cachedConfig = null;
  }
  return cachedConfig;
}

/**
 * Check if the project is running in self-hosted mode.
 * Checks BON_MODE env var first, then bon.yaml.
 */
export function isSelfHosted(config: BonConfig | null): boolean {
  if (process.env.BON_MODE === "self-hosted") return true;
  return config?.mode === "self-hosted";
}

/**
 * Resolve the base URL for API requests.
 * Priority: BON_APP_URL env var > bon.yaml `url` > default.
 */
export function getBaseUrl(config: BonConfig | null): string {
  if (isSelfHosted(config)) {
    return process.env.BON_APP_URL || config?.url || "http://localhost:3000";
  }
  return process.env.BON_APP_URL || "https://app.bonnard.dev";
}

/**
 * Resolve the MCP server URL.
 * Self-hosted: {baseUrl}/mcp.
 * Cloud: https://mcp.bonnard.dev/mcp.
 */
export function getMcpUrl(config: BonConfig | null): string {
  if (isSelfHosted(config)) {
    return `${getBaseUrl(config)}/mcp`;
  }
  return "https://mcp.bonnard.dev/mcp";
}
