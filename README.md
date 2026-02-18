<p align="center">
  <a href="https://www.bonnard.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./assets/banner-dark.png" />
      <source media="(prefers-color-scheme: light)" srcset="./assets/banner-light.png" />
      <img alt="Bonnard — the semantic engine for MCP clients, AI agents, and data teams" src="./assets/banner-light.png" width="100%" />
    </picture>
  </a>
</p>

<p align="center">
  <strong>The semantic engine for MCP clients. Define metrics once, query from anywhere.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@bonnard/cli"><img src="https://img.shields.io/npm/v/@bonnard/cli?style=flat-square&color=0891b2" alt="npm version" /></a>
  <a href="https://github.com/meal-inc/bonnard-cli/blob/main/LICENSE"><img src="https://img.shields.io/github/license/meal-inc/bonnard-cli?style=flat-square" alt="MIT License" /></a>
  <a href="https://discord.com/invite/RQuvjGRz"><img src="https://img.shields.io/badge/Discord-Join%20us-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord" /></a>
</p>

<p align="center">
  <a href="https://docs.bonnard.dev/docs/">Docs</a> &middot;
  <a href="https://docs.bonnard.dev/docs/getting-started">Getting Started</a> &middot;
  <a href="https://docs.bonnard.dev/docs/changelog">Changelog</a> &middot;
  <a href="https://discord.com/invite/RQuvjGRz">Discord</a> &middot;
  <a href="https://www.bonnard.dev">Website</a>
</p>

---

Bonnard is an agent-native semantic layer CLI. Deploy an MCP server and governed analytics API in minutes — for AI agents, BI tools, and data teams. Define metrics and dimensions in YAML, validate locally, and ship to production. Works with Snowflake, BigQuery, Databricks, and PostgreSQL. Ships with native integrations for Claude Code, Cursor, and Codex. Built with TypeScript.

## Why Bonnard?

Most semantic layers were built for dashboards and retrofitted for AI. Bonnard was built the other way around — agent-native from day one with Model Context Protocol (MCP) as a core feature, not a plugin. One CLI takes you from an empty directory to a production semantic layer serving AI agents, BI tools, and human analysts through a single governed API.

<p align="center">
  <img src="./assets/architecture.png" alt="Bonnard architecture — data sources flow through the semantic layer to AI agents, BI tools, and MCP clients" width="100%" />
</p>

## Quick Start

No install required. Run directly with npx:

```bash
npx @bonnard/cli init
```

Or install globally:

```bash
npm install -g @bonnard/cli
```

Then follow the setup flow:

```bash
bon init                      # Scaffold project + agent configs
bon datasource add            # Connect your warehouse
bon validate                  # Check your models locally
bon login                     # Authenticate
bon deploy                    # Ship it
```

No warehouse yet? Start exploring with a full retail demo dataset:

```bash
bon datasource add --demo
```

Requires Node.js 20+.

## Agent-Native from Day One

When you run `bon init`, Bonnard generates context files so AI coding agents understand your semantic layer from the first prompt:

```
you@work my-project % bon init

Initialised Bonnard project
Core files:
  bon.yaml
  bonnard/cubes/
  bonnard/views/
Agent support:
  .claude/rules/bonnard.md
  .claude/skills/bonnard-get-started/
  .cursor/rules/bonnard.mdc
  AGENTS.md
```

| Agent | What gets generated |
| --- | --- |
| **Claude Code** | `.claude/rules/bonnard.md` + skill templates in `.claude/skills/` |
| **Cursor** | `.cursor/rules/bonnard.mdc` with frontmatter configuration |
| **Codex** | `AGENTS.md` + skills directory |

Set up your MCP server so agents can query your semantic layer directly:

```bash
bon mcp setup                 # Configure MCP server
bon mcp test                  # Verify the connection
```

## Auto-Detected from Your Project

<p align="center">
  <img src="./assets/datasources.png" alt="Auto-detected warehouses and data tools — Snowflake, BigQuery, PostgreSQL, Databricks, dbt, Dagster, Prefect, Airflow, Looker, Cube, Evidence, SQLMesh, Soda, Great Expectations" width="100%" />
</p>

Bonnard automatically detects your warehouses and data tools. Point it at your project and it discovers schemas, tables, and relationships.

**Warehouses** — Snowflake, BigQuery, PostgreSQL, Databricks

**Data Tools** — dbt, Dagster, Prefect, Airflow, Looker, Cube, Evidence, SQLMesh, Soda, Great Expectations

## Querying

Query your semantic layer from the terminal using JSON or SQL syntax:

```bash
# JSON query
bon query --measures revenue,order_count --dimensions product_category --time-dimension created_at

# SQL query
bon query --sql "SELECT product_category, MEASURE(revenue) FROM orders GROUP BY 1"
```

Agents connected via MCP can run the same queries programmatically, with full access to your governed metric definitions.

## Project Structure

```
my-project/
├── bon.yaml              # Project configuration
├── bonnard/
│   ├── cubes/            # Metric and dimension definitions
│   └── views/            # Curated query interfaces
├── .bon/                 # Local credentials (gitignored)
├── .claude/              # Claude Code agent context
├── .cursor/              # Cursor agent context
└── AGENTS.md             # Codex agent context
```

## CI/CD

Deploy from your pipeline with the `--ci` flag for non-interactive mode:

```bash
bon deploy --ci
```

Handles automatic datasource synchronisation and skips interactive prompts. Fits into GitHub Actions, GitLab CI, or any pipeline that runs Node.js.

## Commands

| Command | Description |
| --- | --- |
| `bon init` | Scaffold a new project with agent configs |
| `bon datasource add` | Connect a data source (or `--demo` for sample data) |
| `bon datasource add --from-dbt` | Import from dbt profiles |
| `bon datasource list` | List connected data sources |
| `bon validate` | Validate models locally before deploying |
| `bon deploy` | Deploy semantic layer to production |
| `bon deployments` | List active deployments |
| `bon diff` | Preview changes before deploying |
| `bon annotate` | Add metadata and descriptions to models |
| `bon query` | Run queries from the terminal (JSON or SQL) |
| `bon mcp setup` | Configure MCP server for agent access |
| `bon mcp test` | Test MCP connection |
| `bon docs` | Browse or search documentation from the CLI |
| `bon login` / `bon logout` | Manage authentication |
| `bon whoami` | Check current session |

For the full CLI reference, see the [documentation](https://docs.bonnard.dev/docs/cli-reference).

## Documentation

- [Getting Started](https://docs.bonnard.dev/docs/getting-started) — from zero to deployed in minutes
- [CLI Reference](https://docs.bonnard.dev/docs/cli-reference) — every command, flag, and option
- [Modeling Guide](https://docs.bonnard.dev/docs/modeling) — cubes, views, metrics, and dimensions
- [Querying](https://docs.bonnard.dev/docs/querying) — JSON and SQL query syntax
- [Changelog](https://docs.bonnard.dev/docs/changelog) — what shipped and when

## Community

- [Discord](https://discord.com/invite/RQuvjGRz) — ask questions, share feedback, connect with the team
- [GitHub Issues](https://github.com/meal-inc/bonnard-cli/issues) — bug reports and feature requests
- [LinkedIn](https://www.linkedin.com/company/bonnarddev/) — follow for updates
- [Website](https://www.bonnard.dev) — learn more about Bonnard

Contributions are welcome. If you find a bug or have an idea, open an issue or submit a pull request.

## License

[MIT](./LICENSE)
