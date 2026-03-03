import pc from "picocolors";
import { loadConfig, isSelfHosted, getBaseUrl } from "../lib/config.js";

export async function mcpTestCommand() {
  const config = loadConfig();
  const selfHosted = isSelfHosted(config);

  console.log(pc.dim("Testing MCP server connection..."));
  console.log();

  if (selfHosted) {
    const baseUrl = getBaseUrl(config);
    const url = `${baseUrl}/health`;

    try {
      const res = await fetch(url);

      if (!res.ok) {
        console.log(pc.red(`✗ Server returned ${res.status}`));
        console.log(pc.dim("Is docker compose running?"));
        process.exit(1);
      }

      const health = (await res.json()) as {
        status?: string;
        cube?: { connected?: boolean; url?: string };
      };

      console.log(pc.green("✓ Bonnard server is reachable"));
      console.log();
      console.log(`  Status: ${pc.dim(health.status || "unknown")}`);
      if (health.cube) {
        console.log(`  Cube connected: ${pc.dim(String(health.cube.connected ?? "unknown"))}`);
        if (health.cube.url) {
          console.log(`  Cube URL: ${pc.dim(health.cube.url)}`);
        }
      }
      console.log();
      console.log(pc.dim("Self-hosted server is healthy. Agents can connect."));
    } catch (err) {
      console.log(pc.red(`✗ Failed to reach server: ${err instanceof Error ? err.message : err}`));
      console.log(pc.dim("Is docker compose running?"));
      process.exit(1);
    }
  } else {
    const url = "https://mcp.bonnard.dev/.well-known/oauth-authorization-server";

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
}
