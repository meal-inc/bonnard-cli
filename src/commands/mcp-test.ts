import pc from "picocolors";

const MCP_SERVER_BASE = "https://mcp.bonnard.dev";

export async function mcpTestCommand() {
  console.log(pc.dim("Testing MCP server connection..."));
  console.log();

  const url = `${MCP_SERVER_BASE}/.well-known/oauth-authorization-server`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      console.log(pc.red(`✗ MCP server returned ${res.status}`));
      process.exit(1);
    }

    const metadata = (await res.json()) as {
      issuer?: string;
      authorization_endpoint?: string;
      token_endpoint?: string;
      registration_endpoint?: string;
    };

    console.log(pc.green("✓ MCP server is reachable"));
    console.log();
    console.log(`  Issuer: ${pc.dim(metadata.issuer || "unknown")}`);
    console.log(`  Authorization: ${pc.dim(metadata.authorization_endpoint || "unknown")}`);
    console.log(`  Token: ${pc.dim(metadata.token_endpoint || "unknown")}`);
    console.log(`  Registration: ${pc.dim(metadata.registration_endpoint || "unknown")}`);
    console.log();
    console.log(pc.dim("OAuth endpoints are healthy. Agents can connect."));
  } catch (err) {
    console.log(pc.red(`✗ Failed to reach MCP server: ${err instanceof Error ? err.message : err}`));
    process.exit(1);
  }
}
