import fs from "node:fs";
import path from "node:path";
import pc from "picocolors";
import { parse } from "yaml";
import { put } from "../../lib/api.js";
import { stringify } from "yaml";

const VALID_TOP_LEVEL_KEYS = new Set(["palette", "chartHeight", "fontFamily", "colors"]);

export async function themeSetCommand(
  file: string,
  options: { dryRun?: boolean }
) {
  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    console.error(pc.red(`File not found: ${file}`));
    process.exit(1);
  }

  let theme: Record<string, unknown>;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    theme = parse(raw);
  } catch (err) {
    console.error(
      pc.red(
        `Failed to parse ${file}: ${err instanceof Error ? err.message : err}`
      )
    );
    process.exit(1);
  }

  if (!theme || typeof theme !== "object" || Array.isArray(theme)) {
    console.error(pc.red("Theme file must contain a YAML/JSON object."));
    process.exit(1);
  }

  const unknownKeys = Object.keys(theme).filter(
    (k) => !VALID_TOP_LEVEL_KEYS.has(k)
  );
  if (unknownKeys.length > 0) {
    console.error(
      pc.red(
        `Unknown top-level keys: ${unknownKeys.join(", ")}\nAllowed: ${[...VALID_TOP_LEVEL_KEYS].join(", ")}`
      )
    );
    process.exit(1);
  }

  // Validate value types
  const errors: string[] = [];
  if (theme.palette !== undefined) {
    const p = theme.palette;
    if (typeof p !== "string" && !(Array.isArray(p) && p.every((c) => typeof c === "string"))) {
      errors.push("palette must be a string (preset name) or array of color strings");
    }
  }
  if (theme.chartHeight !== undefined) {
    if (typeof theme.chartHeight !== "number" || !isFinite(theme.chartHeight as number) || (theme.chartHeight as number) <= 0) {
      errors.push("chartHeight must be a positive number");
    }
  }
  if (theme.fontFamily !== undefined) {
    if (typeof theme.fontFamily !== "string") {
      errors.push("fontFamily must be a string");
    }
  }
  if (theme.colors !== undefined) {
    if (typeof theme.colors !== "object" || Array.isArray(theme.colors) || theme.colors === null) {
      errors.push("colors must be an object");
    }
  }
  if (errors.length > 0) {
    console.error(pc.red(`Invalid theme values:\n  ${errors.join("\n  ")}`));
    process.exit(1);
  }

  if (options.dryRun) {
    console.log(pc.bold("Theme to be set (dry run):\n"));
    console.log(stringify(theme).trimEnd());
    return;
  }

  try {
    await put("/api/org/theme", { theme });

    console.log(pc.green("Organization theme updated.\n"));

    const summary: string[] = [];
    if (theme.palette) {
      const p = theme.palette;
      if (typeof p === "string") {
        summary.push(`  palette: ${p}`);
      } else if (Array.isArray(p)) {
        summary.push(`  palette: [${p.length} colors]`);
      }
    }
    if (theme.chartHeight != null) {
      summary.push(`  chartHeight: ${theme.chartHeight}`);
    }
    if (theme.colors && typeof theme.colors === "object") {
      const count = Object.keys(theme.colors as object).length;
      summary.push(`  colors: ${count} override${count !== 1 ? "s" : ""}`);
    }
    if (summary.length > 0) {
      console.log(summary.join("\n"));
    }
  } catch (err) {
    console.error(
      pc.red(`Failed to set theme: ${err instanceof Error ? err.message : err}`)
    );
    process.exit(1);
  }
}
