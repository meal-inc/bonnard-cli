# Bonnard (Self-Hosted)

Self-hosted semantic layer for AI agents. Full documentation at [github.com/bonnard-data/bonnard](https://github.com/bonnard-data/bonnard).

## Quick Start

```bash
# 1. Configure your data source
#    Edit .env with your database credentials

# 2. Start the server
docker compose up -d

# 3. Define your semantic layer
#    Add cube/view YAML files to bonnard/cubes/ and bonnard/views/

# 4. Deploy models to the server
bon deploy

# 5. Verify your semantic layer
bon schema

# 6. Connect AI agents
bon mcp
```

## Connecting AI Agents

Run `bon mcp` to see connection config for your setup. Examples below.

### Claude Desktop / Cursor

```json
{
  "mcpServers": {
    "bonnard": {
      "url": "https://bonnard.example.com/mcp",
      "headers": {
        "Authorization": "Bearer your-secret-token-here"
      }
    }
  }
}
```

### Claude Code

```json
{
  "mcpServers": {
    "bonnard": {
      "type": "url",
      "url": "https://bonnard.example.com/mcp",
      "headers": {
        "Authorization": "Bearer your-secret-token-here"
      }
    }
  }
}
```

### CrewAI (Python)

```python
from crewai import MCPServerAdapter

mcp = MCPServerAdapter(
    url="https://bonnard.example.com/mcp",
    transport="streamable-http",
    headers={"Authorization": "Bearer your-secret-token-here"}
)
```

## Authentication

Protect your endpoints by setting `ADMIN_TOKEN` in `.env`:

```env
ADMIN_TOKEN=your-secret-token-here
```

All API and MCP endpoints will require `Authorization: Bearer <token>`. The `/health` endpoint remains open for monitoring.

Restart after changing `.env`:

```bash
docker compose up -d
```

## HTTPS

Caddy is included in the Docker Compose stack. To enable automatic HTTPS:

1. Point a domain at your server's IP (e.g. `mcp.example.com`)
2. Set `DOMAIN=mcp.example.com` in `.env`
3. Update `url` in `bon.yaml` to `https://mcp.example.com`
4. Restart: `docker compose up -d`

Caddy provisions Let's Encrypt certificates automatically.

Without `DOMAIN`, the server runs on HTTP port 80 (local development).

## Deploy to a VM

```bash
scp -r . user@your-server:~/bonnard/
ssh user@your-server
cd ~/bonnard
docker compose up -d
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `CUBEJS_DB_TYPE` | Database driver (`postgres`, `duckdb`, `snowflake`, `bigquery`, `databricks`, `redshift`, `clickhouse`) | `duckdb` |
| `CUBEJS_DB_*` | Database connection settings (host, port, name, user, pass) | — |
| `CUBEJS_API_SECRET` | HS256 secret for Cube JWT auth (auto-generated) | — |
| `ADMIN_TOKEN` | Bearer token for API/MCP authentication | — (open) |
| `DOMAIN` | Domain for automatic HTTPS (e.g. `mcp.example.com`) | — (HTTP on port 80) |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |
| `CUBE_VERSION` | Cube Docker image tag | `v1.6` |
| `BONNARD_VERSION` | Bonnard Docker image tag | `latest` |

## Monitoring

```bash
# Health check
curl http://localhost/health

# View logs
docker compose logs -f

# View active MCP sessions
curl -H "Authorization: Bearer <token>" http://localhost/api/mcp/sessions
```

## Deploying Schema Updates

```bash
bon deploy
```

Pushes cube/view YAML files to the running server. No restart needed — Cube picks up changes automatically.
