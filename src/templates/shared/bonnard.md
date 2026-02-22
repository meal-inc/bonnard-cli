# Bonnard Semantic Layer

Bonnard is a semantic layer platform that sits between your data warehouse and end users (analysts, dashboards, AI agents). It provides consistent metrics and dimensions via a type-safe API.

## How It Works

```
Data Warehouse (Snowflake, Postgres, BigQuery, Databricks, DuckDB)
        ↓
   Cubes (measures, dimensions, joins)
        ↓
   Views (curated subsets for specific use cases)
        ↓
   Bonnard API
        ↓
   Consumers (MCP tools, dashboards, analysts)
```

## Key Concepts

**Cubes** — Define metrics (measures) and attributes (dimensions) on top of database tables. Each cube typically maps to one table or a base SQL query.

**Views** — Compose cubes into focused interfaces for specific use cases. Views expose only the relevant measures/dimensions, hiding complexity.

**Datasources** — Warehouse connections stored locally in `.bon/datasources.yaml`. Referenced by cubes via the `data_source` property.

## Project Structure

```
my-project/
├── bon.yaml              # Project config
├── bonnard/              # Semantic layer definitions
│   ├── cubes/            # Cube definitions
│   │   ├── orders.yaml
│   │   └── customers.yaml
│   └── views/            # View definitions
│       └── sales_overview.yaml
└── .bon/                 # Local state (gitignored)
    └── datasources.yaml  # Warehouse connections
```

## Demo Data

No warehouse? Use the built-in demo dataset to try Bonnard:

```bash
bon datasource add --demo
```

This adds a read-only **Contoso** retail database (Postgres) with tables:
- `fact_sales` — transactions with sales_amount, total_cost, sales_quantity, return_quantity, return_amount, discount_amount, date_key, channel_key, store_key, product_key
- `dim_product` — product_name, brand_name, manufacturer, unit_cost, unit_price
- `dim_store` — store_name, store_type, employee_count, selling_area_size, status
- `dim_channel` — channel_name (values: Store, Online, Catalog, Reseller)
- `dim_customer` — first_name, last_name, gender, yearly_income, education, occupation

All tables are in the `contoso` schema. The datasource is named `contoso_demo`.

## Quick Reference

| Command | Purpose |
|---------|---------|
| `bon init` | Initialize new project |
| `bon datasource add` | Add warehouse connection |
| `bon datasource add --demo` | Add demo dataset (no warehouse needed) |
| `bon datasource add --from-dbt` | Import from dbt profiles |
| `bon validate` | Validate YAML syntax, warn on missing descriptions and `data_source` |
| `bon deploy -m "message"` | Deploy to Bonnard (requires login, message required) |
| `bon deploy --ci` | Non-interactive deploy |
| `bon deployments` | List recent deployments (add `--all` for full history) |
| `bon diff <deployment-id>` | Show changes in a deployment (`--breaking` for breaking only) |
| `bon annotate <deployment-id>` | Add reasoning/context to deployment changes |
| `bon query '{...}'` | Query the deployed semantic layer (requires `bon deploy` first, not for raw DB access) |
| `bon mcp` | Show MCP setup instructions for AI agents |
| `bon docs` | Browse documentation |
| `bon dashboard dev <file>` | Preview a markdown dashboard locally with live reload |
| `bon dashboard deploy <file>` | Deploy a markdown or HTML dashboard |
| `bon dashboard list` | List deployed dashboards with URLs |
| `bon dashboard remove <slug>` | Remove a deployed dashboard |
| `bon dashboard open <slug>` | Open a deployed dashboard in the browser |
| `bon theme get` | Show current org dashboard theme |
| `bon theme set <file>` | Set org theme from YAML/JSON file |
| `bon theme reset` | Reset org theme to defaults |
| `bon metabase connect` | Connect to a Metabase instance (API key) |
| `bon metabase analyze` | Generate analysis report for semantic layer planning |
| `bon metabase explore` | Browse Metabase databases, collections, cards, dashboards |

## Learning YAML Syntax

Use `bon docs` to explore data modeling concepts:

```bash
bon docs                        # Show all topics
bon docs cubes                  # Learn about cubes
bon docs cubes.measures         # Learn about measures
bon docs cubes.measures.types   # See all 12 measure types
bon docs cubes.joins            # Learn about relationships
bon docs views                  # Learn about views
bon docs --search "primary key" # Search for a concept
bon docs cubes.measures -r      # Topic + all children
bon docs cubes --format json    # Structured output
```

Topics follow dot notation (e.g., `cubes.dimensions.time`). Use `--recursive` to see a topic and all its children.

## Workflow

1. **Start from questions** — Collect the most common questions your team asks about data. Group them by audience.
2. **Setup datasource** — `bon datasource add --from-dbt` or manual
3. **Create cubes** — Define measures/dimensions in `bonnard/cubes/*.yaml`. Add filtered measures for any metric with a WHERE clause.
4. **Create views** — Compose cubes in `bonnard/views/*.yaml`. Name views by audience/use case, not by table.
5. **Write descriptions** — Descriptions are how AI agents choose views and measures. Lead with scope, cross-reference related views, include dimension values.
6. **Validate** — `bon validate`
7. **Deploy** — `bon login` then `bon deploy -m "description of changes"`
8. **Test with questions** — Query via MCP with real user questions. Check the agent picks the right view and measure.
9. **Iterate** — Fix agent mistakes by improving descriptions and adding filtered measures. Expect 2-4 iterations.

For a guided walkthrough: `/bonnard-get-started`
For projects migrating from Metabase: `/bonnard-metabase-migrate`
For design principles: `/bonnard-design-guide`
For building markdown dashboards: `/bonnard-build-dashboard` (see also `bon docs dashboards`)

## Deployment & Change Tracking

Every deploy creates a versioned deployment with change detection:

- **Deploy** requires a message: `bon deploy -m "Add revenue metrics"`
- **Changes** are detected automatically: added, modified, removed fields
- **Breaking changes** (removed measures/dimensions, type changes) are flagged
- **Deployment history**: `bon deployments` lists recent deploys with IDs
- **Diff**: `bon diff <id>` shows all changes; `bon diff <id> --breaking` filters to breaking only
- **Annotate**: `bon annotate <id> --data '{"object": "note"}'` adds context to changes

For CI/CD pipelines, use `bon deploy --ci -m "message"` (non-interactive, fails on issues). Datasources are always synced automatically during deploy.

## Design Principles

Summary — see `/bonnard-design-guide` for examples and details.

1. **Start from questions, not tables** — collect the 10-20 most common questions, build views that answer them
2. **Views are for audiences, not tables** — name by use case (`sales_pipeline`), not by table (`orders_view`)
3. **Add filtered measures** — if a dashboard card has a WHERE clause beyond date range, make it a filtered measure
4. **Descriptions are the discovery API** — lead with scope, cross-reference related views, include dimension values
5. **Build cross-entity views** — combine cubes when users think across tables; don't force one view per cube
6. **Test with natural language** — ask an agent real questions via MCP; check it picks the right view and measure
7. **Iterate** — expect 2-4 rounds; fix agent mistakes by improving descriptions, not data

## Technical Gotchas

- **Always set `data_source`** on cubes — without it, cubes silently use the default warehouse, which breaks when multiple warehouses are added later. `bon validate` warns about this.
- **Primary keys must be unique** — Cube deduplicates on the primary key. If the column isn't unique (e.g., a date with multiple rows per day), dimension queries silently return empty results. For tables without a natural unique column, use a `sql` query with `ROW_NUMBER()` to generate a synthetic key.
- **Use `sql_table` with full schema path** (e.g., `schema.table_name`) for clarity.
