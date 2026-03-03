/**
 * Metabase config storage (.bon/metabase.yaml)
 *
 * Stores API key and URL for Metabase connectivity.
 * File has 0o600 permissions since it contains the API key.
 */

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { MetabaseConfig } from "./types.js";
import { ensureBonDir } from "../local/datasources.js";

const BON_DIR = ".bon";
const CONFIG_FILE = "metabase.yaml";

interface MetabaseConfigFile {
  metabase: MetabaseConfig;
}

function getConfigPath(cwd: string = process.cwd()): string {
  return path.join(cwd, BON_DIR, CONFIG_FILE);
}

export function loadMetabaseConfig(cwd: string = process.cwd()): MetabaseConfig | null {
  const filePath = getConfigPath(cwd);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = YAML.parse(content) as MetabaseConfigFile | null;
    return parsed?.metabase ?? null;
  } catch {
    return null;
  }
}

export function saveMetabaseConfig(config: MetabaseConfig, cwd: string = process.cwd()): void {
  ensureBonDir(cwd);
  const filePath = getConfigPath(cwd);

  const file: MetabaseConfigFile = { metabase: config };

  const header = `# Bonnard Metabase configuration
# This file contains an API key - add .bon/ to .gitignore

`;

  const content = header + YAML.stringify(file, { indent: 2 });
  fs.writeFileSync(filePath, content, { mode: 0o600 });
}

export function metabaseConfigExists(cwd: string = process.cwd()): boolean {
  return loadMetabaseConfig(cwd) !== null;
}
