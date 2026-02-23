import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import pc from "picocolors";

const CACHE_DIR = path.join(os.homedir(), ".config", "bon");
const CACHE_FILE = path.join(CACHE_DIR, "update-check.json");
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const REGISTRY_URL = "https://registry.npmjs.org/@bonnard/cli/latest";
const FETCH_TIMEOUT_MS = 3000;

interface CachedCheck {
  lastCheck: number;
  latestVersion: string;
}

function readCache(): CachedCheck | null {
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(data: CachedCheck): void {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data));
  } catch {
    // Non-critical — skip silently
  }
}

function isNewer(latest: string, current: string): boolean {
  const l = latest.split(".").map(Number);
  const c = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] ?? 0) > (c[i] ?? 0)) return true;
    if ((l[i] ?? 0) < (c[i] ?? 0)) return false;
  }
  return false;
}

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(REGISTRY_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data.version ?? null;
  } catch {
    return null;
  }
}

/**
 * Start a background version check. Returns a function that,
 * when called, prints an update notice if a newer version exists.
 * The check is cached for 24 hours and never blocks the CLI.
 */
export function startUpdateCheck(currentVersion: string): () => Promise<void> {
  const cached = readCache();
  const now = Date.now();

  // If checked recently, use cached result (synchronous — no delay)
  if (cached && now - cached.lastCheck < CHECK_INTERVAL_MS) {
    return async () => {
      if (isNewer(cached.latestVersion, currentVersion)) {
        printUpdateNotice(cached.latestVersion, currentVersion);
      }
    };
  }

  // Otherwise, fire off a fetch in parallel with command execution
  const fetchPromise = fetchLatestVersion();

  return async () => {
    const latest = await fetchPromise;
    if (latest) {
      writeCache({ lastCheck: now, latestVersion: latest });
      if (isNewer(latest, currentVersion)) {
        printUpdateNotice(latest, currentVersion);
      }
    }
  };
}

function printUpdateNotice(latest: string, current: string): void {
  console.error(
    `\nUpdate available: ${pc.yellow(latest)} (currently installed ${current})\nRun ${pc.cyan("npm install -g @bonnard/cli")} to update\n`
  );
}
