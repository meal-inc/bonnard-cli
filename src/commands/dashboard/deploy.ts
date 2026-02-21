import fs from "node:fs";
import path from "node:path";
import pc from "picocolors";
import { post } from "../../lib/api.js";

const APP_URL = process.env.BON_APP_URL || "https://app.bonnard.dev";

/**
 * Extract <title> content from HTML string
 */
function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/is);
  return match ? match[1].trim() : null;
}

/**
 * Derive slug from filename: strip extension, lowercase, replace non-alphanumeric with hyphens
 */
function slugFromFilename(filename: string): string {
  return path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function dashboardDeployCommand(
  file: string,
  options: { slug?: string; title?: string }
) {
  // Read file
  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    console.error(pc.red(`File not found: ${file}`));
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");

  if (content.length > 2 * 1024 * 1024) {
    console.error(pc.red("File exceeds 2MB limit."));
    process.exit(1);
  }

  const slug = options.slug || slugFromFilename(file);
  const title = options.title || extractTitle(content) || slug;

  console.log(pc.dim(`Deploying dashboard "${slug}"...`));

  try {
    const result = (await post("/api/dashboards", { slug, title, content })) as {
      dashboard: { slug: string; title: string; org_slug: string; version: number; updated_at: string };
    };

    const dashboard = result.dashboard;
    const url = `${APP_URL}/d/${dashboard.org_slug}/${dashboard.slug}`;

    console.log(pc.green(`Dashboard deployed successfully`));
    console.log();
    console.log(`  ${pc.bold("Slug")}     ${dashboard.slug}`);
    console.log(`  ${pc.bold("Title")}    ${dashboard.title}`);
    console.log(`  ${pc.bold("Version")}  ${dashboard.version}`);
    console.log(`  ${pc.bold("URL")}      ${url}`);
  } catch (err) {
    console.error(pc.red(`Deploy failed: ${err instanceof Error ? err.message : err}`));
    process.exit(1);
  }
}
