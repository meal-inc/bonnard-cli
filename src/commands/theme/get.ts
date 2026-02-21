import pc from "picocolors";
import { get } from "../../lib/api.js";
import { stringify } from "yaml";

export async function themeGetCommand() {
  try {
    const result = (await get("/api/org/theme")) as { theme: unknown };

    if (!result.theme) {
      console.log(pc.dim("No org theme set. Using defaults."));
      return;
    }

    console.log(pc.bold("Organization theme:\n"));
    console.log(stringify(result.theme).trimEnd());
  } catch (err) {
    console.error(
      pc.red(`Error: ${err instanceof Error ? err.message : err}`)
    );
    process.exit(1);
  }
}
