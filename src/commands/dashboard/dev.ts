import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pc from "picocolors";
import open from "open";
import { parse } from "yaml";
import { loadCredentials } from "../../lib/credentials.js";
import { get } from "../../lib/api.js";

const APP_URL = process.env.BON_APP_URL || "https://app.bonnard.dev";

function loadViewer(): string {
  // viewer.html is a build artifact in dist/ (sibling to bin/)
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const viewerPath = path.resolve(dir, "..", "viewer.html");
  if (!fs.existsSync(viewerPath)) {
    console.error(pc.red("Viewer not found. Rebuild the CLI with `pnpm build`."));
    process.exit(1);
  }
  return fs.readFileSync(viewerPath, "utf-8");
}

function loadThemeFile(filePath: string): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    console.error(pc.yellow(`Warning: Theme file is not a valid object, ignoring.`));
    return null;
  } catch (err) {
    console.error(
      pc.yellow(`Warning: Could not load theme file: ${err instanceof Error ? err.message : err}`)
    );
    return null;
  }
}

async function fetchOrgTheme(): Promise<Record<string, unknown> | null> {
  try {
    const result = (await get("/api/org/theme")) as { theme: unknown };
    if (result.theme && typeof result.theme === "object") {
      return result.theme as Record<string, unknown>;
    }
    return null;
  } catch {
    // Fail silently — local dev should still work without network
    return null;
  }
}

export async function dashboardDevCommand(
  file: string,
  options: { port?: string; theme?: string }
) {
  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    console.error(pc.red(`File not found: ${file}`));
    process.exit(1);
  }

  const creds = loadCredentials();
  if (!creds) {
    console.error(pc.red("Not logged in. Run `bon login` first."));
    process.exit(1);
  }

  const viewerHtml = loadViewer();
  const sseClients: Set<http.ServerResponse> = new Set();

  // Resolve org theme
  let orgTheme: Record<string, unknown> | null = null;

  if (options.theme) {
    const themePath = path.resolve(options.theme);
    if (!fs.existsSync(themePath)) {
      console.error(pc.red(`Theme file not found: ${options.theme}`));
      process.exit(1);
    }
    orgTheme = loadThemeFile(themePath);
    if (orgTheme) {
      console.log(pc.dim(`Using local theme from ${path.basename(themePath)}`));
    }

    // Watch theme file for changes too
    fs.watch(themePath, () => {
      orgTheme = loadThemeFile(themePath);
      for (const client of sseClients) {
        client.write("data: reload\n\n");
      }
    });
  } else {
    console.log(pc.dim("Fetching org theme..."));
    orgTheme = await fetchOrgTheme();
    if (orgTheme) {
      console.log(pc.dim("Using org theme from Bonnard."));
    }
  }

  // Watch for dashboard file changes
  let debounce: ReturnType<typeof setTimeout> | null = null;
  fs.watch(filePath, () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      for (const client of sseClients) {
        client.write("data: reload\n\n");
      }
    }, 50);
  });

  const server = http.createServer((req, res) => {
    const url = req.url || "/";

    if (url === "/") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(viewerHtml);
      return;
    }

    if (url === "/__bon/content") {
      res.writeHead(200, {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
      });
      res.end(fs.readFileSync(filePath, "utf-8"));
      return;
    }

    if (url === "/__bon/config") {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      });
      res.end(
        JSON.stringify({
          token: creds.token,
          baseUrl: APP_URL,
          orgTheme,
        })
      );
      return;
    }

    if (url === "/__bon/events") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      sseClients.add(res);
      req.on("close", () => sseClients.delete(res));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  const port = options.port ? parseInt(options.port, 10) : 0;
  server.listen(port, () => {
    const addr = server.address() as { port: number };
    const url = `http://localhost:${addr.port}`;
    console.log(pc.green(`Dashboard preview running at ${pc.bold(url)}`));
    console.log(pc.dim(`Watching ${path.basename(filePath)} for changes...\n`));
    open(url);
  });
}
