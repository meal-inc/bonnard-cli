# @bonnard/cli

The Bonnard CLI (`bon`) takes you from zero to a deployed semantic layer in minutes. Define metrics in YAML, validate locally, deploy, and query — from your terminal or AI coding agent.

**Open source** — [view source on GitHub](https://github.com/meal-inc/bonnard-cli)

## Quick start

```bash
npx @bonnard/cli init           # Create project structure + agent templates
bon datasource add --demo       # Add demo dataset (no warehouse needed)
bon validate                    # Check syntax
bon login                       # Authenticate with Bonnard
bon deploy -m "Initial deploy"  # Deploy to Bonnard
```

No install needed — `npx` runs the CLI directly. Or install globally for shorter commands:

```bash
npm install -g @bonnard/cli
```

Requires Node.js 20+.

## Commands

| Command | Description |
|---------|-------------|
| `bon init` | Create project structure and AI agent templates |
| `bon login` | Authenticate with Bonnard |
| `bon logout` | Remove stored credentials |
| `bon whoami` | Show current login status |
| `bon datasource add` | Add a data source (interactive) |
| `bon datasource add --demo` | Add read-only demo dataset |
| `bon datasource add --from-dbt` | Import from dbt profiles |
| `bon datasource list` | List configured data sources |
| `bon datasource remove <name>` | Remove a data source |
| `bon validate` | Validate cube and view YAML |
| `bon deploy -m "message"` | Deploy to Bonnard |
| `bon deployments` | List deployment history |
| `bon diff <id>` | View changes in a deployment |
| `bon annotate <id>` | Add context to deployment changes |
| `bon query '{"measures":["orders.count"]}'` | Query the semantic layer (JSON) |
| `bon query "SELECT ..." --sql` | Query the semantic layer (SQL) |
| `bon mcp` | MCP setup instructions for AI agents |
| `bon mcp test` | Test MCP server connectivity |
| `bon docs [topic]` | Browse modeling documentation |
| `bon docs --search "joins"` | Search documentation |

## Agent-ready from the start

`bon init` generates context files for your AI coding tools:

- **Claude Code** — `.claude/rules/` + get-started skill
- **Cursor** — `.cursor/rules/` with auto-apply frontmatter
- **Codex** — `AGENTS.md` + skills folder

Your agent understands Bonnard's modeling language from the first prompt.

## Project structure

After `bon init`:

```
my-project/
├── bon.yaml              # Project configuration
├── bonnard/
│   ├── cubes/            # Cube definitions (measures, dimensions, joins)
│   └── views/            # View definitions (curated query interfaces)
└── .bon/                 # Local config (gitignored)
    └── datasources.yaml  # Data source credentials
```

## CI/CD

```bash
bon deploy --ci -m "CI deploy"
```

Non-interactive mode for pipelines. Datasources are synced automatically.

## Documentation

- [Getting Started](https://docs.bonnard.dev/docs/getting-started)
- [CLI Reference](https://docs.bonnard.dev/docs/cli)
- [Modeling Guide](https://docs.bonnard.dev/docs/modeling/cubes)
- [Querying](https://docs.bonnard.dev/docs/querying)
