import path from "node:path";
import fs from "node:fs";

/**
 * The subdirectory name used for Bonnard cube/view files.
 * Keeps Bonnard files namespaced to avoid conflicts with existing
 * project directories (e.g. dbt's models/).
 */
export const BONNARD_DIR = "bonnard";

/**
 * Resolve Bonnard project paths relative to the working directory.
 * All cube/view operations should use these paths.
 */
export function getProjectPaths(cwd: string) {
  const bonnardRoot = path.join(cwd, BONNARD_DIR);
  return {
    /** The bonnard/ directory root */
    root: bonnardRoot,
    /** bonnard/cubes/ — cube definitions */
    cubes: path.join(bonnardRoot, "cubes"),
    /** bonnard/views/ — view definitions */
    views: path.join(bonnardRoot, "views"),
    /** bon.yaml — project config (lives in cwd, not bonnard/) */
    config: path.join(cwd, "bon.yaml"),
    /** .bon/ — local state (lives in cwd, not bonnard/) */
    localState: path.join(cwd, ".bon"),
  };
}

/**
 * Check if a bon.yaml exists in the working directory
 */
export function hasProjectConfig(cwd: string): boolean {
  return fs.existsSync(path.join(cwd, "bon.yaml"));
}
