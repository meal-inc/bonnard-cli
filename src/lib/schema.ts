import { z } from "zod";
import YAML from "yaml";

// --- Shared validators ---

const identifier = z.string().regex(
  /^[_a-zA-Z][_a-zA-Z0-9]*$/,
  "must be a valid identifier (letters, numbers, underscores; cannot start with a number)",
);

const refreshKeyInterval = /^\d+\s+(second|minute|hour|day|week)s?$/;

const refreshKeySchema = z.object({
  every: z.string().regex(refreshKeyInterval, {
    message: 'must be a time interval like "1 hour", "30 minute", "1 day"',
  }).optional(),
  sql: z.string().optional(),
});

// --- Enums ---

const measureTypes = [
  "count", "count_distinct", "count_distinct_approx",
  "sum", "avg", "min", "max",
  "number", "string", "time", "boolean",
  "running_total", "number_agg",
] as const;

const dimensionTypes = ["string", "number", "boolean", "time", "geo", "switch"] as const;

const relationshipTypes = ["many_to_one", "one_to_many", "one_to_one"] as const;

const granularities = [
  "second", "minute", "hour", "day", "week", "month", "quarter", "year",
] as const;

const preAggTypes = ["rollup", "original_sql", "rollup_join", "rollup_lambda"] as const;

const formats = ["percent", "currency", "number", "imageUrl", "link", "id"] as const;

// --- Sub-schemas ---

const measureSchema = z.object({
  name: identifier,
  type: z.enum(measureTypes),
  sql: z.string().optional(),
  description: z.string().optional(),
  title: z.string().optional(),
  format: z.enum(formats).optional(),
  public: z.boolean().optional(),
  filters: z.array(z.object({ sql: z.string() })).optional(),
  rolling_window: z.object({
    trailing: z.string().optional(),
    leading: z.string().optional(),
    offset: z.string().optional(),
  }).optional(),
  drill_members: z.array(z.string()).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

const dimensionFormatSchema = z.union([
  z.enum(formats),
  z.string().startsWith("%"),  // POSIX strftime format strings
]);

const dimensionSchema = z.object({
  name: identifier,
  type: z.enum(dimensionTypes),
  sql: z.string().optional(),
  primary_key: z.boolean().optional(),
  sub_query: z.boolean().optional(),
  propagate_filters_to_sub_query: z.boolean().optional(),
  description: z.string().optional(),
  title: z.string().optional(),
  format: dimensionFormatSchema.optional(),
  public: z.boolean().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  // geo type
  latitude: z.object({ sql: z.string() }).optional(),
  longitude: z.object({ sql: z.string() }).optional(),
  // switch type
  case: z.object({
    when: z.array(z.object({
      sql: z.string(),
      label: z.string(),
    })),
    else: z.object({ label: z.string() }).optional(),
  }).optional(),
});

const joinSchema = z.object({
  name: identifier,
  relationship: z.enum(relationshipTypes),
  sql: z.string(),
});

const segmentSchema = z.object({
  name: identifier,
  sql: z.string(),
  description: z.string().optional(),
  title: z.string().optional(),
  public: z.boolean().optional(),
});

const preAggregationSchema = z.object({
  name: identifier,
  type: z.enum(preAggTypes).optional(),
  measures: z.array(z.string()).optional(),
  dimensions: z.array(z.string()).optional(),
  time_dimension: z.string().optional(),
  granularity: z.enum(granularities).optional(),
  partition_granularity: z.enum(granularities).optional(),
  refresh_key: refreshKeySchema.optional(),
  scheduled_refresh: z.boolean().optional(),
});

const hierarchySchema = z.object({
  name: identifier,
  levels: z.array(z.string()),
  title: z.string().optional(),
  public: z.boolean().optional(),
});

// --- Cube schema ---

const cubeSchema = z.object({
  name: identifier,
  sql: z.string().optional(),
  sql_table: z.string().optional(),
  data_source: z.string().optional(),
  extends: z.string().optional(),
  description: z.string().optional(),
  title: z.string().optional(),
  public: z.boolean().optional(),
  refresh_key: refreshKeySchema.optional(),
  measures: z.array(measureSchema).optional(),
  dimensions: z.array(dimensionSchema).optional(),
  joins: z.array(joinSchema).optional(),
  segments: z.array(segmentSchema).optional(),
  pre_aggregations: z.array(preAggregationSchema).optional(),
  hierarchies: z.array(hierarchySchema).optional(),
}).refine(
  (data) => data.sql != null || data.sql_table != null || data.extends != null,
  { message: "sql, sql_table, or extends is required" },
);

// --- View schemas ---

const viewIncludeItemSchema = z.union([
  z.string(),
  z.object({
    name: z.string(),
    alias: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    format: z.string().optional(),
    meta: z.record(z.string(), z.unknown()).optional(),
  }),
]);

const viewCubeRefSchema = z.object({
  join_path: z.string(),
  includes: z.union([z.literal("*"), z.array(viewIncludeItemSchema)]).optional(),
  excludes: z.array(z.string()).optional(),
  prefix: z.boolean().optional(),
});

// Recursive folder schema
interface FolderInput {
  name: string;
  members?: string[];
  folders?: FolderInput[];
}

const folderSchema: z.ZodType<FolderInput> = z.lazy(() =>
  z.object({
    name: z.string(),
    members: z.array(z.string()).optional(),
    folders: z.array(folderSchema).optional(),
  }),
);

const viewMeasureSchema = z.object({
  name: identifier,
  sql: z.string(),
  type: z.string(),
  format: z.string().optional(),
  description: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

const viewDimensionSchema = z.object({
  name: identifier,
  sql: z.string(),
  type: z.string(),
  description: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

const viewSegmentSchema = z.object({
  name: identifier,
  sql: z.string(),
  description: z.string().optional(),
});

const viewSchema = z.object({
  name: identifier,
  description: z.string().optional(),
  title: z.string().optional(),
  public: z.boolean().optional(),
  cubes: z.array(viewCubeRefSchema).optional(),
  measures: z.array(viewMeasureSchema).optional(),
  dimensions: z.array(viewDimensionSchema).optional(),
  segments: z.array(viewSegmentSchema).optional(),
  folders: z.array(folderSchema).optional(),
});

// --- File schema ---

const fileSchema = z.object({
  cubes: z.array(cubeSchema).optional(),
  views: z.array(viewSchema).optional(),
}).refine(
  (data) => (data.cubes && data.cubes.length > 0) || (data.views && data.views.length > 0),
  "File must contain at least one cube or view",
);

// --- Error formatting ---

function formatZodError(error: z.ZodError, fileName: string, parsed: any): string[] {
  return error.issues.map((issue) => {
    const pathParts = issue.path;

    // Try to add the entity name for better context
    let entityContext = "";
    if (pathParts.length >= 2) {
      const collection = pathParts[0] as string;
      const index = pathParts[1] as number;
      const entity = parsed?.[collection]?.[index];
      if (entity?.name) {
        entityContext = ` (${entity.name})`;
      }
    }

    const pathStr = pathParts.join(".");
    const location = pathStr ? `${pathStr}${entityContext}` : "";

    if (issue.code === "invalid_value" && "values" in issue) {
      const expected = (issue.values as string[]).join(", ");
      return `${fileName}: ${location} — invalid value, expected one of: ${expected}`;
    }

    return `${fileName}: ${location ? `${location} — ` : ""}${issue.message}`;
  });
}

// --- View member conflict detection ---

interface CubeMembers {
  measures: string[];
  dimensions: string[];
  segments: string[];
}

function checkViewMemberConflicts(
  parsedFiles: Array<{ fileName: string; parsed: any }>,
  cubeMap: Map<string, CubeMembers>,
): string[] {
  const errors: string[] = [];

  for (const { fileName, parsed } of parsedFiles) {
    for (const view of parsed.views ?? []) {
      if (!view.name || !view.cubes) continue;

      // Seed with directly defined members on the view
      const seen = new Map<string, string>(); // finalName → source
      for (const m of view.measures ?? []) {
        if (m.name) seen.set(m.name, `${view.name} (direct)`);
      }
      for (const d of view.dimensions ?? []) {
        if (d.name) seen.set(d.name, `${view.name} (direct)`);
      }
      for (const s of view.segments ?? []) {
        if (s.name) seen.set(s.name, `${view.name} (direct)`);
      }

      for (const cubeRef of view.cubes) {
        const joinPath: string = cubeRef.join_path;
        if (!joinPath) continue;

        // Last segment of join_path is the target cube name
        const segments = joinPath.split(".");
        const targetCubeName = segments[segments.length - 1];

        // Resolve member names from this cube reference
        let memberNames: string[] = [];

        if (cubeRef.includes === "*") {
          const cube = cubeMap.get(targetCubeName);
          if (!cube) continue; // Can't resolve — skip
          memberNames = [...cube.measures, ...cube.dimensions, ...cube.segments];
        } else if (Array.isArray(cubeRef.includes)) {
          for (const item of cubeRef.includes) {
            if (typeof item === "string") {
              memberNames.push(item);
            } else if (item && typeof item === "object" && item.name) {
              memberNames.push(item.alias || item.name);
            }
          }
        } else {
          continue; // No includes
        }

        // Remove excludes
        if (Array.isArray(cubeRef.excludes)) {
          const excludeSet = new Set(cubeRef.excludes);
          memberNames = memberNames.filter((n) => !excludeSet.has(n));
        }

        // Check for conflicts
        for (const rawName of memberNames) {
          const finalName = cubeRef.prefix
            ? `${targetCubeName}_${rawName}`
            : rawName;

          const existingSource = seen.get(finalName);
          if (existingSource) {
            errors.push(
              `${fileName}: view '${view.name}' — member '${finalName}' from '${joinPath}' conflicts with '${existingSource}'. Use prefix: true or an alias.`,
            );
          } else {
            seen.set(finalName, joinPath);
          }
        }
      }
    }
  }

  return errors;
}

// --- Exported function ---

export interface FileValidationResult {
  errors: string[];
  cubes: string[];
  views: string[];
}

export function validateFiles(
  files: Array<{ fileName: string; content: string }>,
): FileValidationResult {
  const errors: string[] = [];
  const cubes: string[] = [];
  const views: string[] = [];
  const allNames = new Map<string, string>(); // name -> fileName
  const parsedFiles: Array<{ fileName: string; parsed: any }> = [];
  const cubeMap = new Map<string, CubeMembers>();

  for (const file of files) {
    let parsed: any;
    try {
      parsed = YAML.parse(file.content);
    } catch (err: any) {
      errors.push(`${file.fileName}: YAML parse error — ${err.message}`);
      continue;
    }

    if (!parsed || typeof parsed !== "object") {
      errors.push(`${file.fileName}: file is empty or not a YAML object`);
      continue;
    }

    const result = fileSchema.safeParse(parsed);
    if (!result.success) {
      errors.push(...formatZodError(result.error, file.fileName, parsed));
      continue;
    }

    parsedFiles.push({ fileName: file.fileName, parsed });

    // Collect names and check for duplicates
    for (const cube of parsed.cubes ?? []) {
      if (cube.name) {
        const existing = allNames.get(cube.name);
        if (existing) {
          errors.push(`${file.fileName}: duplicate name '${cube.name}' (also defined in ${existing})`);
        } else {
          allNames.set(cube.name, file.fileName);
          cubes.push(cube.name);
          cubeMap.set(cube.name, {
            measures: (cube.measures ?? []).map((m: any) => m.name).filter(Boolean),
            dimensions: (cube.dimensions ?? []).map((d: any) => d.name).filter(Boolean),
            segments: (cube.segments ?? []).map((s: any) => s.name).filter(Boolean),
          });
        }
      }
    }

    for (const view of parsed.views ?? []) {
      if (view.name) {
        const existing = allNames.get(view.name);
        if (existing) {
          errors.push(`${file.fileName}: duplicate name '${view.name}' (also defined in ${existing})`);
        } else {
          allNames.set(view.name, file.fileName);
          views.push(view.name);
        }
      }
    }
  }

  // Check view member conflicts (only if no schema errors so far)
  if (errors.length === 0) {
    errors.push(...checkViewMemberConflicts(parsedFiles, cubeMap));
  }

  return { errors, cubes, views };
}
