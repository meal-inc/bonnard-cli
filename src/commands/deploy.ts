import fs from "node:fs";
import path from "node:path";
import pc from "picocolors";
import { post } from "../lib/api.js";
import { getProjectPaths, BONNARD_DIR } from "../lib/project.js";

function collectFiles(dir: string, rootDir: string): Record<string, string> {
  const files: Record<string, string> = {};

  if (!fs.existsSync(dir)) return files;

  function walk(current: string) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith(".yaml") || entry.name.endsWith(".yml")) {
        const relativePath = path.relative(rootDir, fullPath);
        files[relativePath] = fs.readFileSync(fullPath, "utf-8");
      }
    }
  }

  walk(dir);
  return files;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface DeployOptions {
  ci?: boolean;
  message?: string;
}

export async function deployCommand(options: DeployOptions = {}) {
  const cwd = process.cwd();
  const paths = getProjectPaths(cwd);

  // Check for bon.yaml
  if (!fs.existsSync(paths.config)) {
    console.log(pc.red("No bon.yaml found. Are you in a Bonnard project?"));
    process.exit(1);
  }

  // Step 1: Validate cubes and views
  console.log(pc.dim("Validating cubes and views..."));
  const { validate } = await import("../lib/validate.js");
  const result = await validate(cwd);

  if (!result.valid) {
    console.log(pc.red("Validation failed:\n"));
    for (const err of result.errors) {
      console.log(pc.red(`  • ${err}`));
    }
    process.exit(1);
  }

  if (result.cubes.length === 0 && result.views.length === 0) {
    console.log(pc.yellow(`No cube or view files found in ${BONNARD_DIR}/cubes/ or ${BONNARD_DIR}/views/. Nothing to deploy.`));
    process.exit(1);
  }

  console.log(pc.dim(`  Found ${result.cubes.length} cube(s) and ${result.views.length} view(s)`));

  // Step 2: Test connections for referenced datasources (strict)
  const connectionsFailed = await testAndSyncDatasources(cwd, options);
  if (connectionsFailed) {
    process.exit(1);
  }

  // Step 3: Collect all YAML files
  // Use bonnard dir as root so paths become cubes/foo.yml and views/foo.yml
  // (not bonnard/cubes/foo.yml which would add an unwanted prefix in storage)
  const files: Record<string, string> = {
    ...collectFiles(paths.cubes, paths.root),
    ...collectFiles(paths.views, paths.root),
  };

  const fileCount = Object.keys(files).length;
  console.log(pc.dim(`Deploying ${fileCount} file(s)...`));
  console.log();

  // Step 4: POST /api/deploy
  try {
    const response = (await post("/api/deploy", {
      files,
      ...(options.message && { message: options.message }),
    })) as {
      deployment: {
        id: string;
        status: string;
        fileCount: number;
        cubeApiUrl: string;
        message?: string;
        previousDeploymentId?: string;
        isFirstDeploy: boolean;
        changes?: {
          added: number;
          modified: number;
          removed: number;
          breaking: number;
          details: Array<{
            objectName: string;
            objectType: string;
            changeType: string;
            parentName?: string;
            breaking: boolean;
            summary: string;
          }>;
        };
      };
    };

    console.log(pc.green("Deploy successful!"));
    console.log(`Deployment ID: ${pc.cyan(response.deployment.id)}`);
    console.log();

    if (response.deployment.isFirstDeploy) {
      console.log(pc.dim(`  First deployment — ${response.deployment.fileCount} files uploaded`));
    } else if (response.deployment.changes && response.deployment.changes.details.length > 0) {
      const { changes } = response.deployment;
      console.log(pc.dim("Changes from previous deploy:"));
      console.log();
      for (const c of changes.details) {
        const prefix = c.changeType === "added" ? pc.green("+") : c.changeType === "removed" ? pc.red("-") : pc.yellow("~");
        const label = `${capitalize(c.changeType)} ${c.objectType}: ${c.objectName}`;
        const breakingTag = c.breaking ? pc.red(" BREAKING") : "";
        const summaryTag = c.summary ? pc.dim(` — ${c.summary}`) : "";
        console.log(`  ${prefix} ${label}${summaryTag}${breakingTag}`);
      }
      if (changes.breaking > 0) {
        console.log();
        console.log(pc.red(`${changes.breaking} breaking change${changes.breaking > 1 ? "s" : ""} detected`));
      }

      // Prompt agent to annotate with the exact command and object names
      console.log();
      console.log(pc.bold("Annotate these changes with reasoning:"));
      console.log();
      const annotationTemplate = {
        annotations: changes.details.map((c) => ({
          objectName: c.objectName,
          annotation: `Why ${c.objectName} was ${c.changeType}`,
        })),
      };
      console.log(`  bon annotate ${response.deployment.id} --data '${JSON.stringify(annotationTemplate)}'`);
      console.log();
      console.log(pc.dim("Replace each annotation value with the reasoning behind the change."));
    } else {
      console.log(pc.dim("  No changes detected from previous deployment."));
    }

    console.log();
    console.log(pc.bold("Connect AI agents via MCP:"));
    console.log(`  MCP URL: ${pc.cyan("https://mcp.bonnard.dev/mcp")}`);
    console.log(pc.dim(`  Run \`bon mcp\` for setup instructions`));
  } catch (err) {
    console.log(pc.red(`Deploy failed: ${err instanceof Error ? err.message : err}`));
    process.exit(1);
  }
}

/**
 * Test connections and sync datasources to remote
 * Returns true if any connection failed (strict mode)
 */
async function testAndSyncDatasources(
  cwd: string,
  options: DeployOptions = {}
): Promise<boolean> {
  const { extractDatasourcesFromCubes } = await import("../lib/cubes/index.js");
  const { loadLocalDatasources } = await import("../lib/local/index.js");
  const { pushDatasource } = await import("./datasource/push.js");

  const references = extractDatasourcesFromCubes(cwd);

  if (references.length === 0) {
    // No explicit datasources referenced - using default
    return false;
  }

  console.log();
  console.log(pc.dim("Checking datasources..."));

  const localDatasources = loadLocalDatasources(cwd);
  let failed = false;

  // Check all referenced datasources exist locally
  const foundDatasources: string[] = [];

  for (const ref of references) {
    const ds = localDatasources.find((d) => d.name === ref.name);

    if (!ds) {
      console.log(pc.red(`✗ ${ref.name}: not found in .bon/datasources.yaml`));
      console.log(pc.dim(`    Used by: ${ref.cubes.join(", ")}`));
      console.log(pc.dim(`    Run: bon datasource add --from-dbt`));
      failed = true;
      continue;
    }

    foundDatasources.push(ref.name);
  }

  if (failed) {
    console.log();
    console.log(pc.red("Missing datasources. Fix issues before deploying."));
    return true;
  }

  // Sync all local datasources to remote (upsert — always pushes latest config/credentials)
  console.log(pc.dim("Syncing datasources..."));

  for (const name of foundDatasources) {
    const success = await pushDatasource(name, { silent: true });
    if (success) {
      console.log(pc.green(`✓ ${name} synced`));
    } else {
      console.log(pc.red(`✗ Failed to sync "${name}"`));
      failed = true;
    }
  }

  if (failed) {
    console.log();
    console.log(pc.red("Datasource sync failed. Check .bon/datasources.yaml and credentials."));
    return true;
  }

  // Test all datasources via remote API
  console.log();
  console.log(pc.dim("Testing datasource connections..."));

  for (const name of foundDatasources) {
    try {
      const result = (await post("/api/datasources/test", { name })) as {
        success: boolean;
        message: string;
        details?: Record<string, unknown>;
      };

      if (result.success) {
        const latency = result.details?.latencyMs ? pc.dim(` (${result.details.latencyMs}ms)`) : "";
        console.log(pc.green(`✓ ${name}${latency}`));
      } else {
        console.log(pc.red(`✗ ${name}: ${result.message}`));
        failed = true;
      }
    } catch (err) {
      console.log(pc.red(`✗ ${name}: ${(err as Error).message}`));
      failed = true;
    }
  }

  console.log();

  if (failed) {
    console.log(pc.red("Connection tests failed. Fix datasource issues before deploying."));
    return true;
  }

  console.log(pc.green("✓ All datasources connected"));
  console.log();
  return false;
}
