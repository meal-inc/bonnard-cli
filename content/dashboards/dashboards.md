# Dashboards

> Build interactive dashboards from markdown with embedded semantic layer queries.

## Overview

Dashboards let your team track key metrics without leaving the Bonnard app. Define queries once in markdown, deploy them, and every viewer gets live, governed data — no separate BI tool needed. Filters, formatting, and layout are all declared in the same file.

A dashboard is a markdown file with YAML frontmatter, query blocks, and chart components. Write it as a `.md` file, deploy with `bon dashboard deploy`, and view it in the Bonnard web app.

## Format

A dashboard file has three parts:

1. **Frontmatter** — YAML metadata between `---` delimiters
2. **Query blocks** — Named data queries in ` ```query ` code fences
3. **Content** — Markdown text and chart component tags

## Minimal Example

```markdown
---
title: Order Summary
description: Key metrics for the orders pipeline
---

# Order Summary

` ``query order_count
cube: orders
measures: [count]
` ``

<BigValue data={order_count} value="count" title="Total Orders" />

` ``query by_status
cube: orders
measures: [count]
dimensions: [status]
` ``

<BarChart data={by_status} x="status" y="count" />
```

## Frontmatter

The YAML frontmatter is required and must include `title`:

```yaml
---
title: Revenue Dashboard        # Required
description: Monthly trends     # Optional
slug: revenue-dashboard         # Optional (derived from title if omitted)
---
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Dashboard title displayed in the viewer and listings |
| `description` | No | Short description shown in dashboard listings |
| `slug` | No | URL-safe identifier. Auto-derived from title if omitted |

## Deployment

Deploy from the command line or via MCP tools. Each deploy auto-versions the dashboard so you can roll back if needed.

```bash
# Deploy a single dashboard
bon dashboard deploy revenue.md

# Deploy all dashboards in a directory
bon dashboard deploy dashboards/

# List deployed dashboards
bon dashboard list

# Remove a dashboard
bon dashboard remove revenue-dashboard
```

Via MCP tools, agents can use `deploy_dashboard` with the markdown content as a string.

## Versioning

Every deployment auto-increments the version number and saves a snapshot. You can view version history and restore previous versions:

```bash
# Via MCP tools:
# get_dashboard with version parameter to fetch a specific version
# deploy_dashboard with slug + restore_version to roll back
```

Restoring a version creates a new version (e.g. restoring v2 from v5 creates v6 with v2's content). Version history is never deleted — only `remove_dashboard` deletes all history.

## Sharing

Dashboard viewers include a **Share** menu in the header with:

- **Copy link** — copies the current URL including any active filter state
- **Print to PDF** — opens the browser print dialog for PDF export

Filter state (DateRange presets, Dropdown selections) is encoded in URL query params, so shared links preserve the exact filtered view the sender was looking at.

## Governance

Dashboard queries respect the same governance policies as all other queries. When a user views a dashboard:

- **View-level access** — users only see data from views their governance groups allow
- **Row-level filtering** — user attributes (e.g. region, department) automatically filter query results
- All org members see the same dashboard list, but may see different data depending on their governance context

## See Also

- [Queries](dashboards.queries) — query syntax and properties
- [Components](dashboards.components) — chart and display components
- [Inputs](dashboards.inputs) — interactive filters
- [Examples](dashboards.examples) — complete dashboard examples
