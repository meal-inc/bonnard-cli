/**
 * Credential utilities (git tracking check)
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const BON_DIR = ".bon";
const DATASOURCES_FILE = "datasources.yaml";

function getDatasourcesPath(cwd: string = process.cwd()): string {
  return path.join(cwd, BON_DIR, DATASOURCES_FILE);
}

/**
 * Check if datasources file is tracked by git (it shouldn't be - contains credentials)
 */
export function isDatasourcesTrackedByGit(cwd: string = process.cwd()): boolean {
  const filePath = getDatasourcesPath(cwd);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    execFileSync("git", ["ls-files", "--error-unmatch", filePath], {
      cwd,
      stdio: "pipe",
    });
    return true; // File is tracked
  } catch {
    return false; // File is not tracked (or not a git repo)
  }
}
