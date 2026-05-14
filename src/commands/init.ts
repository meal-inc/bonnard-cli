import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { select } from "@inquirer/prompts";
import pc from "picocolors";
import { BONNARD_DIR, getProjectPaths } from "../lib/project.js";
import { detectProjectEnvironment, generateProjectContext } from "../lib/detect/index.js";
import type { ProjectEnvironment } from "../lib/detect/types.js";

const AGENTS = ["claude", "cursor", "codex", "windsurf", "copilot", "cline"] as const;
type Agent = typeof AGENTS[number];

const AGENT_LABELS: Record<Agent, string> = {
  claude: "Claude Code",
  cursor: "Cursor",
  codex: "Codex (OpenAI)",
  windsurf: "Windsurf",
  copilot: "GitHub Copilot",
  cline: "Cline",
};

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

const BON_YAML_SELF_HOSTED_TEMPLATE = (projectName: string) => `project:
  name: ${projectName}
mode: self-hosted
url: http://localhost
`;

const GITIGNORE_TEMPLATE = `.bon/
`;

const GITIGNORE_SELF_HOSTED_TEMPLATE = `.bon/
.env
data/
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
 * Skill names — shared across all agents that support the SKILL.md format
 */
const SKILL_NAMES = [
  "bonnard-get-started",
  "bonnard-metabase-migrate",
  "bonnard-design-guide",
  "bonnard-build-dashboard",
] as const;

/**
 * Write skills into a directory. Reuses Claude SKILL.md templates (cross-agent standard).
 */
function writeSkills(skillsDir: string, results: FileResult[], mode: WriteMode): void {
  for (const name of SKILL_NAMES) {
    fs.mkdirSync(path.join(skillsDir, name), { recursive: true });
    writeTemplateFile(
      loadTemplate(`claude/skills/${name}/SKILL.md`),
      path.join(skillsDir, name, "SKILL.md"),
      results, mode
    );
  }
}

// --- Per-agent generators ---

function createClaudeTemplates(cwd: string, sharedBonnard: string, results: FileResult[], mode: WriteMode): void {
  const rulesDir = path.join(cwd, ".claude", "rules");
  const skillsDir = path.join(cwd, ".claude", "skills");
  fs.mkdirSync(rulesDir, { recursive: true });

  writeBonnardSection(sharedBonnard, path.join(rulesDir, "bonnard.md"), results, mode);
  writeSkills(skillsDir, results, mode);
  mergeSettingsJson(
    loadJsonTemplate("claude/settings.json"),
    path.join(cwd, ".claude", "settings.json"),
    results, mode
  );
}

function createCursorTemplates(cwd: string, sharedBonnard: string, results: FileResult[], mode: WriteMode): void {
  const rulesDir = path.join(cwd, ".cursor", "rules");
  fs.mkdirSync(rulesDir, { recursive: true });

  writeTemplateFile(
    withCursorFrontmatter(sharedBonnard, "Bonnard semantic layer project context", true),
    path.join(rulesDir, "bonnard.mdc"),
    results, mode
  );
  for (const name of SKILL_NAMES) {
    writeTemplateFile(
      loadTemplate(`cursor/rules/${name}.mdc`),
      path.join(rulesDir, `${name}.mdc`),
      results, mode
    );
  }
}

function createCodexTemplates(cwd: string, sharedBonnard: string, results: FileResult[], mode: WriteMode): void {
  const skillsDir = path.join(cwd, ".agents", "skills");

  writeBonnardSection(sharedBonnard, path.join(cwd, "AGENTS.md"), results, mode);
  writeSkills(skillsDir, results, mode);
}

function createWindsurfTemplates(cwd: string, sharedBonnard: string, results: FileResult[], mode: WriteMode): void {
  const rulesDir = path.join(cwd, ".windsurf", "rules");
  const skillsDir = path.join(cwd, ".windsurf", "skills");
  fs.mkdirSync(rulesDir, { recursive: true });

  const windsurfContent = `---
trigger: always_on
---

${sharedBonnard}`;
  writeBonnardSection(windsurfContent, path.join(rulesDir, "bonnard.md"), results, mode);
  writeSkills(skillsDir, results, mode);
}

function createCopilotTemplates(cwd: string, sharedBonnard: string, results: FileResult[], mode: WriteMode): void {
  const githubDir = path.join(cwd, ".github");
  const skillsDir = path.join(githubDir, "skills");
  fs.mkdirSync(githubDir, { recursive: true });

  writeBonnardSection(sharedBonnard, path.join(githubDir, "copilot-instructions.md"), results, mode);
  writeSkills(skillsDir, results, mode);
}

function createClineTemplates(cwd: string, sharedBonnard: string, results: FileResult[], mode: WriteMode): void {
  const rulesDir = path.join(cwd, ".clinerules");
  const skillsDir = path.join(rulesDir, "skills");
  fs.mkdirSync(rulesDir, { recursive: true });

  writeBonnardSection(sharedBonnard, path.join(rulesDir, "bonnard.md"), results, mode);
  writeSkills(skillsDir, results, mode);
}

const AGENT_GENERATORS: Record<Agent, (cwd: string, shared: string, results: FileResult[], mode: WriteMode) => void> = {
  claude: createClaudeTemplates,
  cursor: createCursorTemplates,
  codex: createCodexTemplates,
  windsurf: createWindsurfTemplates,
  copilot: createCopilotTemplates,
  cline: createClineTemplates,
};

/**
 * Create agent templates for a specific coding agent
 */
function createAgentTemplates(cwd: string, agent: Agent, env?: ProjectEnvironment, mode: WriteMode = "init"): FileResult[] {
  const results: FileResult[] = [];

  let sharedBonnard = loadTemplate("shared/bonnard.md");
  if (env) {
    sharedBonnard += "\n\n" + generateProjectContext(env);
  }

  AGENT_GENERATORS[agent](cwd, sharedBonnard, results, mode);

  return results;
}

function formatFileResult(result: FileResult): string {
  switch (result.action) {
    case "appended": return `${result.path} (appended)`;
    case "merged": return `${result.path} (merged)`;
    default: return result.path;
  }
}

async function resolveAgent(agentOption?: string): Promise<Agent> {
  if (agentOption) {
    const normalized = agentOption.toLowerCase();
    if (!AGENTS.includes(normalized as Agent)) {
      console.log(pc.red(`Unknown agent "${agentOption}". Valid options: ${AGENTS.join(", ")}`));
      process.exit(1);
    }
    return normalized as Agent;
  }

  if (!process.stdin.isTTY) {
    console.log(pc.red(`--agent is required in non-interactive mode. Options: ${AGENTS.join(", ")}`));
    process.exit(1);
  }

  return select({
    message: "Which coding agent do you use?",
    choices: AGENTS.map(a => ({ name: AGENT_LABELS[a], value: a })),
  });
}

export async function initCommand(options: { update?: boolean; selfHosted?: boolean; agent?: string } = {}) {
  const cwd = process.cwd();
  const paths = getProjectPaths(cwd);

  if (options.update) {
    if (!fs.existsSync(paths.config)) {
      console.log(pc.red("No bon.yaml found. Run `bon init` first."));
      process.exit(1);
    }

    const agent = await resolveAgent(options.agent);
    const env = detectProjectEnvironment(cwd);
    const results = createAgentTemplates(
      cwd,
      agent,
      env.tools.length > 0 || env.warehouse ? env : undefined,
      "update"
    );

    const updated = results.filter(r => r.action === "updated");
    const added = results.filter(r => r.action === "added");

    if (updated.length === 0 && added.length === 0) {
      console.log(pc.green(`${AGENT_LABELS[agent]} templates are up to date.`));
    } else {
      const parts: string[] = [];
      if (updated.length > 0) parts.push(`updated ${updated.length} file${updated.length !== 1 ? "s" : ""}`);
      if (added.length > 0) parts.push(`added ${added.length} new file${added.length !== 1 ? "s" : ""}`);
      console.log(pc.green(`${AGENT_LABELS[agent]} templates: ${parts.join(", ")}.`));
      for (const r of [...updated, ...added]) {
        const label = r.action === "added" ? pc.cyan("new") : pc.yellow("updated");
        console.log(`  ${label} ${pc.dim(r.path)}`);
      }
    }
    return;
  }

  const agent = await resolveAgent(options.agent);
  const projectName = path.basename(cwd);

  if (fs.existsSync(paths.config)) {
    console.log(pc.red("A bon.yaml already exists in this directory."));
    process.exit(1);
  }

  // Create core project structure under bonnard/
  fs.mkdirSync(paths.cubes, { recursive: true });
  fs.mkdirSync(paths.views, { recursive: true });
  fs.mkdirSync(paths.localState, { recursive: true });

  if (options.selfHosted) {
    // Self-hosted mode: write bon.yaml with mode, copy Docker templates
    fs.writeFileSync(paths.config, BON_YAML_SELF_HOSTED_TEMPLATE(projectName));
    fs.writeFileSync(path.join(cwd, ".gitignore"), GITIGNORE_SELF_HOSTED_TEMPLATE);

    // Copy Docker infrastructure templates
    const dockerCompose = loadTemplate("oss/docker-compose.yml");
    fs.writeFileSync(path.join(cwd, "docker-compose.yml"), dockerCompose);

    const envFile = loadTemplate("oss/.env")
      .replace("CUBEJS_API_SECRET=REPLACE_ME", `CUBEJS_API_SECRET=${crypto.randomBytes(32).toString("hex")}`);
    fs.writeFileSync(path.join(cwd, ".env"), envFile);

    const cubeJs = loadTemplate("oss/cube.js");
    fs.writeFileSync(path.join(cwd, "cube.js"), cubeJs);

    const caddyfile = loadTemplate("oss/Caddyfile");
    fs.writeFileSync(path.join(cwd, "Caddyfile"), caddyfile);

    const readmeMd = loadTemplate("oss/README.md");
    fs.writeFileSync(path.join(cwd, "README.md"), readmeMd);

    // Create data directory for DuckDB files etc.
    fs.mkdirSync(path.join(cwd, "data"), { recursive: true });
  } else {
    fs.writeFileSync(paths.config, BON_YAML_TEMPLATE(projectName));
    fs.writeFileSync(path.join(cwd, ".gitignore"), GITIGNORE_TEMPLATE);
  }

  // Detect project environment
  const env = detectProjectEnvironment(cwd);

  // Create agent templates with dynamic context
  const agentFiles = createAgentTemplates(cwd, agent, env.tools.length > 0 || env.warehouse ? env : undefined);

  console.log(pc.green(`Initialised Bonnard project "${projectName}"`));
  console.log();
  console.log(pc.bold("Core files:"));
  console.log(`  ${pc.dim("bon.yaml")}                project config`);
  console.log(`  ${pc.dim(`${BONNARD_DIR}/cubes/`)}       cube definitions`);
  console.log(`  ${pc.dim(`${BONNARD_DIR}/views/`)}       view definitions`);
  console.log(`  ${pc.dim(".bon/")}                   local state (gitignored)`);
  console.log(`  ${pc.dim(".gitignore")}              git ignore rules`);

  if (options.selfHosted) {
    console.log();
    console.log(pc.bold("Docker infrastructure:"));
    console.log(`  ${pc.dim("docker-compose.yml")}     Cube + Bonnard + Caddy services`);
    console.log(`  ${pc.dim("Caddyfile")}              reverse proxy config`);
    console.log(`  ${pc.dim(".env")}                    data source configuration`);
    console.log(`  ${pc.dim("cube.js")}                Cube runtime config`);
    console.log(`  ${pc.dim("README.md")}              deployment guide`);
    console.log(`  ${pc.dim("data/")}                  local data files (gitignored)`);
  }

  if (agentFiles.length > 0) {
    console.log();
    console.log(pc.bold(`${AGENT_LABELS[agent]} templates:`));
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

  if (options.selfHosted) {
    console.log();
    console.log(pc.bold("Next steps:"));
    console.log(`  1. Edit ${pc.cyan(".env")} to configure your data source`);
    console.log(`  2. Run ${pc.cyan("docker compose up")} to start the server`);
    console.log(`  3. Add cube/view YAML files to ${pc.cyan(`${BONNARD_DIR}/cubes/`)} and ${pc.cyan(`${BONNARD_DIR}/views/`)}`);
    console.log(`  4. Run ${pc.cyan("bon deploy")} to push models to the server`);
    console.log(`  5. Run ${pc.cyan("bon schema")} to verify your semantic layer`);
    console.log(`  6. Run ${pc.cyan("bon mcp")} to connect AI agents`);
    console.log();
    console.log(`  See ${pc.cyan("README.md")} for TLS, auth, and production deployment.`);
  }
}
