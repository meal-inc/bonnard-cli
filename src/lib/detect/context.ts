/**
 * Generate dynamic Markdown context from project environment detection.
 * This content is appended to agent files during `bon init`.
 */

import type { ProjectEnvironment } from "./types.js";

/**
 * Generate a Markdown context section from detected project environment.
 * Returns a string with "## This Project" and "## Your Role" sections.
 */
export function generateProjectContext(env: ProjectEnvironment): string {
  const sections: string[] = [];

  // --- This Project ---
  const projectLines: string[] = ["## This Project"];

  // Tools
  if (env.tools.length > 0) {
    projectLines.push("");
    projectLines.push("**Detected tools:**");
    for (const tool of env.tools) {
      const meta = tool.metadata
        ? ` (${Object.entries(tool.metadata).map(([k, v]) => `${k}: ${v}`).join(", ")})`
        : "";
      projectLines.push(`- ${tool.name} — found at \`${tool.configPath}\`${meta}`);
    }
  }

  // Warehouse
  if (env.warehouse) {
    projectLines.push("");
    projectLines.push(`**Warehouse:** ${env.warehouse.type} (detected via ${env.warehouse.source})`);
    const configEntries = Object.entries(env.warehouse.config);
    if (configEntries.length > 0) {
      for (const [key, value] of configEntries) {
        projectLines.push(`- ${key}: \`${value}\``);
      }
    }
  }

  // Model files
  if (env.existingModels.length > 0) {
    projectLines.push("");
    projectLines.push(
      `**Existing model files:** ${env.existingModels.length} file${env.existingModels.length === 1 ? "" : "s"} found`
    );
    for (const modelPath of env.existingModels.slice(0, 10)) {
      projectLines.push(`- \`${modelPath}\``);
    }
    if (env.existingModels.length > 10) {
      projectLines.push(`- ... and ${env.existingModels.length - 10} more`);
    }
  }

  sections.push(projectLines.join("\n"));

  // --- Your Role ---
  const roleLines: string[] = ["## Your Role"];
  roleLines.push("");

  const hasDbt = env.tools.some((t) => t.name === "dbt");
  const hasWarehouse = env.warehouse !== null;
  const dbtTool = env.tools.find((t) => t.name === "dbt");

  if (hasDbt && hasWarehouse) {
    // dbt + warehouse detected
    roleLines.push(
      "This user has an existing dbt project with a warehouse connection. " +
        "Help them create Bonnard cubes that reference their mart/staging tables. " +
        "They can import their connection with `bon datasource add --from-dbt`."
    );
  } else if (hasDbt && !hasWarehouse) {
    // dbt but no profiles.yml found
    roleLines.push(
      "This user has a dbt project but warehouse profiles were not found locally. " +
        "Help them set up a datasource manually with `bon datasource add`, " +
        "or ensure `~/.dbt/profiles.yml` is available and re-run `bon init`."
    );
  } else if (!hasDbt && hasWarehouse) {
    // Warehouse detected from env but no dbt
    roleLines.push(
      "This user has a warehouse connection configured. " +
        "Help them create cubes directly from their database tables."
    );
  } else {
    // Greenfield
    roleLines.push(
      "New project — no existing data tools detected. " +
        "Help them connect a warehouse (`bon datasource add`), then create their first cube."
    );
  }

  // Universal guidance
  roleLines.push("");
  roleLines.push("**Important:**");
  roleLines.push("- Bonnard cubes go in `bonnard/cubes/` and views in `bonnard/views/` — do NOT modify files outside these directories");
  roleLines.push("- Use `bon docs` to look up YAML syntax before writing cube/view definitions");

  if (hasDbt && dbtTool) {
    const dbtDir = dbtTool.configPath.includes("/")
      ? dbtTool.configPath.split("/").slice(0, -1).join("/") + "/"
      : "";
    const modelsPath = dbtDir ? `${dbtDir}models/` : "models/";
    roleLines.push(
      `- dbt models are in \`${modelsPath}\` — these are the user's transformation layer, not Bonnard's. Do not modify them.`
    );
  }

  sections.push(roleLines.join("\n"));

  return sections.join("\n\n");
}
