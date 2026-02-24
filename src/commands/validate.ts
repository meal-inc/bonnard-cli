import fs from "node:fs";
import pc from "picocolors";
import { getProjectPaths, BONNARD_DIR } from "../lib/project.js";

export async function validateCommand() {
  const cwd = process.cwd();
  const paths = getProjectPaths(cwd);

  if (!fs.existsSync(paths.config)) {
    console.log(pc.red("No bon.yaml found. Are you in a Bonnard project?"));
    process.exit(1);
  }

  // Step 1: Validate cube and view files
  const { validate } = await import("../lib/validate.js");
  const result = await validate(cwd);

  if (result.cubes.length === 0 && result.views.length === 0 && result.valid) {
    console.log(pc.yellow(`No cube or view files found in ${BONNARD_DIR}/cubes/ or ${BONNARD_DIR}/views/.`));
    return;
  }

  if (!result.valid) {
    console.log(pc.red("Validation failed:\n"));
    for (const err of result.errors) {
      console.log(pc.red(`  • ${err}`));
    }
    process.exit(1);
  }

  console.log(pc.green("Validation passed."));
  console.log();

  if (result.cubes.length > 0) {
    console.log(`  ${pc.dim("Cubes")}  (${result.cubes.length}): ${result.cubes.join(", ")}`);
  }
  if (result.views.length > 0) {
    console.log(`  ${pc.dim("Views")}  (${result.views.length}): ${result.views.join(", ")}`);
  }

  // Warn about missing descriptions
  if (result.missingDescriptions.length > 0) {
    console.log();
    console.log(pc.yellow(`⚠ ${result.missingDescriptions.length} items missing descriptions`));
    console.log(pc.dim("  Descriptions help AI agents and analysts discover the right metrics."));

    // Group by parent (cube/view) for cleaner output
    const byParent = new Map<string, string[]>();
    for (const m of result.missingDescriptions) {
      const list = byParent.get(m.parent) || [];
      // For cube/view level, show the type; for members, just show the name
      const label = m.type === "cube" || m.type === "view" ? `(${m.type})` : m.name;
      list.push(label);
      byParent.set(m.parent, list);
    }
    for (const [parent, items] of byParent) {
      console.log(pc.dim(`  ${parent}: ${items.join(", ")}`));
    }
  }

  // Warn about cubes missing data_source
  if (result.cubesMissingDataSource.length > 0) {
    console.log();
    console.log(pc.yellow(`⚠ ${result.cubesMissingDataSource.length} cube(s) missing data_source`));
    console.log(pc.dim("  Without an explicit data_source, cubes use the default warehouse."));
    console.log(pc.dim("  This can cause issues when multiple warehouses are configured."));
    console.log(pc.dim(`  ${result.cubesMissingDataSource.join(", ")}`));
  }

  // Warn about suspect primary keys (time dimensions as PK)
  if (result.suspectPrimaryKeys.length > 0) {
    console.log();
    console.log(pc.yellow(`⚠ ${result.suspectPrimaryKeys.length} primary key(s) on time dimensions`));
    console.log(pc.dim("  Time dimensions are rarely unique. Non-unique primary keys cause dimension"));
    console.log(pc.dim("  queries to silently return empty results. Use a unique column or add a"));
    console.log(pc.dim("  ROW_NUMBER() synthetic key via the cube's sql property."));
    for (const s of result.suspectPrimaryKeys) {
      console.log(pc.dim(`  ${s.cube}.${s.dimension} (type: ${s.type})`));
    }
  }
}
