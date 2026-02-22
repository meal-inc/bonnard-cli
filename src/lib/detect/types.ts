/**
 * Project environment detection types
 */

import type { WarehouseType } from "../local/types.js";

export interface DetectedTool {
  name: string;
  configPath: string;
  metadata?: Record<string, string>;
}

export interface WarehouseInfo {
  type: WarehouseType;
  source: string; // "dbt-profiles" | "env" | "snowflake-config"
  config: Record<string, string>; // NON-SECRET fields only
}

export interface ProjectEnvironment {
  tools: DetectedTool[];
  warehouse: WarehouseInfo | null;
  existingModels: string[]; // relative paths to data model files (max 20)
}
