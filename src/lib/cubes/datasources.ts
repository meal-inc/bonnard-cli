/**
 * Extract datasource references from cube and view files
 */

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { getProjectPaths } from "../project.js";

interface CubeDefinition {
  name: string;
  data_source?: string;
  [key: string]: unknown;
}

interface ModelFile {
  cubes?: CubeDefinition[];
  views?: CubeDefinition[];
}

/**
 * Collect all YAML files from a directory recursively
 */
function collectYamlFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const results: string[] = [];

  function walk(current: string) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith(".yaml") || entry.name.endsWith(".yml")) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}

/**
 * Parse a single model file and extract datasource references
 */
function extractFromFile(filePath: string): Map<string, string[]> {
  const datasourceToCubes = new Map<string, string[]>();

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = YAML.parse(content) as ModelFile | null;

    if (!parsed) return datasourceToCubes;

    // Check cubes
    if (parsed.cubes) {
      for (const cube of parsed.cubes) {
        const ds = cube.data_source || "default";
        const existing = datasourceToCubes.get(ds) || [];
        existing.push(cube.name);
        datasourceToCubes.set(ds, existing);
      }
    }

    // Check views
    if (parsed.views) {
      for (const view of parsed.views) {
        if (view.data_source) {
          const existing = datasourceToCubes.get(view.data_source) || [];
          existing.push(view.name);
          datasourceToCubes.set(view.data_source, existing);
        }
      }
    }
  } catch {
    // Ignore parse errors - validate command will catch them
  }

  return datasourceToCubes;
}

export interface DatasourceReference {
  name: string;
  cubes: string[];
}

/**
 * Extract all unique datasource references from bonnard/cubes/ and bonnard/views/ directories
 * Returns datasource names mapped to the cubes that use them
 */
export function extractDatasourcesFromCubes(projectPath: string): DatasourceReference[] {
  const paths = getProjectPaths(projectPath);
  const cubesDir = paths.cubes;
  const viewsDir = paths.views;

  const allFiles = [...collectYamlFiles(cubesDir), ...collectYamlFiles(viewsDir)];

  // Aggregate all datasources across files
  const aggregated = new Map<string, string[]>();

  for (const file of allFiles) {
    const fileRefs = extractFromFile(file);
    for (const [ds, cubes] of fileRefs) {
      const existing = aggregated.get(ds) || [];
      existing.push(...cubes);
      aggregated.set(ds, existing);
    }
  }

  // Convert to array, excluding "default" since that's the default datasource
  const results: DatasourceReference[] = [];
  for (const [name, cubes] of aggregated) {
    if (name !== "default") {
      results.push({ name, cubes });
    }
  }

  return results;
}
