# Queries

> Define data queries in dashboard markdown using YAML code fences.

## Overview

Each query fetches data from your semantic layer and makes it available to chart components. Queries use the same measures and dimensions defined in your cubes and views — field names stay consistent whether you're querying from a dashboard, MCP, or the API.

Query blocks have a unique name and map to a `QueryOptions` shape. Components reference them using `data={query_name}`. Field names are unqualified — use `count` not `orders.count` — because the `cube` property provides the context.

## Syntax

Query blocks use fenced code with the `query` language tag followed by a name:

````markdown
```query revenue_trend
cube: orders
measures: [total_revenue]
timeDimension:
  dimension: created_at
  granularity: month
  dateRange: [2025-01-01, 2025-12-31]
```
````

## Query Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `cube` | string | Yes | The cube or view to query (e.g. `orders`) |
| `measures` | string[] | No | Measures to aggregate (e.g. `[count, total_revenue]`) |
| `dimensions` | string[] | No | Dimensions to group by (e.g. `[status, city]`) |
| `filters` | Filter[] | No | Row-level filters |
| `timeDimension` | object | No | Time-based grouping and date range |
| `orderBy` | object | No | Sort specification (e.g. `{total_revenue: desc}`) |
| `limit` | number | No | Maximum rows to return |

### timeDimension

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `dimension` | string | Yes | Time dimension name (e.g. `created_at`) |
| `granularity` | string | No | `day`, `week`, `month`, `quarter`, or `year` |
| `dateRange` | string[] | No | `[start, end]` in `YYYY-MM-DD` format |

### filters

Each filter is an object with:

| Property | Type | Description |
|----------|------|-------------|
| `dimension` | string | Dimension to filter on |
| `operator` | string | `equals`, `notEquals`, `contains`, `gt`, `gte`, `lt`, `lte` |
| `values` | array | Values to filter by |

## Examples

### Simple aggregation

````markdown
```query total_orders
cube: orders
measures: [count]
```
````

### Grouped by dimension

````markdown
```query revenue_by_city
cube: orders
measures: [total_revenue]
dimensions: [city]
orderBy:
  total_revenue: desc
limit: 10
```
````

### Time series

````markdown
```query monthly_revenue
cube: orders
measures: [total_revenue]
timeDimension:
  dimension: created_at
  granularity: month
  dateRange: [2025-01-01, 2025-12-31]
```
````

### With filters

````markdown
```query completed_orders
cube: orders
measures: [count, total_revenue]
dimensions: [category]
filters:
  - dimension: status
    operator: equals
    values: [completed]
```
````

## Rules

- Query names must be valid identifiers (letters, numbers, `_`, `$`)
- Query names must be unique within a dashboard
- Every query must specify a `cube`
- Field names are unqualified (use `count` not `orders.count`) — the `cube` provides the context
- Components reference queries by name: `data={query_name}`

## See Also

- [Components](dashboards.components) — chart and display components
- [Dashboards](dashboards) — overview and deployment
- [Querying](querying) — query format reference
