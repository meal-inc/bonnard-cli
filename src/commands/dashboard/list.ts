import pc from "picocolors";
import { get } from "../../lib/api.js";

const APP_URL = process.env.BON_APP_URL || "https://app.bonnard.dev";

export async function dashboardListCommand() {
  try {
    const result = (await get("/api/dashboards")) as {
      dashboards: {
        slug: string;
        title: string;
        org_slug: string;
        version: number;
        updated_at: string;
      }[];
    };

    const dashboards = result.dashboards;

    if (dashboards.length === 0) {
      console.log(pc.dim("No dashboards deployed yet. Run `bon dashboard deploy <file>` to publish."));
      return;
    }

    // Calculate column widths
    const slugWidth = Math.max(4, ...dashboards.map((d) => d.slug.length));
    const titleWidth = Math.max(5, ...dashboards.map((d) => d.title.length));
    const versionWidth = 7;
    const dateWidth = 10;

    const header = [
      "SLUG".padEnd(slugWidth),
      "TITLE".padEnd(titleWidth),
      "VERSION".padEnd(versionWidth),
      "UPDATED".padEnd(dateWidth),
      "URL",
    ].join("  ");

    console.log(pc.dim(header));

    for (const d of dashboards) {
      const url = `${APP_URL}/d/${d.org_slug}/${d.slug}`;
      const date = new Date(d.updated_at).toLocaleDateString();
      const row = [
        d.slug.padEnd(slugWidth),
        d.title.padEnd(titleWidth),
        `v${d.version}`.padEnd(versionWidth),
        date.padEnd(dateWidth),
        url,
      ].join("  ");
      console.log(row);
    }
  } catch (err) {
    console.error(pc.red(`Failed to list dashboards: ${err instanceof Error ? err.message : err}`));
    process.exit(1);
  }
}
