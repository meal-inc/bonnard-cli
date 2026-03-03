# Dashboards

> Build interactive dashboards from markdown with embedded semantic layer queries.

## Overview

Dashboards let your team track key metrics without leaving the Bonnard app. Define queries once in markdown, deploy them, and every viewer gets live, governed data — no separate BI tool needed. Filters, formatting, and layout are all declared in the same file.

A dashboard is a markdown file with YAML frontmatter, query blocks, and chart components. Write it as a `.md` file, preview locally with `bon dashboard dev`, and deploy with `bon dashboard deploy`.

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
measures: [orders.count]
` ``

<BigValue data={order_count} value="orders.count" title="Total Orders" />

` ``query by_status
measures: [orders.count]
dimensions: [orders.status]
` ``

<BarChart data={by_status} x="orders.status" y="orders.count" />
```

## Frontmatter

The YAML frontmatter is required and must include `title`:

```yaml
---
title: Revenue Dashboard        # Required
description: Monthly trends     # Optional
---
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Dashboard title displayed in the viewer and listings |
| `description` | No | Short description shown in dashboard listings |
| `theme` | No | Theme overrides for this dashboard (palette, colors, chartHeight) |

## Local Preview

Preview a dashboard locally with live reload before deploying. Requires `bon login`.

```bash
bon dashboard dev revenue.md
```

This starts a local server, opens your browser, and auto-reloads when you save changes. Queries run against your deployed semantic layer using your own credentials — governance policies apply.

## Deployment

Deploy from the command line. Each deploy auto-versions the dashboard so you can roll back if needed.

```bash
# Deploy a markdown dashboard
bon dashboard deploy revenue.md

# List deployed dashboards
bon dashboard list

# Open in browser
bon dashboard open revenue

# Remove a dashboard
bon dashboard remove revenue
```

Options:
- `--slug <slug>` — custom URL slug (default: derived from filename)
- `--title <title>` — dashboard title (default: from frontmatter)

## Versioning

Every deployment auto-increments the version number and saves a snapshot. Previous versions are preserved automatically.

Restoring a version creates a new version (e.g. restoring v2 from v5 creates v6 with v2's content). Version history is never deleted — only `bon dashboard remove` deletes all history.

## Governance

Dashboard queries respect the same governance policies as all other queries. When a user views a dashboard:

- **View-level access** — users only see data from views their governance groups allow
- **Row-level filtering** — user attributes (e.g. region, department) automatically filter query results
- All org members see the same dashboard list, but may see different data depending on their governance context

## See Also

- [Queries](dashboards.queries) — query syntax and properties
- [Components](dashboards.components) — chart and display components
- [Inputs](dashboards.inputs) — interactive filters
- [Theming](dashboards.theming) — customize colors, palettes, and styles
- [Examples](dashboards.examples) — complete dashboard examples
