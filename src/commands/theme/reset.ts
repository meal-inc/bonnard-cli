import pc from "picocolors";
import { createInterface } from "node:readline";
import { put } from "../../lib/api.js";

async function confirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

export async function themeResetCommand(options: { force?: boolean }) {
  if (!options.force) {
    const ok = await confirm("Reset org theme to defaults?");
    if (!ok) {
      console.log(pc.dim("Cancelled."));
      return;
    }
  }

  try {
    await put("/api/org/theme", { theme: null });
    console.log(pc.green("Org theme reset to defaults."));
  } catch (err) {
    console.error(
      pc.red(
        `Failed to reset theme: ${err instanceof Error ? err.message : err}`
      )
    );
    process.exit(1);
  }
}
