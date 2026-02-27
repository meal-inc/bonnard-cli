import pc from "picocolors";
import open from "open";
import { get } from "../../lib/api.js";

const APP_URL = process.env.BON_APP_URL || "https://app.bonnard.dev";

export async function dashboardOpenCommand(slug: string) {
  try {
    const result = (await get(`/api/dashboards/${encodeURIComponent(slug)}`)) as {
      dashboard: { org_slug: string; slug: string };
    };

    const url = `${APP_URL}/d/${result.dashboard.org_slug}/${result.dashboard.slug}`;
    console.log(pc.dim(`Opening ${url}`));
    await open(url);
  } catch (err) {
    console.error(pc.red(`Failed to open dashboard: ${err instanceof Error ? err.message : err}`));
    process.exit(1);
  }
}
