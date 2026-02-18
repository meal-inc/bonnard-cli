/**
 * dbt profiles.yml parser
 *
 * Parses ~/.dbt/profiles.yml and extracts connection configs.
 * Does NOT resolve env vars - they are kept as-is for deploy time resolution.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import YAML from "yaml";
import type { WarehouseType } from "../local/types.js";

const DBT_PROFILES_PATH = path.join(os.homedir(), ".dbt", "profiles.yml");

export interface DbtTarget {
  type: string;
  [key: string]: unknown;
}

export interface DbtProfile {
  target: string; // Default target name
  outputs: Record<string, DbtTarget>;
}

export interface DbtProfilesFile {
  [profileName: string]: DbtProfile;
}

export interface ParsedConnection {
  profileName: string;
  targetName: string;
  isDefaultTarget: boolean;
  type: WarehouseType;
  config: DbtTarget;
}

/**
 * Check if dbt profiles.yml exists
 */
export function dbtProfilesExist(profilesPath: string = DBT_PROFILES_PATH): boolean {
  return fs.existsSync(profilesPath);
}

/**
 * Get the default dbt profiles path
 */
export function getDefaultProfilesPath(): string {
  return DBT_PROFILES_PATH;
}

/**
 * Map dbt type to Bonnard warehouse type
 */
function mapDbtType(dbtType: string): WarehouseType | null {
  const typeMap: Record<string, WarehouseType> = {
    snowflake: "snowflake",
    postgres: "postgres",
    postgresql: "postgres",
    redshift: "redshift",
    bigquery: "bigquery",
    databricks: "databricks",
  };

  return typeMap[dbtType.toLowerCase()] ?? null;
}

/**
 * Parse dbt profiles.yml and return all connections
 * Config values are kept as-is (including {{ env_var(...) }} patterns)
 */
export function parseDbtProfiles(
  profilesPath: string = DBT_PROFILES_PATH
): ParsedConnection[] {
  if (!fs.existsSync(profilesPath)) {
    throw new Error(`dbt profiles not found at ${profilesPath}`);
  }

  const content = fs.readFileSync(profilesPath, "utf-8");
  const profiles = YAML.parse(content) as DbtProfilesFile;

  if (!profiles || typeof profiles !== "object") {
    throw new Error("Invalid dbt profiles.yml format");
  }

  const connections: ParsedConnection[] = [];

  for (const [profileName, profile] of Object.entries(profiles)) {
    // Skip config key if present
    if (profileName === "config") continue;

    if (!profile.outputs || typeof profile.outputs !== "object") {
      continue;
    }

    const defaultTarget = profile.target || "dev";

    for (const [targetName, target] of Object.entries(profile.outputs)) {
      if (!target || typeof target !== "object" || !target.type) {
        continue;
      }

      const warehouseType = mapDbtType(target.type as string);
      if (!warehouseType) {
        // Unsupported warehouse type, skip
        continue;
      }

      connections.push({
        profileName,
        targetName,
        isDefaultTarget: targetName === defaultTarget,
        type: warehouseType,
        config: target,
      });
    }
  }

  return connections;
}

/**
 * Get a specific connection by profile/target
 */
export function getDbtConnection(
  profileName: string,
  targetName?: string,
  profilesPath: string = DBT_PROFILES_PATH
): ParsedConnection | null {
  const connections = parseDbtProfiles(profilesPath);

  if (targetName) {
    return (
      connections.find(
        (c) => c.profileName === profileName && c.targetName === targetName
      ) ?? null
    );
  }

  // If no target specified, return the default target
  return (
    connections.find(
      (c) => c.profileName === profileName && c.isDefaultTarget
    ) ?? null
  );
}

/**
 * List all available profiles (with their targets)
 */
export function listDbtProfiles(
  profilesPath: string = DBT_PROFILES_PATH
): Map<string, { defaultTarget: string; targets: string[] }> {
  const connections = parseDbtProfiles(profilesPath);
  const profiles = new Map<string, { defaultTarget: string; targets: string[] }>();

  for (const conn of connections) {
    const existing = profiles.get(conn.profileName);
    if (existing) {
      existing.targets.push(conn.targetName);
      if (conn.isDefaultTarget) {
        existing.defaultTarget = conn.targetName;
      }
    } else {
      profiles.set(conn.profileName, {
        defaultTarget: conn.isDefaultTarget ? conn.targetName : "dev",
        targets: [conn.targetName],
      });
    }
  }

  return profiles;
}
