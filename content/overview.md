# Overview

> Define your metrics once. Query governed data from any AI agent, dashboard, or application.

Bonnard is a semantic layer platform that sits between your data warehouse and everything that consumes your data. Define metrics once in YAML, deploy from the terminal, and one command gives you:

- **MCP server** — AI agents query your metrics directly (Claude, Cursor, ChatGPT)
- **REST API** — backends, scripts, and non-JavaScript consumers
- **React SDK** — custom data apps and embedded analytics
- **Hosted dashboards** — Markdown-authored, deployed from the terminal
- **Catalog UI** — browse your schema, check definitions, review deploys

All governed, cached, and queried from the same schema. This page walks through the typical workflow from first install to production.

## 1. Build your semantic layer

Connect your warehouse and define metrics in YAML. Cubes map to database tables and define measures (revenue, count) and dimensions (status, date). Views compose cubes into focused interfaces for specific teams.

- `bon init` scaffolds your project
- `bon datasource add` connects your warehouse (Snowflake, BigQuery, Postgres, Redshift, Databricks)
- Define cubes in `bonnard/cubes/` and views in `bonnard/views/`
- `bon validate` checks for errors before you deploy

**Docs:** [Getting Started](/docs/getting-started) · [Cubes](/docs/modeling/cubes) · [Views](/docs/modeling/views) · [CLI](/docs/cli)

## 2. Deploy and review

`bon deploy` pushes your semantic layer to Bonnard. This gives you an MCP server, REST API, and SDK endpoint — all live in one command. Each deploy is tracked with a full diff of what changed.

Browse your deployed schema in the catalog UI — check field definitions, see change history, and verify everything looks right before sharing with your team.

**Docs:** [Deploying](/docs/cli/deploy) · [Catalog](/docs/catalog)

## 3. Control access

Set up who can see what. Governance is managed from the dashboard — assign groups, restrict views, filter rows by team. For B2B apps where each customer sees only their data, use security context with the SDK.

**Docs:** [Governance](/docs/access-control/governance) · [Security Context](/docs/access-control/security-context)

## 4. Give agents your metrics

Share the MCP server URL with your team. Claude, Cursor, ChatGPT, and any MCP-compatible client can explore your data model, run queries, and render charts. No integration code — just a URL.

**Docs:** [MCP](/docs/mcp)

## 5. Build dashboards

Write dashboards in Markdown with chart components. Preview locally with `bon dashboard dev`, deploy with `bon dashboard deploy`. Version-controlled and reviewable like everything else in your repo.

**Docs:** [Dashboards](/docs/dashboards)

## 6. Build custom apps

Use the React SDK to build data apps with your own UI. `useBonnardQuery` fetches governed data, and chart components (LineChart, BarChart, BigValue, DataTable) render it. Works with any React framework.

**Docs:** [SDK](/docs/sdk) · [React](/docs/sdk/react)

## 7. Embed in your website

For public-facing or customer-facing analytics, use the SDK with token exchange. Your server sets the security context, and the frontend queries scoped data. Works in React apps or plain HTML via the CDN bundle.

**Docs:** [Authentication](/docs/sdk/authentication) · [Browser / CDN](/docs/sdk/browser)

## 8. Query via API

For backends, scripts, and non-JavaScript consumers, use the REST API directly. Same governed data, same query format.

**Docs:** [REST API](/docs/rest-api)
