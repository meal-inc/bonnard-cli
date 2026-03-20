import fs from "node:fs";
import path from "node:path";
import pc from "picocolors";
import { get } from "../lib/api.js";
import { getProjectPaths } from "../lib/project.js";

export async function pullCommand() {
  const cwd = process.cwd();
  const paths = getProjectPaths(cwd);

  console.log(pc.dim("Downloading deployed models..."));

  try {
    const result = (await get("/api/deploy/files")) as {
      files: Record<string, string>;
    };

    const files = result.files;
    const fileKeys = Object.keys(files);

    if (fileKeys.length === 0) {
      console.log(pc.yellow("No deployed files found. Have you run `bon deploy` yet?"));
      return;
    }

    // Write each file to bonnard/{path}
    for (const [relativePath, content] of Object.entries(files)) {
      const fullPath = path.join(paths.root, relativePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content, "utf-8");
    }

    console.log(pc.green(`Pulled ${fileKeys.length} file(s) to bonnard/`));
  } catch (err) {
    console.log(pc.red(`Pull failed: ${err instanceof Error ? err.message : err}`));
    process.exit(1);
  }
}
