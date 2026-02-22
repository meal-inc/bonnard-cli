import pc from "picocolors";
import { get } from "../lib/api.js";

interface Deployment {
  id: string;
  status: string;
  fileCount: number;
  message: string | null;
  createdAt: string;
  createdBy: string;
}

interface DeploymentsResponse {
  deployments: Deployment[];
}

interface DeploymentsOptions {
  all?: boolean;
  format?: string;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "\u2026";
}

function statusColor(status: string): string {
  switch (status) {
    case "success":
      return pc.green(status);
    case "failed":
      return pc.red(status);
    case "processing":
      return pc.yellow(status);
    default:
      return pc.dim(status);
  }
}

export async function deploymentsCommand(options: DeploymentsOptions = {}) {
  const limit = options.all ? 100 : 10;

  let response: DeploymentsResponse;
  try {
    response = (await get(
      `/api/deploy/history?limit=${limit}`
    )) as DeploymentsResponse;
  } catch (err) {
    console.log(
      pc.red(
        `Failed to fetch deployments: ${err instanceof Error ? err.message : err}`
      )
    );
    process.exit(1);
  }

  const { deployments } = response;

  if (options.format === "json") {
    console.log(JSON.stringify(deployments, null, 2));
    return;
  }

  console.log();
  console.log(pc.bold("Deployments for Bonnard"));
  console.log();

  if (deployments.length === 0) {
    console.log(pc.dim("  No deployments found."));
    console.log();
    return;
  }

  // Column widths
  const colId = 10;
  const colStatus = 12;
  const colFiles = 7;
  const colMessage = 32;

  // Header
  console.log(
    pc.dim(
      "  " +
        "ID".padEnd(colId) +
        "Status".padEnd(colStatus) +
        "Files".padEnd(colFiles) +
        "Message".padEnd(colMessage) +
        "Deployed"
    )
  );

  for (const d of deployments) {
    const id = d.id.slice(0, 8);
    const status = statusColor(d.status);
    // Pad based on raw status length since color codes add invisible chars
    const statusPad = " ".repeat(Math.max(0, colStatus - d.status.length));
    const files = String(d.fileCount);
    const message = d.message ? truncate(d.message, 30) : "\u2014";
    const time = relativeTime(d.createdAt);

    console.log(
      "  " +
        id.padEnd(colId) +
        status +
        statusPad +
        files.padEnd(colFiles) +
        message.padEnd(colMessage) +
        pc.dim(time)
    );
  }

  console.log();
  console.log(
    pc.dim(
      `Showing ${deployments.length} deployment${deployments.length !== 1 ? "s" : ""}.`
    )
  );
  console.log();
}
