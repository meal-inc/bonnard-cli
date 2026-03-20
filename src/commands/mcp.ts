import fs from "node:fs";
import pc from "picocolors";
import { loadConfig, getMcpUrl, isSelfHosted } from "../lib/config.js";

/**
 * Read ADMIN_TOKEN from the local .env file (if present).
 * Only used in self-hosted mode to show auth instructions.
 */
function readAdminToken(): string | undefined {
  try {
    const envContent = fs.readFileSync(".env", "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (key.trim() === "ADMIN_TOKEN") {
        const val = rest.join("=").trim();
        return val || undefined;
      }
    }
  } catch {
    // No .env file
  }
  return undefined;
}

export function mcpCommand() {
  const config = loadConfig();
  const selfHosted = isSelfHosted(config);
  const mcpUrl = getMcpUrl(config);
  const adminToken = selfHosted ? readAdminToken() : undefined;
  const hasAuth = !!adminToken;

  console.log(pc.bold("MCP Connection Info"));
  if (selfHosted) {
    console.log(pc.dim("  (self-hosted mode)"));
  }
  console.log();
  console.log(`MCP URL:  ${pc.cyan(mcpUrl)}`);
  if (hasAuth) {
    console.log(`Auth:     ${pc.yellow("Authorization: Bearer <ADMIN_TOKEN>")}`);
  }
  console.log();
  console.log(pc.bold("Setup Instructions"));
  console.log();

  // Build headers snippet for auth configs
  const headersJson = hasAuth
    ? `\n        "headers": {\n          "Authorization": "Bearer ${adminToken}"\n        }`
    : "";

  // Claude Desktop
  console.log(pc.underline("Claude Desktop"));
  const isHttp = selfHosted && mcpUrl.startsWith("http://");
  if (isHttp) {
    console.log(`Add to ${pc.dim("~/Library/Application Support/Claude/claude_desktop_config.json")}:`);
    console.log();
    console.log(pc.dim(`  {`));
    console.log(pc.dim(`    "mcpServers": {`));
    console.log(pc.dim(`      "bonnard": {`));
    console.log(pc.dim(`        "command": "npx",`));
    console.log(pc.dim(`        "args": [`));
    console.log(pc.dim(`          "mcp-remote",`));
    console.log(pc.dim(`          "${mcpUrl}",`));
    console.log(pc.dim(`          "--allow-http"${hasAuth ? "," : ""}`));
    if (hasAuth) {
      console.log(pc.dim(`          "--header",`));
      console.log(pc.dim(`          "Authorization: Bearer ${adminToken}"`));
    }
    console.log(pc.dim(`        ]`));
    console.log(pc.dim(`      }`));
    console.log(pc.dim(`    }`));
    console.log(pc.dim(`  }`));
    console.log();
    console.log(pc.dim(`  Claude Desktop requires HTTPS. The mcp-remote bridge handles this locally.`));
    console.log(pc.dim(`  To connect directly, set DOMAIN in .env and update the url in bon.yaml to https://.`));
    console.log();
  } else {
    console.log(`Add to ${pc.dim("~/Library/Application Support/Claude/claude_desktop_config.json")}:`);
    console.log();
    console.log(pc.dim(`  {`));
    console.log(pc.dim(`    "mcpServers": {`));
    console.log(pc.dim(`      "bonnard": {`));
    console.log(pc.dim(`        "url": "${mcpUrl}"${hasAuth ? "," : ""}`));
    if (hasAuth) {
      console.log(pc.dim(`        "headers": {`));
      console.log(pc.dim(`          "Authorization": "Bearer ${adminToken}"`));
      console.log(pc.dim(`        }`));
    }
    console.log(pc.dim(`      }`));
    console.log(pc.dim(`    }`));
    console.log(pc.dim(`  }`));
    console.log();
  }

  // Cursor
  console.log(pc.underline("Cursor"));
  console.log(`Add to ${pc.dim(".cursor/mcp.json")} in your project:`);
  console.log();
  console.log(pc.dim(`  {`));
  console.log(pc.dim(`    "mcpServers": {`));
  console.log(pc.dim(`      "bonnard": {`));
  console.log(pc.dim(`        "url": "${mcpUrl}"${hasAuth ? "," : ""}`));
  if (hasAuth) {
    console.log(pc.dim(`        "headers": {`));
    console.log(pc.dim(`          "Authorization": "Bearer ${adminToken}"`));
    console.log(pc.dim(`        }`));
  }
  console.log(pc.dim(`      }`));
  console.log(pc.dim(`    }`));
  console.log(pc.dim(`  }`));
  console.log();

  // Claude Code
  console.log(pc.underline("Claude Code"));
  console.log(`Add to ${pc.dim(".mcp.json")} in your project:`);
  console.log();
  console.log(pc.dim(`  {`));
  console.log(pc.dim(`    "mcpServers": {`));
  console.log(pc.dim(`      "bonnard": {`));
  console.log(pc.dim(`        "type": "url",`));
  console.log(pc.dim(`        "url": "${mcpUrl}"${hasAuth ? "," : ""}`));
  if (hasAuth) {
    console.log(pc.dim(`        "headers": {`));
    console.log(pc.dim(`          "Authorization": "Bearer ${adminToken}"`));
    console.log(pc.dim(`        }`));
  }
  console.log(pc.dim(`      }`));
  console.log(pc.dim(`    }`));
  console.log(pc.dim(`  }`));
  console.log();

  // CrewAI example (self-hosted with auth)
  if (selfHosted) {
    console.log(pc.underline("CrewAI / Python"));
    console.log();
    if (hasAuth) {
      console.log(pc.dim(`  MCPServerAdapter(`));
      console.log(pc.dim(`      url="${mcpUrl}",`));
      console.log(pc.dim(`      transport="streamable-http",`));
      console.log(pc.dim(`      headers={"Authorization": "Bearer ${adminToken}"}`));
      console.log(pc.dim(`  )`));
    } else {
      console.log(pc.dim(`  MCPServerAdapter(`));
      console.log(pc.dim(`      url="${mcpUrl}",`));
      console.log(pc.dim(`      transport="streamable-http"`));
      console.log(pc.dim(`  )`));
    }
    console.log();
  }

  if (selfHosted) {
    if (hasAuth) {
      console.log(pc.dim("All endpoints are protected with ADMIN_TOKEN. Pass as Bearer token."));
    } else {
      console.log(pc.dim("No ADMIN_TOKEN set. Set one in .env to protect your endpoints."));
    }
  } else {
    console.log(pc.dim("OAuth authentication happens automatically when you first connect."));
  }
  console.log(pc.dim("Run `bon mcp test` to verify the MCP server is reachable."));
}
