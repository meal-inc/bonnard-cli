import http from "node:http";
import crypto from "node:crypto";
import pc from "picocolors";
import { saveCredentials } from "../lib/credentials.js";

const APP_URL = process.env.BON_APP_URL || "https://app.bonnard.dev";
const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

export async function loginCommand() {
  const state = crypto.randomUUID();

  const { port, close } = await startCallbackServer(state);

  const url = `${APP_URL}/auth/device?state=${state}&port=${port}`;
  console.log(pc.dim(`Opening browser to ${url}`));

  // Dynamic import — `open` is ESM-only
  const open = (await import("open")).default;
  await open(url);

  console.log("Waiting for authentication...");

  const timeout = setTimeout(() => {
    close();
    console.log(pc.red("Login timed out. Please try again."));
    process.exit(1);
  }, TIMEOUT_MS);

  const result = await waitForCallback;

  clearTimeout(timeout);
  close();

  saveCredentials({ token: result.token, email: result.email });
  console.log(pc.green(`Logged in as ${result.email}`));
}

// ── callback server ──────────────────────────────────────────────────

interface CallbackResult {
  token: string;
  email: string;
}

let resolveCallback: (value: CallbackResult) => void;
let rejectCallback: (reason: Error) => void;

const waitForCallback = new Promise<CallbackResult>((resolve, reject) => {
  resolveCallback = resolve;
  rejectCallback = reject;
});

function startCallbackServer(
  expectedState: string
): Promise<{ port: number; close: () => void }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url!, `http://localhost`);

      if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const token = url.searchParams.get("token");
      const email = url.searchParams.get("email");
      const state = url.searchParams.get("state");

      if (state !== expectedState) {
        res.writeHead(400);
        res.end("Invalid state parameter");
        return;
      }

      if (!token || !email) {
        res.writeHead(400);
        res.end("Missing token or email");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bonnard CLI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0a0a0a;
      color: #fafafa;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      text-align: center;
      padding: 3rem;
      max-width: 400px;
    }
    .check {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #22c55e;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
    }
    .check svg { width: 24px; height: 24px; }
    h1 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    p {
      color: #a1a1aa;
      font-size: 0.875rem;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="check">
      <svg fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h1>Authentication successful</h1>
    <p>You can close this tab and return to your terminal.</p>
  </div>
</body>
</html>`);

      resolveCallback({ token, email });
    });

    server.on("error", reject);

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("Failed to start callback server"));
        return;
      }
      resolve({
        port: addr.port,
        close: () => server.close(),
      });
    });
  });
}
