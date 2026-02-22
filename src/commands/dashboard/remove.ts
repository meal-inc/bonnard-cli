import pc from "picocolors";
import { del } from "../../lib/api.js";
import { createInterface } from "node:readline";

async function confirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

export async function dashboardRemoveCommand(
  slug: string,
  options: { force?: boolean }
) {
  if (!options.force) {
    const ok = await confirm(`Remove dashboard "${slug}"? This cannot be undone.`);
    if (!ok) {
      console.log(pc.dim("Cancelled."));
      return;
    }
  }

  try {
    await del(`/api/dashboards/${encodeURIComponent(slug)}`);
    console.log(pc.green(`Dashboard "${slug}" removed.`));
  } catch (err) {
    console.error(pc.red(`Failed to remove dashboard: ${err instanceof Error ? err.message : err}`));
    process.exit(1);
  }
}
