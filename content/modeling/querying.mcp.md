# MCP

> Connect AI agents like Claude, ChatGPT, and Cursor to your semantic layer using the Model Context Protocol. One URL, governed access to your metrics and dimensions.

Bonnard exposes your semantic layer as a remote MCP server. Add one URL to your agent platform and it can explore your data model, run queries, and render charts — all through the Model Context Protocol.

![MCP chat with visualisations](/images/mcp-chat-demo.gif)

## MCP URL

```
https://mcp.bonnard.dev/mcp
```

On first use, your browser opens to sign in — the agent receives a 30-day token automatically. No API keys, no config files, no secrets to rotate.

## Connect your agent

Bonnard works with any MCP-compatible client:

- **Claude Desktop** — Add as a custom connector
- **ChatGPT** — Add via Settings > Apps (Pro/Plus)
- **Cursor** — Add via Settings > MCP or `.cursor/mcp.json`
- **Microsoft Copilot Studio** — Add as an MCP tool with OAuth 2.0 authentication
- **VS Code / GitHub Copilot** — Add via Command Palette or `.vscode/mcp.json`
- **Claude Code** — Add via `claude mcp add` or `.mcp.json`
- **Windsurf** — Add via MCP config
- **Gemini CLI** — Add via `.gemini/settings.json`

## Setup

### Claude Desktop

1. Click the **+** button in the chat input, then select **Connectors > Manage connectors**

![Claude Desktop — Connectors menu in chat](/images/claude-chat-connectors.png)

2. Click **Add custom connector**
3. Enter a name (e.g. "Bonnard MCP") and the MCP URL: `https://mcp.bonnard.dev/mcp`
4. Click **Add**

![Claude Desktop — Add custom connector dialog](/images/claude-add-connector.png)

Once added, enable the Bonnard connector in any chat via the **Connectors** menu.

Remote MCP servers in Claude Desktop must be added through the Connectors UI, not the JSON config file.

### ChatGPT

Custom MCP servers must be added in the browser at [chatgpt.com](https://chatgpt.com) — the desktop app does not support this.

1. Go to [chatgpt.com](https://chatgpt.com) in your browser
2. Open **Settings > Apps**

![ChatGPT — Settings > Apps](/images/chatgpt-apps.png)

3. Click **Advanced settings**, enable **Developer mode**, then click **Create app**

![ChatGPT — Advanced settings with Developer mode and Create app](/images/advanced-create-app-chatgpt.png)

4. Enter a name (e.g. "Bonnard MCP"), the MCP URL `https://mcp.bonnard.dev/mcp`, and select **OAuth** for authentication
5. Check the acknowledgement box and click **Create**

![ChatGPT — Create new app with MCP URL](/images/chatgpt-new-app.png)

Once created, the Bonnard connector appears under **Enabled apps**:

![ChatGPT — Bonnard MCP available in chat](/images/chatgpt-chat-apps.png)

Available on Pro and Plus plans.

### Cursor

Open **Settings > MCP** and add the server URL, or add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "bonnard": {
      "url": "https://mcp.bonnard.dev/mcp"
    }
  }
}
```

On first use, your browser will open to sign in and authorize the connection.

### VS Code / GitHub Copilot

Open the Command Palette and run **MCP: Add Server**, or add to `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "bonnard": {
      "type": "http",
      "url": "https://mcp.bonnard.dev/mcp"
    }
  }
}
```

On first use, your browser will open to sign in and authorize the connection.

### Claude Code

Run in your terminal:

```bash
claude mcp add --transport http bonnard https://mcp.bonnard.dev/mcp
```

Or add to `.mcp.json` in your project:

```json
{
  "mcpServers": {
    "bonnard": {
      "type": "http",
      "url": "https://mcp.bonnard.dev/mcp"
    }
  }
}
```

### Windsurf

Open **Settings > Plugins > Manage plugins > View raw config**, or edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "bonnard": {
      "serverUrl": "https://mcp.bonnard.dev/mcp"
    }
  }
}
```

### Gemini CLI

Add to `.gemini/settings.json` in your project or `~/.gemini/settings.json` globally:

```json
{
  "mcpServers": {
    "bonnard": {
      "url": "https://mcp.bonnard.dev/mcp"
    }
  }
}
```

## Authentication

MCP uses OAuth 2.0 with PKCE. When an agent first connects:

1. Agent discovers OAuth endpoints automatically
2. You are redirected to Bonnard to sign in and authorize
3. Agent receives an access token (valid for 30 days)

No API keys or manual token management needed.

## Available Tools

Once connected, AI agents can use these MCP tools:

| Tool | Description |
|------|-------------|
| `explore_schema` | Discover views and cubes, list their measures, dimensions, and segments. Supports browsing a specific source by name or searching across all fields by keyword. |
| `query` | Query the semantic layer with measures, dimensions, time dimensions, filters, segments, and pagination. |
| `sql_query` | Execute raw SQL against the semantic layer using Cube SQL syntax with `MEASURE()` for aggregations. Use for CTEs, UNIONs, and custom calculations. |
| `describe_field` | Get detailed metadata for a field — SQL expression, type, format, origin cube, and referenced fields. |
| `visualize` | Render line, bar, pie, and KPI charts directly inside the conversation. |

## Charts in chat

The `visualize` tool renders interactive charts inline — auto-detected from your query shape. Charts support dark mode, currency and percentage formatting, and multi-series data.

Ask "show me revenue by region this quarter" and get a formatted chart in your conversation, not a data dump.

## Testing

```bash
# Verify the MCP server is reachable
bon mcp test

# View connection info
bon mcp
```

## Managing Connections

Active MCP connections can be viewed and revoked in the Bonnard dashboard under **MCP**.

## See Also

- [querying.rest-api](querying.rest-api) — Query format reference
- [querying.sdk](querying.sdk) — TypeScript SDK for custom apps
- [cli.deploy](cli.deploy) — Deploy before querying
