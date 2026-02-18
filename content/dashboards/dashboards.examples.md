# Examples

> Complete dashboard examples showing common patterns.

## Revenue Overview Dashboard

The most common dashboard pattern: KPI cards at the top for at-a-glance metrics, a time series chart for trends, and a bar chart with data table for category breakdown.

```markdown
---
title: Revenue Overview
description: Monthly revenue trends and breakdowns
---

# Revenue Overview

` ``query total_revenue
cube: orders
measures: [total_revenue]
` ``

` ``query order_count
cube: orders
measures: [count]
` ``

` ``query avg_order
cube: orders
measures: [avg_order_value]
` ``

<Grid cols="3">
<BigValue data={total_revenue} value="total_revenue" title="Total Revenue" />
<BigValue data={order_count} value="count" title="Orders" />
<BigValue data={avg_order} value="avg_order_value" title="Avg Order" />
</Grid>

## Monthly Trend

` ``query monthly_revenue
cube: orders
measures: [total_revenue]
timeDimension:
  dimension: created_at
  granularity: month
  dateRange: [2025-01-01, 2025-12-31]
` ``

<LineChart data={monthly_revenue} x="created_at" y="total_revenue" title="Monthly Revenue" />

## By Category

` ``query by_category
cube: orders
measures: [total_revenue, count]
dimensions: [category]
orderBy:
  total_revenue: desc
` ``

<BarChart data={by_category} x="category" y="total_revenue" title="Revenue by Category" />
<DataTable data={by_category} />
```

## Sales Pipeline Dashboard

A status-focused dashboard using a pie chart for proportional breakdown, a horizontal bar chart for ranking, and filters to drill into a specific segment.

```markdown
---
title: Sales Pipeline
description: Order status breakdown and city analysis
---

# Sales Pipeline

` ``query by_status
cube: orders
measures: [count]
dimensions: [status]
` ``

<PieChart data={by_status} name="status" value="count" title="Order Status" />

## Top Cities

` ``query top_cities
cube: orders
measures: [total_revenue, count]
dimensions: [city]
orderBy:
  total_revenue: desc
limit: 10
` ``

<BarChart data={top_cities} x="city" y="total_revenue" horizontal />
<DataTable data={top_cities} />

## Completed Orders Over Time

` ``query completed_trend
cube: orders
measures: [total_revenue]
timeDimension:
  dimension: created_at
  granularity: week
  dateRange: [2025-01-01, 2025-06-30]
filters:
  - dimension: status
    operator: equals
    values: [completed]
` ``

<AreaChart data={completed_trend} x="created_at" y="total_revenue" title="Completed Order Revenue" />
```

## Multi-Series Dashboard

When you need to compare segments side-by-side, use the `series` prop to split data by a dimension into colored segments. This example shows stacked bars, grouped bars, multi-line, and stacked area — all from the same data.

```markdown
---
title: Revenue by Channel
description: Multi-series charts showing revenue breakdown by sales channel
---

# Revenue by Channel

` ``query revenue_by_channel
cube: orders
measures: [total_revenue]
dimensions: [channel]
timeDimension:
  dimension: created_at
  granularity: month
  dateRange: [2025-01-01, 2025-12-31]
` ``

## Stacked Bar (default)

<BarChart data={revenue_by_channel} x="created_at" y="total_revenue" series="channel" title="Revenue by Channel" />

## Grouped Bar

<BarChart data={revenue_by_channel} x="created_at" y="total_revenue" series="channel" type="grouped" title="Revenue by Channel (Grouped)" />

## Multi-Line

` ``query trend
cube: orders
measures: [total_revenue, count]
timeDimension:
  dimension: created_at
  granularity: month
  dateRange: [2025-01-01, 2025-12-31]
` ``

<LineChart data={trend} x="created_at" y="total_revenue,count" title="Revenue vs Orders" />

## Stacked Area by Channel

<AreaChart data={revenue_by_channel} x="created_at" y="total_revenue" series="channel" type="stacked" title="Revenue by Channel" />
```

## Formatted Dashboard

Use format presets to display currencies, percentages, and number styles consistently across KPIs, charts, and tables.

```markdown
---
title: Sales Performance
description: Formatted revenue metrics and trends
---

# Sales Performance

` ``query totals
cube: orders
measures: [total_revenue, count, avg_order_value]
` ``

<Grid cols="3">
<BigValue data={totals} value="total_revenue" title="Revenue" fmt="eur2" />
<BigValue data={totals} value="count" title="Orders" fmt="num0" />
<BigValue data={totals} value="avg_order_value" title="Avg Order" fmt="eur2" />
</Grid>

## Revenue Trend

` ``query monthly
cube: orders
measures: [total_revenue]
timeDimension:
  dimension: created_at
  granularity: month
  dateRange: [2025-01-01, 2025-12-31]
` ``

<LineChart data={monthly} x="created_at" y="total_revenue" title="Monthly Revenue" yFmt="eur" />

## Detail Table

` ``query details
cube: orders
measures: [total_revenue, count]
dimensions: [category]
orderBy:
  total_revenue: desc
` ``

<DataTable data={details} fmt="total_revenue:eur2,count:num0" />
```

## Interactive Dashboard

Combine a DateRange picker and Dropdown filter to let viewers explore the data. Filter state syncs to the URL, so shared links preserve the exact filtered view.

```markdown
---
title: Interactive Sales
description: Sales dashboard with date and channel filters
---

# Interactive Sales

<DateRange name="period" default="last-6-months" label="Time Period" />
<Dropdown name="channel" dimension="channel" data={channels} queries="trend,by_city" label="Channel" />

` ``query channels
cube: orders
dimensions: [channel]
` ``

` ``query kpis
cube: orders
measures: [total_revenue, count]
` ``

<Grid cols="2">
<BigValue data={kpis} value="total_revenue" title="Revenue" fmt="eur2" />
<BigValue data={kpis} value="count" title="Orders" fmt="num0" />
</Grid>

## Revenue Trend

` ``query trend
cube: orders
measures: [total_revenue]
timeDimension:
  dimension: created_at
  granularity: month
` ``

<LineChart data={trend} x="created_at" y="total_revenue" title="Monthly Revenue" yFmt="eur" />

## By City

` ``query by_city
cube: orders
measures: [total_revenue]
dimensions: [city]
orderBy:
  total_revenue: desc
limit: 10
` ``

<BarChart data={by_city} x="city" y="total_revenue" title="Top Cities" yFmt="eur" />
```

The `<DateRange>` automatically applies to all queries with a `timeDimension` (here: `trend`). The `<Dropdown>` filters `trend` and `by_city` by channel. The `channels` query populates the dropdown and is never filtered by it.

## Tips

- **Start with KPIs**: Use `BigValue` in a `Grid` at the top for key metrics
- **One query per chart**: Each component gets its own query — keep them focused
- **Use views**: Prefer view names over cube names when available for cleaner field names
- **Name queries descriptively**: `monthly_revenue` is better than `q1`
- **Limit large datasets**: Add `limit` to dimension queries to avoid oversized charts
- **Time series**: Always use `timeDimension` with `granularity` for time-based charts
- **Multi-series**: Use `series="column"` to split data by a dimension. For bars, default is stacked; use `type="grouped"` for side-by-side
- **Multiple y columns**: Use comma-separated values like `y="revenue,cases"` to show multiple measures on one chart

## See Also

- [Dashboards](dashboards) — overview and deployment
- [Queries](dashboards.queries) — query syntax and properties
- [Components](dashboards.components) — chart and display components
