import os from "node:os";
import { createRequire } from "node:module";
import { loadCredentials } from "./credentials.js";
import { loadConfig, isSelfHosted, getBaseUrl } from "./config.js";
import pc from "picocolors";

const require = createRequire(import.meta.url);
const { version } = require("../../package.json");

const USER_AGENT = `bon-cli/${version} node-${process.version} ${os.platform()} (${os.arch()})`;
const VERCEL_BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

function getToken(): string | null {
  const config = loadConfig();
  if (isSelfHosted(config)) {
    return config?.admin_token || process.env.ADMIN_TOKEN || null;
  }
  const creds = loadCredentials();
  if (!creds) {
    console.error(pc.red("Not logged in. Run `bon login` first."));
    process.exit(1);
  }
  return creds.token;
}

async function request(
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  const config = loadConfig();
  const token = getToken();
  const url = `${getBaseUrl(config)}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": USER_AGENT,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Add Vercel deployment protection bypass if configured (cloud only)
  if (VERCEL_BYPASS && !isSelfHosted(config)) {
    headers["x-vercel-protection-bypass"] = VERCEL_BYPASS;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
  }

  if (!res.ok) {
    const message = (data as { error?: string }).error || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(message);
  }

  return data;
}

export function get(path: string) {
  return request("GET", path);
}

export function post(path: string, body: unknown) {
  return request("POST", path, body);
}

export function put(path: string, body: unknown) {
  return request("PUT", path, body);
}

export function del(path: string) {
  return request("DELETE", path);
}

/**
 * Remote datasource as returned by the API
 */
export interface RemoteDatasource {
  id: string;
  name: string;
  warehouse_type: string;
  config: Record<string, unknown>;
  status: string;
  created_at: string;
}

/**
 * Fetch remote datasources from Bonnard server
 */
export async function getRemoteDatasources(): Promise<RemoteDatasource[]> {
  const result = (await get("/api/datasources")) as {
    dataSources: RemoteDatasource[];
  };
  return result.dataSources || [];
}
