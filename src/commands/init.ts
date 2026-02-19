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
 * Write a template file, appending if target exists and doesn't already have Bonnard content
 */
function writeTemplateFile(
  content: string,
  targetPath: string,
  createdFiles: string[]
): void {
  if (fs.existsSync(targetPath)) {
    const existingContent = fs.readFileSync(targetPath, "utf-8");
    if (!existingContent.includes("# Bonnard")) {
      fs.appendFileSync(targetPath, `\n\n${content}`);
      createdFiles.push(`${path.relative(process.cwd(), targetPath)} (appended)`);
    }
  } else {
    fs.writeFileSync(targetPath, content);
    createdFiles.push(path.relative(process.cwd(), targetPath));
  }
}

/**
 * Merge settings.json, preserving existing settings
 */
function mergeSettingsJson(
  templateSettings: Record<string, unknown>,
  targetPath: string,
  createdFiles: string[]
): void {
  if (fs.existsSync(targetPath)) {
    const existingContent = JSON.parse(fs.readFileSync(targetPath, "utf-8"));

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

    fs.writeFileSync(targetPath, JSON.stringify(existingContent, null, 2) + "\n");
    createdFiles.push(`${path.relative(process.cwd(), targetPath)} (merged)`);
  } else {
    fs.writeFileSync(targetPath, JSON.stringify(templateSettings, null, 2) + "\n");
    createdFiles.push(path.relative(process.cwd(), targetPath));
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
function createAgentTemplates(cwd: string, env?: ProjectEnvironment): string[] {
  const createdFiles: string[] = [];

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

  // Claude rules (no frontmatter needed)
  writeTemplateFile(sharedBonnard, path.join(claudeRulesDir, "bonnard.md"), createdFiles);
  writeTemplateFile(
    loadTemplate("claude/skills/bonnard-get-started/SKILL.md"),
    path.join(claudeSkillsDir, "bonnard-get-started", "SKILL.md"),
    createdFiles
  );
  writeTemplateFile(
    loadTemplate("claude/skills/bonnard-metabase-migrate/SKILL.md"),
    path.join(claudeSkillsDir, "bonnard-metabase-migrate", "SKILL.md"),
    createdFiles
  );
  writeTemplateFile(
    loadTemplate("claude/skills/bonnard-design-guide/SKILL.md"),
    path.join(claudeSkillsDir, "bonnard-design-guide", "SKILL.md"),
    createdFiles
  );
  mergeSettingsJson(
    loadJsonTemplate("claude/settings.json"),
    path.join(cwd, ".claude", "settings.json"),
    createdFiles
  );

  // Cursor files
  const cursorRulesDir = path.join(cwd, ".cursor", "rules");
  fs.mkdirSync(cursorRulesDir, { recursive: true });

  // Cursor rules (with frontmatter)
  writeTemplateFile(
    withCursorFrontmatter(sharedBonnard, "Bonnard semantic layer project context", true),
    path.join(cursorRulesDir, "bonnard.mdc"),
    createdFiles
  );
  writeTemplateFile(
    loadTemplate("cursor/rules/bonnard-get-started.mdc"),
    path.join(cursorRulesDir, "bonnard-get-started.mdc"),
    createdFiles
  );
  writeTemplateFile(
    loadTemplate("cursor/rules/bonnard-metabase-migrate.mdc"),
    path.join(cursorRulesDir, "bonnard-metabase-migrate.mdc"),
    createdFiles
  );
  writeTemplateFile(
    loadTemplate("cursor/rules/bonnard-design-guide.mdc"),
    path.join(cursorRulesDir, "bonnard-design-guide.mdc"),
    createdFiles
  );

  // Codex files (OpenAI)
  const codexSkillsDir = path.join(cwd, ".agents", "skills");
  fs.mkdirSync(path.join(codexSkillsDir, "bonnard-get-started"), { recursive: true });
  fs.mkdirSync(path.join(codexSkillsDir, "bonnard-metabase-migrate"), { recursive: true });
  fs.mkdirSync(path.join(codexSkillsDir, "bonnard-design-guide"), { recursive: true });

  // AGENTS.md in project root (Codex reads this like CLAUDE.md)
  // Append if exists without Bonnard content, create if missing (same as Claude rules)
  writeTemplateFile(sharedBonnard, path.join(cwd, "AGENTS.md"), createdFiles);

  // Codex skills (same format as Claude skills)
  writeTemplateFile(
    loadTemplate("claude/skills/bonnard-get-started/SKILL.md"),
    path.join(codexSkillsDir, "bonnard-get-started", "SKILL.md"),
    createdFiles
  );
  writeTemplateFile(
    loadTemplate("claude/skills/bonnard-metabase-migrate/SKILL.md"),
    path.join(codexSkillsDir, "bonnard-metabase-migrate", "SKILL.md"),
    createdFiles
  );
  writeTemplateFile(
    loadTemplate("claude/skills/bonnard-design-guide/SKILL.md"),
    path.join(codexSkillsDir, "bonnard-design-guide", "SKILL.md"),
    createdFiles
  );

  return createdFiles;
}

export async function initCommand() {
  const cwd = process.cwd();
  const projectName = path.basename(cwd);
  const paths = getProjectPaths(cwd);

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
      console.log(`  ${pc.dim(file)}`);
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
