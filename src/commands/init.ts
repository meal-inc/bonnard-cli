import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pc from "picocolors";
import { BONNARD_DIR, getProjectPaths } from "../lib/project.js";
import { detectProjectEnvironment, generateProjectContext } from "../lib/detect/index.js";
import type { ProjectEnvironment } from "../lib/detect/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Templates directory is copied to dist/templates during build
const TEMPLATES_DIR = path.join(__dirname, "..", "templates");

type WriteMode = "init" | "update";

interface FileResult {
  path: string;
  action: "created" | "appended" | "merged" | "updated" | "added" | "unchanged";
}

const BON_YAML_TEMPLATE = (projectName: string) => `project:
  name: ${projectName}
`;

const GITIGNORE_TEMPLATE = `.bon/
`;

/**
 * Load a template file from the templates directory
 */
function loadTemplate(relativePath: string): string {
  const templatePath = path.join(TEMPLATES_DIR, relativePath);
  return fs.readFileSync(templatePath, "utf-8");
}

/**
 * Load a JSON template file
 */
function loadJsonTemplate(relativePath: string): Record<string, unknown> {
  const content = loadTemplate(relativePath);
  return JSON.parse(content);
}

/**
 * Write a template file.
 * - init mode: skip if file contains `# Bonnard`, append if exists without it, create if missing
 * - update mode: overwrite if changed, create if missing
 */
function writeTemplateFile(
  content: string,
  targetPath: string,
  results: FileResult[],
  mode: WriteMode = "init"
): void {
  const relativePath = path.relative(process.cwd(), targetPath);

  if (fs.existsSync(targetPath)) {
    const existingContent = fs.readFileSync(targetPath, "utf-8");

    if (mode === "update") {
      if (existingContent === content) {
        results.push({ action: "unchanged", path: relativePath });
      } else {
        fs.writeFileSync(targetPath, content);
        results.push({ action: "updated", path: relativePath });
      }
    } else {
      if (!existingContent.includes("# Bonnard")) {
        fs.appendFileSync(targetPath, `\n\n${content}`);
        results.push({ action: "appended", path: relativePath });
      }
    }
  } else {
    fs.writeFileSync(targetPath, content);
    results.push({
      action: mode === "update" ? "added" : "created",
      path: relativePath,
    });
  }
}

/**
 * Write a file that may contain user content alongside the Bonnard section.
 * In update mode, replaces only content from `# Bonnard Semantic Layer` onwards,
 * preserving any user content before it. Falls back to overwrite if marker not found.
 */
function writeBonnardSection(
  content: string,
  targetPath: string,
  results: FileResult[],
  mode: WriteMode = "init"
): void {
  const relativePath = path.relative(process.cwd(), targetPath);
  const SECTION_MARKER = "# Bonnard Semantic Layer";

  if (fs.existsSync(targetPath)) {
    const existingContent = fs.readFileSync(targetPath, "utf-8");

    if (mode === "update") {
      const sectionStart = existingContent.indexOf(SECTION_MARKER);
      let newContent: string;

      if (sectionStart > 0) {
        // User content exists before the Bonnard section — preserve it
        const before = existingContent.slice(0, sectionStart).trimEnd();
        newContent = before + "\n\n" + content;
      } else {
        // Section starts at beginning or not found — overwrite
        newContent = content;
      }

      if (existingContent === newContent) {
        results.push({ action: "unchanged", path: relativePath });
      } else {
        fs.writeFileSync(targetPath, newContent);
        results.push({ action: "updated", path: relativePath });
      }
    } else {
      // Init mode: existing behavior
      if (!existingContent.includes("# Bonnard")) {
        fs.appendFileSync(targetPath, `\n\n${content}`);
        results.push({ action: "appended", path: relativePath });
      }
    }
  } else {
    fs.writeFileSync(targetPath, content);
    results.push({
      action: mode === "update" ? "added" : "created",
      path: relativePath,
    });
  }
}

/**
 * Merge settings.json, preserving existing settings
 */
function mergeSettingsJson(
  templateSettings: Record<string, unknown>,
  targetPath: string,
  results: FileResult[],
  mode: WriteMode = "init"
): void {
  const relativePath = path.relative(process.cwd(), targetPath);

  if (fs.existsSync(targetPath)) {
    const existingRaw = fs.readFileSync(targetPath, "utf-8");
    const existingContent = JSON.parse(existingRaw);

    // Merge permissions.allow arrays
    const templatePerms = templateSettings.permissions as Record<string, unknown> | undefined;
    if (templatePerms?.allow) {
      existingContent.permissions = existingContent.permissions || {};
      existingContent.permissions.allow = existingContent.permissions.allow || [];

      for (const permission of templatePerms.allow as string[]) {
        if (!existingContent.permissions.allow.includes(permission)) {
          existingContent.permissions.allow.push(permission);
        }
      }
    }

    const newRaw = JSON.stringify(existingContent, null, 2) + "\n";

    if (mode === "update") {
      if (existingRaw === newRaw) {
        results.push({ action: "unchanged", path: relativePath });
      } else {
        fs.writeFileSync(targetPath, newRaw);
        results.push({ action: "updated", path: relativePath });
      }
    } else {
      fs.writeFileSync(targetPath, newRaw);
      results.push({ action: "merged", path: relativePath });
    }
  } else {
    fs.writeFileSync(targetPath, JSON.stringify(templateSettings, null, 2) + "\n");
    results.push({
      action: mode === "update" ? "added" : "created",
      path: relativePath,
    });
  }
}

/**
 * Add Cursor frontmatter to shared content
 */
function withCursorFrontmatter(
  content: string,
  description: string,
  alwaysApply: boolean
): string {
  const frontmatter = `---
description: "${description}"
alwaysApply: ${alwaysApply}
---

`;
  return frontmatter + content;
}

/**
 * Create agent templates (Claude Code, Cursor, and Codex)
 */
function createAgentTemplates(cwd: string, env?: ProjectEnvironment, mode: WriteMode = "init"): FileResult[] {
  const results: FileResult[] = [];

  // Load shared content and append dynamic project context if detected
  let sharedBonnard = loadTemplate("shared/bonnard.md");
  if (env) {
    sharedBonnard += "\n\n" + generateProjectContext(env);
  }

  // Claude Code files
  const claudeRulesDir = path.join(cwd, ".claude", "rules");
  const claudeSkillsDir = path.join(cwd, ".claude", "skills");

  fs.mkdirSync(claudeRulesDir, { recursive: true });
  fs.mkdirSync(path.join(claudeSkillsDir, "bonnard-get-started"), { recursive: true });
  fs.mkdirSync(path.join(claudeSkillsDir, "bonnard-metabase-migrate"), { recursive: true });
  fs.mkdirSync(path.join(claudeSkillsDir, "bonnard-design-guide"), { recursive: true });
  fs.mkdirSync(path.join(claudeSkillsDir, "bonnard-build-dashboard"), { recursive: true });

  // Claude rules — bonnard.md may have user content, use section replacement
  writeBonnardSection(sharedBonnard, path.join(claudeRulesDir, "bonnard.md"), results, mode);
  writeTemplateFile(
    loadTemplate("claude/skills/bonnard-get-started/SKILL.md"),
    path.join(claudeSkillsDir, "bonnard-get-started", "SKILL.md"),
    results, mode
  );
  writeTemplateFile(
    loadTemplate("claude/skills/bonnard-metabase-migrate/SKILL.md"),
    path.join(claudeSkillsDir, "bonnard-metabase-migrate", "SKILL.md"),
    results, mode
  );
  writeTemplateFile(
    loadTemplate("claude/skills/bonnard-design-guide/SKILL.md"),
    path.join(claudeSkillsDir, "bonnard-design-guide", "SKILL.md"),
    results, mode
  );
  writeTemplateFile(
    loadTemplate("claude/skills/bonnard-build-dashboard/SKILL.md"),
    path.join(claudeSkillsDir, "bonnard-build-dashboard", "SKILL.md"),
    results, mode
  );
  mergeSettingsJson(
    loadJsonTemplate("claude/settings.json"),
    path.join(cwd, ".claude", "settings.json"),
    results, mode
  );

  // Cursor files
  const cursorRulesDir = path.join(cwd, ".cursor", "rules");
  fs.mkdirSync(cursorRulesDir, { recursive: true });

  // Cursor rules (with frontmatter)
  writeTemplateFile(
    withCursorFrontmatter(sharedBonnard, "Bonnard semantic layer project context", true),
    path.join(cursorRulesDir, "bonnard.mdc"),
    results, mode
  );
  writeTemplateFile(
    loadTemplate("cursor/rules/bonnard-get-started.mdc"),
    path.join(cursorRulesDir, "bonnard-get-started.mdc"),
    results, mode
  );
  writeTemplateFile(
    loadTemplate("cursor/rules/bonnard-metabase-migrate.mdc"),
    path.join(cursorRulesDir, "bonnard-metabase-migrate.mdc"),
    results, mode
  );
  writeTemplateFile(
    loadTemplate("cursor/rules/bonnard-design-guide.mdc"),
    path.join(cursorRulesDir, "bonnard-design-guide.mdc"),
    results, mode
  );
  writeTemplateFile(
    loadTemplate("cursor/rules/bonnard-build-dashboard.mdc"),
    path.join(cursorRulesDir, "bonnard-build-dashboard.mdc"),
    results, mode
  );

  // Codex files (OpenAI)
  const codexSkillsDir = path.join(cwd, ".agents", "skills");
  fs.mkdirSync(path.join(codexSkillsDir, "bonnard-get-started"), { recursive: true });
  fs.mkdirSync(path.join(codexSkillsDir, "bonnard-metabase-migrate"), { recursive: true });
  fs.mkdirSync(path.join(codexSkillsDir, "bonnard-design-guide"), { recursive: true });
  fs.mkdirSync(path.join(codexSkillsDir, "bonnard-build-dashboard"), { recursive: true });

  // AGENTS.md in project root — may have user content, use section replacement
  writeBonnardSection(sharedBonnard, path.join(cwd, "AGENTS.md"), results, mode);

  // Codex skills (same format as Claude skills)
  writeTemplateFile(
    loadTemplate("claude/skills/bonnard-get-started/SKILL.md"),
    path.join(codexSkillsDir, "bonnard-get-started", "SKILL.md"),
    results, mode
  );
  writeTemplateFile(
    loadTemplate("claude/skills/bonnard-metabase-migrate/SKILL.md"),
    path.join(codexSkillsDir, "bonnard-metabase-migrate", "SKILL.md"),
    results, mode
  );
  writeTemplateFile(
    loadTemplate("claude/skills/bonnard-design-guide/SKILL.md"),
    path.join(codexSkillsDir, "bonnard-design-guide", "SKILL.md"),
    results, mode
  );
  writeTemplateFile(
    loadTemplate("claude/skills/bonnard-build-dashboard/SKILL.md"),
    path.join(codexSkillsDir, "bonnard-build-dashboard", "SKILL.md"),
    results, mode
  );

  return results;
}

function formatFileResult(result: FileResult): string {
  switch (result.action) {
    case "appended": return `${result.path} (appended)`;
    case "merged": return `${result.path} (merged)`;
    default: return result.path;
  }
}

export async function initCommand(options: { update?: boolean } = {}) {
  const cwd = process.cwd();
  const paths = getProjectPaths(cwd);

  if (options.update) {
    if (!fs.existsSync(paths.config)) {
      console.log(pc.red("No bon.yaml found. Run `bon init` first."));
      process.exit(1);
    }

    const env = detectProjectEnvironment(cwd);
    const results = createAgentTemplates(
      cwd,
      env.tools.length > 0 || env.warehouse ? env : undefined,
      "update"
    );

    const updated = results.filter(r => r.action === "updated");
    const added = results.filter(r => r.action === "added");

    if (updated.length === 0 && added.length === 0) {
      console.log(pc.green("All agent templates are up to date."));
    } else {
      const parts: string[] = [];
      if (updated.length > 0) parts.push(`updated ${updated.length} file${updated.length !== 1 ? "s" : ""}`);
      if (added.length > 0) parts.push(`added ${added.length} new file${added.length !== 1 ? "s" : ""}`);
      console.log(pc.green(`Agent templates: ${parts.join(", ")}.`));
      for (const r of [...updated, ...added]) {
        const label = r.action === "added" ? pc.cyan("new") : pc.yellow("updated");
        console.log(`  ${label} ${pc.dim(r.path)}`);
      }
    }
    return;
  }

  const projectName = path.basename(cwd);

  if (fs.existsSync(paths.config)) {
    console.log(pc.red("A bon.yaml already exists in this directory."));
    process.exit(1);
  }

  // Create core project structure under bonnard/
  fs.mkdirSync(paths.cubes, { recursive: true });
  fs.mkdirSync(paths.views, { recursive: true });
  fs.mkdirSync(paths.localState, { recursive: true });

  fs.writeFileSync(paths.config, BON_YAML_TEMPLATE(projectName));
  fs.writeFileSync(path.join(cwd, ".gitignore"), GITIGNORE_TEMPLATE);

  // Detect project environment
  const env = detectProjectEnvironment(cwd);

  // Create agent templates with dynamic context
  const agentFiles = createAgentTemplates(cwd, env.tools.length > 0 || env.warehouse ? env : undefined);

  console.log(pc.green(`Initialised Bonnard project "${projectName}"`));
  console.log();
  console.log(pc.bold("Core files:"));
  console.log(`  ${pc.dim("bon.yaml")}                project config`);
  console.log(`  ${pc.dim(`${BONNARD_DIR}/cubes/`)}       cube definitions`);
  console.log(`  ${pc.dim(`${BONNARD_DIR}/views/`)}       view definitions`);
  console.log(`  ${pc.dim(".bon/")}                   local state (gitignored)`);
  console.log(`  ${pc.dim(".gitignore")}              git ignore rules`);

  if (agentFiles.length > 0) {
    console.log();
    console.log(pc.bold("Agent support:"));
    for (const file of agentFiles) {
      console.log(`  ${pc.dim(formatFileResult(file))}`);
    }
  }

  if (env.tools.length > 0 || env.warehouse) {
    console.log();
    console.log(pc.bold("Detected environment:"));
    for (const tool of env.tools) {
      console.log(`  ${pc.cyan(tool.name)} ${pc.dim(`(${tool.configPath})`)}`);
    }
    if (env.warehouse) {
      console.log(`  ${pc.cyan(env.warehouse.type)} warehouse ${pc.dim(`(via ${env.warehouse.source})`)}`);
    }
  }
}
