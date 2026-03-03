# Inputs

> Interactive filter inputs for dashboards — date range pickers and dropdown selectors.

## Overview

Inputs add interactivity to dashboards. They render as a filter bar above the charts and re-execute queries when values change. Inspired by Evidence.dev's inputs pattern, adapted for the Cube semantic layer.

Two input types are available:

- **DateRange** — preset date range picker that overrides `timeDimension.dateRange`
- **Dropdown** — dimension value selector that adds/replaces filters

## DateRange

Renders a date range preset picker. When changed, overrides `timeDimension.dateRange` on targeted queries.

```markdown
<DateRange name="period" default="last-6-months" label="Time Period" />
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | string | Yes | Unique input name |
| `default` | preset key | No | Initial preset (default: `last-6-months`) |
| `label` | string | No | Label shown above the picker |
| `queries` | string | No | Comma-separated query names to target |

### Targeting

Targeting lets you control which queries a filter affects — useful when some charts should stay fixed while others respond to filter changes.

- **No `queries` prop** — applies to ALL queries that have a `timeDimension`
- **With `queries` prop** — only applies to the listed queries

### Presets

| Key | Label |
|-----|-------|
| `last-7-days` | Last 7 Days |
| `last-30-days` | Last 30 Days |
| `last-3-months` | Last 3 Months |
| `last-6-months` | Last 6 Months |
| `last-12-months` | Last 12 Months |
| `month-to-date` | Month to Date |
| `year-to-date` | Year to Date |
| `last-year` | Last Year |
| `all-time` | All Time |

## Dropdown

Renders a dropdown selector populated from a query's dimension values. Adds a filter on the specified dimension to targeted queries.

```markdown
<Dropdown name="channel" dimension="orders.channel" data={channels} queries="main,trend" label="Channel" />
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | string | Yes | Unique input name |
| `dimension` | string | Yes | Dimension to filter on |
| `data` | query ref | Yes | Query that provides the dropdown options |
| `queries` | string | Yes | Comma-separated query names to filter |
| `label` | string | No | Label shown above the dropdown |
| `default` | string | No | Initial selected value (default: All) |

### Behavior

- Always includes an "All" option that removes the filter
- The dropdown's own `data` query is never filtered by itself (prevents circular dependencies)
- `queries` is required — the dropdown only filters explicitly listed queries

## Examples

### DateRange only

```markdown
---
title: Revenue Trends
---

<DateRange name="period" default="last-6-months" label="Time Period" />

` ``query monthly_revenue
measures: [orders.total_revenue]
timeDimension:
  dimension: orders.created_at
  granularity: month
` ``

<LineChart data={monthly_revenue} x="orders.created_at" y="orders.total_revenue" />
```

The DateRange automatically applies to `monthly_revenue` because it has a `timeDimension`. No hardcoded `dateRange` needed in the query.

### Dropdown with query binding

```markdown
---
title: Sales by Channel
---

` ``query channels
dimensions: [orders.channel]
` ``

<Dropdown name="ch" dimension="orders.channel" data={channels} queries="main" label="Channel" />

` ``query main
measures: [orders.total_revenue]
dimensions: [orders.city]
` ``

<BarChart data={main} x="orders.city" y="orders.total_revenue" />
```

### Combined inputs

```markdown
---
title: Sales Dashboard
---

<DateRange name="period" default="last-6-months" label="Time Period" />
<Dropdown name="channel" dimension="orders.channel" data={channels} queries="trend,by_city" label="Channel" />

` ``query channels
dimensions: [orders.channel]
` ``

` ``query trend
measures: [orders.total_revenue]
timeDimension:
  dimension: orders.created_at
  granularity: month
` ``

<LineChart data={trend} x="orders.created_at" y="orders.total_revenue" />

` ``query by_city
measures: [orders.total_revenue]
dimensions: [orders.city]
` ``

<BarChart data={by_city} x="orders.city" y="orders.total_revenue" />
```

Both inputs work together: the DateRange scopes the time window on `trend` (which has a timeDimension), and the Dropdown filters both `trend` and `by_city` by channel.

## Shareable URLs

Input values automatically sync to URL query params. When a user changes a filter, the URL updates to reflect the current state — for example:

```
/dashboards/sales?period=last-30-days&channel=Online
```

- **Default values are omitted** from the URL for clean links
- **Sharing a URL** preserves the current filter state — recipients see exactly the same filtered view
- **Refreshing the page** restores the active filters from the URL
- The **Copy Link** button in the dashboard header copies the full URL including filter params

DateRange inputs store the preset key (e.g. `last-30-days`), so shared URLs stay relative to today. Dropdown inputs store the selected value string.

## See Also

- [Dashboards](dashboards) — overview and deployment
- [Components](dashboards.components) — chart and display components
- [Examples](dashboards.examples) — complete dashboard examples
