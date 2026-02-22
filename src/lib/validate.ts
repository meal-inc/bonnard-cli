import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { getProjectPaths } from "./project.js";
import { validateFiles } from "./schema.js";

export interface SuspectPrimaryKey {
  cube: string;
  dimension: string;
  type: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  cubes: string[];
  views: string[];
  missingDescriptions: MissingDescription[];
  cubesMissingDataSource: string[];
  suspectPrimaryKeys: SuspectPrimaryKey[];
}

export interface MissingDescription {
  parent: string;
  type: "cube" | "view" | "measure" | "dimension";
  name: string;
}

interface FileContent {
  fileName: string;
  content: string;
}

function collectYamlFiles(dir: string, rootDir: string): FileContent[] {
  if (!fs.existsSync(dir)) return [];

  const results: FileContent[] = [];

  function walk(current: string) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith(".yaml") || entry.name.endsWith(".yml")) {
        results.push({
          fileName: path.relative(rootDir, fullPath),
          content: fs.readFileSync(fullPath, "utf-8"),
        });
      }
    }
  }

  walk(dir);
  return results;
}

function checkMissingDescriptions(files: FileContent[]): MissingDescription[] {
  const missing: MissingDescription[] = [];

  for (const file of files) {
    try {
      const parsed = YAML.parse(file.content);
      if (!parsed) continue;

      // Check cubes
      const cubes = parsed.cubes || [];
      for (const cube of cubes) {
        if (!cube.name) continue;

        // cube-level description
        if (!cube.description) {
          missing.push({ parent: cube.name, type: "cube", name: cube.name });
        }

        // Check measures
        const measures = cube.measures || [];
        for (const measure of measures) {
          if (measure.name && !measure.description) {
            missing.push({ parent: cube.name, type: "measure", name: measure.name });
          }
        }

        // Check dimensions
        const dimensions = cube.dimensions || [];
        for (const dimension of dimensions) {
          if (dimension.name && !dimension.description) {
            missing.push({ parent: cube.name, type: "dimension", name: dimension.name });
          }
        }
      }

      // Check views
      const views = parsed.views || [];
      for (const view of views) {
        if (!view.name) continue;

        if (!view.description) {
          missing.push({ parent: view.name, type: "view", name: view.name });
        }
      }
    } catch {
      // Skip files that fail to parse (will be caught by schema validation)
    }
  }

  return missing;
}

function checkSuspectPrimaryKeys(files: FileContent[]): SuspectPrimaryKey[] {
  const suspects: SuspectPrimaryKey[] = [];

  for (const file of files) {
    try {
      const parsed = YAML.parse(file.content);
      if (!parsed) continue;

      for (const cube of parsed.cubes || []) {
        if (!cube.name) continue;
        for (const dim of cube.dimensions || []) {
          if (dim.primary_key && dim.type === "time") {
            suspects.push({ cube: cube.name, dimension: dim.name, type: dim.type });
          }
        }
      }
    } catch {
      // Skip — parse errors caught by schema validation
    }
  }

  return suspects;
}

function checkMissingDataSource(files: FileContent[]): string[] {
  const missing: string[] = [];

  for (const file of files) {
    try {
      const parsed = YAML.parse(file.content);
      if (!parsed) continue;

      for (const cube of parsed.cubes || []) {
        if (cube.name && !cube.data_source) {
          missing.push(cube.name);
        }
      }
    } catch {
      // Skip — parse errors caught by schema validation
    }
  }

  return missing;
}

export async function validate(projectPath: string): Promise<ValidationResult> {
  const paths = getProjectPaths(projectPath);
  const files = [
    ...collectYamlFiles(paths.cubes, projectPath),
    ...collectYamlFiles(paths.views, projectPath),
  ];

  if (files.length === 0) {
    return { valid: true, errors: [], cubes: [], views: [], missingDescriptions: [], cubesMissingDataSource: [], suspectPrimaryKeys: [] };
  }

  const result = validateFiles(files);

  if (result.errors.length > 0) {
    return {
      valid: false,
      errors: result.errors,
      cubes: [],
      views: [],
      missingDescriptions: [],
      cubesMissingDataSource: [],
      suspectPrimaryKeys: [],
    };
  }

  const missingDescriptions = checkMissingDescriptions(files);
  const cubesMissingDataSource = checkMissingDataSource(files);
  const suspectPrimaryKeys = checkSuspectPrimaryKeys(files);

  return {
    valid: true,
    errors: [],
    cubes: result.cubes,
    views: result.views,
    missingDescriptions,
    cubesMissingDataSource,
    suspectPrimaryKeys,
  };
}
