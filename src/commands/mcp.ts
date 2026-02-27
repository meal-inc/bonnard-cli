import pc from "picocolors";

const MCP_URL = "https://mcp.bonnard.dev/mcp";

export function mcpCommand() {
  console.log(pc.bold("MCP Connection Info"));
  console.log();
  console.log(`MCP URL: ${pc.cyan(MCP_URL)}`);
  console.log();
  console.log(pc.bold("Setup Instructions"));
  console.log();

  // Claude Desktop
  console.log(pc.underline("Claude Desktop"));
  console.log(`Add to ${pc.dim("~/Library/Application Support/Claude/claude_desktop_config.json")}:`);
  console.log();
  console.log(pc.dim(`  {`));
  console.log(pc.dim(`    "mcpServers": {`));
  console.log(pc.dim(`      "bonnard": {`));
  console.log(pc.dim(`        "url": "${MCP_URL}"`));
  console.log(pc.dim(`      }`));
  console.log(pc.dim(`    }`));
  console.log(pc.dim(`  }`));
  console.log();

  // Cursor
  console.log(pc.underline("Cursor"));
  console.log(`Add to ${pc.dim(".cursor/mcp.json")} in your project:`);
  console.log();
  console.log(pc.dim(`  {`));
  console.log(pc.dim(`    "mcpServers": {`));
  console.log(pc.dim(`      "bonnard": {`));
  console.log(pc.dim(`        "url": "${MCP_URL}"`));
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
  console.log(pc.dim(`        "url": "${MCP_URL}"`));
  console.log(pc.dim(`      }`));
  console.log(pc.dim(`    }`));
  console.log(pc.dim(`  }`));
  console.log();

  console.log(pc.dim("OAuth authentication happens automatically when you first connect."));
  console.log(pc.dim("Run `bon mcp test` to verify the MCP server is reachable."));
}
