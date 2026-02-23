# CLI

> Built for agent-first development by data engineers.

The Bonnard CLI (`bon`) takes you from zero to a deployed semantic layer in minutes. Initialize a project, connect your warehouse, define metrics in YAML, validate locally, and deploy — all from your terminal or your AI coding agent.

## Install

Run directly with `npx` — no install needed:

```bash
npx @bonnard/cli init
```

Or install globally for shorter commands:

```bash
npm install -g @bonnard/cli
```

Requires Node.js 20+.

## Agent-ready from the start

`bon init` generates context files for your AI coding tools automatically:

- **Claude Code** — `.claude/rules/` + get-started skill
- **Cursor** — `.cursor/rules/` with auto-apply frontmatter
- **Codex** — `AGENTS.md` + skills folder

Your agent understands Bonnard's modeling language from the first prompt.

## Project Structure

After `bon init`, your project has:

```
my-project/
├── bon.yaml              # Project configuration
├── bonnard/              # Semantic layer definitions
│   ├── cubes/            # Cube definitions
│   │   └── orders.yaml
│   └── views/            # View definitions
│       └── orders_overview.yaml
└── .bon/                 # Local config (gitignored)
    └── datasources.yaml  # Data source credentials
```

## File Organization

### One Cube Per File

```
bonnard/cubes/
├── orders.yaml
├── users.yaml
├── products.yaml
└── line_items.yaml
```

### Related Cubes Together

```
bonnard/cubes/
├── sales/
│   ├── orders.yaml
│   └── line_items.yaml
├── users/
│   ├── users.yaml
│   └── profiles.yaml
└── products/
    └── products.yaml
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `bon init` | Create project structure |
| `bon datasource add` | Add a data source |
| `bon datasource add --demo` | Add demo dataset (no warehouse needed) |
| `bon datasource add --from-dbt` | Import from dbt profiles |
| `bon datasource list` | List configured sources |
| `bon validate` | Check cube and view syntax |
| `bon deploy -m "message"` | Deploy to Bonnard (message required) |
| `bon deploy --ci` | Non-interactive deploy |
| `bon deployments` | List deployment history |
| `bon diff <id>` | View changes in a deployment |
| `bon annotate <id>` | Add context to deployment changes |
| `bon query '{...}'` | Query the semantic layer |
| `bon mcp` | MCP setup instructions for AI agents |
| `bon docs` | Browse documentation |

## CI/CD ready

Deploy from GitHub Actions, GitLab CI, or any pipeline:

```bash
bon deploy --ci -m "CI deploy"
```

Non-interactive mode. Datasources are synced automatically. Fails fast if anything is misconfigured.

## Deployment versioning

Every deploy creates a versioned deployment with automatic change detection — added, modified, removed, and breaking changes are flagged. Review history with `bon deployments`, inspect changes with `bon diff`, and add context with `bon annotate`.

## Built-in documentation

```bash
bon docs cubes.measures       # Read modeling docs in your terminal
bon docs --search "joins"     # Search across all topics
```

No context-switching. Learn and build in the same workflow.

## Best Practices

1. **Start from questions** — collect the most common questions your team asks, then build views that answer them. Don't just mirror your warehouse tables.
2. **Add filtered measures** — if a dashboard card has a WHERE clause beyond a date range, that filter should be a filtered measure. This is the #1 way to match real dashboard numbers.
3. **Write descriptions for agents** — descriptions are how AI agents choose which view and measure to use. Lead with scope, cross-reference related views, include dimension values.
4. **Validate often** — run `bon validate` after each change
5. **Test with real questions** — after deploying, ask an AI agent via MCP the same questions your team asks. Check it picks the right view and measure.
6. **Iterate** — expect 2-4 rounds of deploying, testing with questions, and improving descriptions before agents reliably answer the top 10 questions.

## See Also

- [cli.deploy](cli.deploy) — Deployment details
- [cli.validate](cli.validate) — Validation reference
