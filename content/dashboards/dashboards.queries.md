# Queries

> Define data queries in dashboard markdown using YAML code fences.

## Overview

Each query fetches data from your semantic layer and makes it available to chart components. Queries use the same measures and dimensions defined in your cubes and views — field names stay consistent whether you're querying from a dashboard, MCP, or the API.

Query blocks have a unique name and map to a `QueryOptions` shape. Components reference them using `data={query_name}`. All field names must be fully qualified with the cube or view name (e.g. `orders.count`, `orders.created_at`).

## Syntax

Query blocks use fenced code with the `query` language tag followed by a name:

````markdown
```query revenue_trend
measures: [orders.total_revenue]
timeDimension:
  dimension: orders.created_at
  granularity: month
  dateRange: [2025-01-01, 2025-12-31]
```
````

## Query Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `measures` | string[] | No | Fully qualified measures to aggregate (e.g. `[orders.count, orders.total_revenue]`) |
| `dimensions` | string[] | No | Fully qualified dimensions to group by (e.g. `[orders.status, orders.city]`) |
| `filters` | Filter[] | No | Row-level filters |
| `timeDimension` | object | No | Time-based grouping and date range |
| `orderBy` | object | No | Sort specification (e.g. `{orders.total_revenue: desc}`) |
| `limit` | number | No | Maximum rows to return |

### timeDimension

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `dimension` | string | Yes | Fully qualified time dimension name (e.g. `orders.created_at`) |
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
measures: [orders.count]
```
````

### Grouped by dimension

````markdown
```query revenue_by_city
measures: [orders.total_revenue]
dimensions: [orders.city]
orderBy:
  orders.total_revenue: desc
limit: 10
```
````

### Time series

````markdown
```query monthly_revenue
measures: [orders.total_revenue]
timeDimension:
  dimension: orders.created_at
  granularity: month
  dateRange: [2025-01-01, 2025-12-31]
```
````

### With filters

````markdown
```query completed_orders
measures: [orders.count, orders.total_revenue]
dimensions: [orders.category]
filters:
  - dimension: orders.status
    operator: equals
    values: [completed]
```
````

## Rules

- Query names must be valid identifiers (letters, numbers, `_`, `$`)
- Query names must be unique within a dashboard
- All field names must be fully qualified with the cube or view name (e.g. `orders.count`, not `count`)
- Components reference queries by name: `data={query_name}`

## See Also

- [Components](dashboards.components) — chart and display components
- [Dashboards](dashboards) — overview and deployment
- [Querying](querying) — query format reference
