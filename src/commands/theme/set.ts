import fs from "node:fs";
import path from "node:path";
import pc from "picocolors";
import { parse } from "yaml";
import { put } from "../../lib/api.js";
import { stringify } from "yaml";

const VALID_TOP_LEVEL_KEYS = new Set(["palette", "chartHeight", "colors"]);

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
      summary.push(
        `  palette: ${typeof p === "string" ? p : `[${(p as string[]).length} colors]`}`
      );
    }
    if (theme.chartHeight) summary.push(`  chartHeight: ${theme.chartHeight}`);
    if (theme.colors) {
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
