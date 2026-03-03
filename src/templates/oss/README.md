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

## TLS with Caddy

[Caddy](https://caddyserver.com) provides automatic HTTPS via Let's Encrypt.

Create a `Caddyfile` next to your `docker-compose.yml`:

```
bonnard.example.com {
    reverse_proxy localhost:3000
}
```

Add Caddy to your `docker-compose.yml`:

```yaml
  caddy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
    restart: unless-stopped
```

Add the volume at the top level:

```yaml
volumes:
  models: {}
  caddy_data: {}
```

Then remove the Bonnard port mapping (`ports: - "3000:3000"`) since Caddy handles external traffic.

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
| `CUBE_PORT` | Cube API port | `4000` |
| `BONNARD_PORT` | Bonnard server port | `3000` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |
| `CUBE_VERSION` | Cube Docker image tag | `v1.6` |
| `BONNARD_VERSION` | Bonnard Docker image tag | `latest` |

## Monitoring

```bash
# Health check
curl http://localhost:3000/health

# View logs
docker compose logs -f

# View active MCP sessions
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/mcp/sessions
```

## Deploying Schema Updates

```bash
bon deploy
```

Pushes cube/view YAML files to the running server. No restart needed — Cube picks up changes automatically.
