# Overview

> Define your metrics once. Query governed data from any AI tool, dashboard, or application.

Bonnard is a semantic layer platform. Your data team defines metrics once, and everyone else gets reliable answers from the AI tools they already use — Claude, ChatGPT, Cursor, Copilot — in whatever form they need. No new interface to learn.

## Architecture

```
Data Warehouse → Cubes (metrics) → Views (interfaces) → Query Surfaces
                                                          ├── MCP (AI agents)
                                                          ├── REST API
                                                          └── SDK (custom apps)
```

**Cubes** map to your database tables and define measures (revenue, count) and dimensions (status, date). **Views** compose cubes into focused interfaces for specific teams or use cases. Once deployed, your semantic layer is queryable through MCP, REST API, or the TypeScript SDK.

## Multi-warehouse

Connect any combination of warehouses through a single semantic layer:

- **PostgreSQL** — Direct TCP connection
- **Redshift** — Cluster or serverless endpoint
- **Snowflake** — Account-based authentication
- **BigQuery** — GCP service account
- **Databricks** — Token-based workspace connection

Metrics from different warehouses are queried through the same API. Your consumers never need to know where the data lives.

## One source of truth for every AI

Bonnard exposes your semantic layer as a remote MCP server. Add one URL to any MCP-compatible client — Claude, ChatGPT, Cursor, VS Code, Windsurf, Gemini — and it can explore your data model, run queries, and render charts. Every query is governed and scoped to the user's permissions automatically.

## Governed by default

Metrics are version-controlled and deployed from the terminal. Access, roles, and row-level security are managed by admins from the dashboard. Every query — whether from an AI agent, the API, or the SDK — is scoped to the user's permissions. No ungoverned access.

## Your data stays where it is

Your data stays in your warehouse. Bonnard adds a governed semantic layer on top — hosted, queryable, and managed. Each organization gets isolated query execution. Deploy from your terminal in minutes, not quarters.

## Where to go next

- **[Getting Started](/docs/getting-started)** — Install the CLI and build your first semantic layer
- **[Modeling](/docs/modeling)** — Define cubes, views, and pre-aggregations
- **[Querying](/docs/querying)** — Query via MCP, REST API, or SDK
- **[CLI](/docs/cli)** — Commands, deployment, and validation
- **[Governance](/docs/governance)** — Control access to views, columns, and rows
- **[Catalog](/docs/catalog)** — Browse your data model in the browser
