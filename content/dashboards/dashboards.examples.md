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
measures: [orders.total_revenue]
` ``

` ``query order_count
measures: [orders.count]
` ``

` ``query avg_order
measures: [orders.avg_order_value]
` ``

<Grid cols="3">
<BigValue data={total_revenue} value="orders.total_revenue" title="Total Revenue" />
<BigValue data={order_count} value="orders.count" title="Orders" />
<BigValue data={avg_order} value="orders.avg_order_value" title="Avg Order" />
</Grid>

## Monthly Trend

` ``query monthly_revenue
measures: [orders.total_revenue]
timeDimension:
  dimension: orders.created_at
  granularity: month
  dateRange: [2025-01-01, 2025-12-31]
` ``

<LineChart data={monthly_revenue} x="orders.created_at" y="orders.total_revenue" title="Monthly Revenue" />

## By Category

` ``query by_category
measures: [orders.total_revenue, orders.count]
dimensions: [orders.category]
orderBy:
  orders.total_revenue: desc
` ``

<BarChart data={by_category} x="orders.category" y="orders.total_revenue" title="Revenue by Category" />
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
measures: [orders.count]
dimensions: [orders.status]
` ``

<PieChart data={by_status} name="orders.status" value="orders.count" title="Order Status" />

## Top Cities

` ``query top_cities
measures: [orders.total_revenue, orders.count]
dimensions: [orders.city]
orderBy:
  orders.total_revenue: desc
limit: 10
` ``

<BarChart data={top_cities} x="orders.city" y="orders.total_revenue" horizontal />
<DataTable data={top_cities} />

## Completed Orders Over Time

` ``query completed_trend
measures: [orders.total_revenue]
timeDimension:
  dimension: orders.created_at
  granularity: week
  dateRange: [2025-01-01, 2025-06-30]
filters:
  - dimension: orders.status
    operator: equals
    values: [completed]
` ``

<AreaChart data={completed_trend} x="orders.created_at" y="orders.total_revenue" title="Completed Order Revenue" />
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
measures: [orders.total_revenue]
dimensions: [orders.channel]
timeDimension:
  dimension: orders.created_at
  granularity: month
  dateRange: [2025-01-01, 2025-12-31]
` ``

## Stacked Bar (default)

<BarChart data={revenue_by_channel} x="orders.created_at" y="orders.total_revenue" series="orders.channel" title="Revenue by Channel" />

## Grouped Bar

<BarChart data={revenue_by_channel} x="orders.created_at" y="orders.total_revenue" series="orders.channel" type="grouped" title="Revenue by Channel (Grouped)" />

## Multi-Line

` ``query trend
measures: [orders.total_revenue, orders.count]
timeDimension:
  dimension: orders.created_at
  granularity: month
  dateRange: [2025-01-01, 2025-12-31]
` ``

<LineChart data={trend} x="orders.created_at" y="orders.total_revenue,orders.count" title="Revenue vs Orders" />

## Stacked Area by Channel

<AreaChart data={revenue_by_channel} x="orders.created_at" y="orders.total_revenue" series="orders.channel" type="stacked" title="Revenue by Channel" />
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
measures: [orders.total_revenue, orders.count, orders.avg_order_value]
` ``

<Grid cols="3">
<BigValue data={totals} value="orders.total_revenue" title="Revenue" fmt="eur2" />
<BigValue data={totals} value="orders.count" title="Orders" fmt="num0" />
<BigValue data={totals} value="orders.avg_order_value" title="Avg Order" fmt="eur2" />
</Grid>

## Revenue Trend

` ``query monthly
measures: [orders.total_revenue]
timeDimension:
  dimension: orders.created_at
  granularity: month
  dateRange: [2025-01-01, 2025-12-31]
` ``

<LineChart data={monthly} x="orders.created_at" y="orders.total_revenue" title="Monthly Revenue" yFmt="eur" />

## Detail Table

` ``query details
measures: [orders.total_revenue, orders.count]
dimensions: [orders.category]
orderBy:
  orders.total_revenue: desc
` ``

<DataTable data={details} fmt="orders.total_revenue:eur2,orders.count:num0" />
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
<Dropdown name="channel" dimension="orders.channel" data={channels} queries="trend,by_city" label="Channel" />

` ``query channels
dimensions: [orders.channel]
` ``

` ``query kpis
measures: [orders.total_revenue, orders.count]
` ``

<Grid cols="2">
<BigValue data={kpis} value="orders.total_revenue" title="Revenue" fmt="eur2" />
<BigValue data={kpis} value="orders.count" title="Orders" fmt="num0" />
</Grid>

## Revenue Trend

` ``query trend
measures: [orders.total_revenue]
timeDimension:
  dimension: orders.created_at
  granularity: month
` ``

<LineChart data={trend} x="orders.created_at" y="orders.total_revenue" title="Monthly Revenue" yFmt="eur" />

## By City

` ``query by_city
measures: [orders.total_revenue]
dimensions: [orders.city]
orderBy:
  orders.total_revenue: desc
limit: 10
` ``

<BarChart data={by_city} x="orders.city" y="orders.total_revenue" title="Top Cities" yFmt="eur" />
```

The `<DateRange>` automatically applies to all queries with a `timeDimension` (here: `trend`). The `<Dropdown>` filters `trend` and `by_city` by channel. The `channels` query populates the dropdown and is never filtered by it.

## Compact Multi-Section Dashboard

A dashboard with multiple sections, side-by-side charts, and compact layout. Uses `##` headings (not `#`), `<Grid>` for horizontal grouping, and keeps all queries near the components that use them.

```markdown
---
title: Operations Overview
description: KPIs, trends, and breakdowns across channels and cities
---

<DateRange name="period" default="last-30-days" label="Period" />

` ``query channels
dimensions: [orders.channel]
` ``

<Dropdown name="channel" dimension="orders.channel" data={channels} queries="kpis,trend,by_city" label="Channel" />

## Key Metrics

` ``query kpis
measures: [orders.total_revenue, orders.count, orders.avg_order_value]
` ``

<BigValue data={kpis} value="orders.total_revenue" title="Revenue" fmt="eur" />
<BigValue data={kpis} value="orders.count" title="Orders" fmt="num0" />
<BigValue data={kpis} value="orders.avg_order_value" title="Avg Order" fmt="eur2" />

## Trends & Breakdown

` ``query trend
measures: [orders.total_revenue]
timeDimension:
  dimension: orders.created_at
  granularity: week
` ``

` ``query by_channel
measures: [orders.total_revenue]
dimensions: [orders.channel]
orderBy:
  orders.total_revenue: desc
` ``

<Grid cols="2">
<LineChart data={trend} x="orders.created_at" y="orders.total_revenue" title="Weekly Revenue" yFmt="eur" />
<BarChart data={by_channel} x="orders.channel" y="orders.total_revenue" title="By Channel" yFmt="eur" />
</Grid>

## Top Cities

` ``query by_city
measures: [orders.total_revenue, orders.count]
dimensions: [orders.city]
orderBy:
  orders.total_revenue: desc
limit: 10
` ``

<Grid cols="2">
<BarChart data={by_city} x="orders.city" y="orders.total_revenue" title="Revenue by City" horizontal yFmt="eur" />
<DataTable data={by_city} fmt="orders.total_revenue:eur,orders.count:num0" />
</Grid>
```

Key patterns:
- **`##` headings** for sections — compact, no oversized H1s
- **Consecutive `<BigValue>`** auto-groups into a row (no Grid needed)
- **`<Grid cols="2">`** pairs a chart with a table or two charts side by side
- **Queries defined before their Grid** — keeps the layout clean and components grouped

## KPI Comparison Dashboard

Use BigValue `comparison` to show deltas between related measures — like actual vs target, or current vs previous period. The `downIsGood` prop inverts colors for metrics where lower is better.

```markdown
---
title: Sales Pipeline
description: Contract pipeline with comparison indicators
---

` ``query pipeline
measures:
  - pipeline.total_contract_value
  - pipeline.total_invoice_value
  - pipeline.total_payment_value
  - pipeline.contract_count
  - pipeline.opportunity_count
  - pipeline.avg_contract_value
` ``

<BigValue data={pipeline} value="pipeline.total_contract_value" comparison="pipeline.total_invoice_value" fmt="eur" title="Contract Value" comparisonTitle="vs invoiced" />
<BigValue data={pipeline} value="pipeline.total_payment_value" comparison="pipeline.total_invoice_value" fmt="eur" title="Payments" comparisonTitle="vs invoiced" />
<BigValue data={pipeline} value="pipeline.contract_count" comparison="pipeline.opportunity_count" fmt="num0" title="Contracts" comparisonTitle="vs opportunities" />
<BigValue data={pipeline} value="pipeline.avg_contract_value" fmt="eur2" title="Avg Contract" />

## Outstanding Debt (downIsGood)

` ``query debt
measures: [pipeline.total_outstanding, pipeline.total_contract_value]
` ``

<BigValue data={debt} value="pipeline.total_outstanding" comparison="pipeline.total_contract_value" fmt="eur" title="Outstanding" comparisonTitle="vs contracted" downIsGood="true" />
```

The `downIsGood="true"` prop makes a ▼ arrow show green instead of red — useful for metrics like costs, churn, or outstanding debt where a decrease is positive.

## Combo Chart Dashboard

Use `y2` for dual-axis combo charts that overlay metrics with different scales. Common pattern: bars for volume/revenue on the left axis, line for rate/count on the right.

```markdown
---
title: Revenue & Volume
description: Combo charts with secondary y-axis
---

## Monthly Performance

` ``query monthly
measures: [orders.total_revenue, orders.count, orders.avg_order_value]
timeDimension:
  dimension: orders.created_at
  granularity: month
  dateRange: [2025-01-01, 2025-12-31]
` ``

### Revenue bars + order count line

<BarChart data={monthly} x="orders.created_at" y="orders.total_revenue" y2="orders.count" yFmt="eur" y2Fmt="num0" y2SeriesType="line" title="Revenue & Order Count" />

### Dual-axis line chart

<LineChart data={monthly} x="orders.created_at" y="orders.total_revenue" y2="orders.avg_order_value" yFmt="eur" y2Fmt="eur2" title="Revenue & Avg Order Value" />

## By Product

` ``query by_product
measures: [orders.total_revenue, orders.count]
dimensions: [orders.product]
orderBy:
  orders.total_revenue: desc
` ``

<BarChart data={by_product} x="orders.product" y="orders.total_revenue" y2="orders.count" yFmt="eur" y2Fmt="num0" y2SeriesType="line" title="Revenue & Count by Product" />
```

Key patterns:
- **`y2SeriesType="line"`** on BarChart creates the classic bar + line combo
- **Different formats** (`yFmt="eur"` + `y2Fmt="num0"`) make each axis legible
- Works on time series and categorical x-axes alike

## Tips

- **Start with KPIs**: Use `BigValue` at the top for key metrics — consecutive BigValues auto-group into a row
- **One query per chart**: Each component gets its own query — keep them focused
- **Use `##` headings**: Reserve `#` for the dashboard title (in frontmatter). Use `##` for sections
- **Use views**: Prefer view names over cube names when available
- **Name queries descriptively**: `monthly_revenue` is better than `q1`
- **Limit large datasets**: Add `limit` to dimension queries to avoid oversized charts
- **Time series**: Always use `timeDimension` with `granularity` for time-based charts
- **Multi-series**: Use `series="cube.column"` to split data by a dimension. For bars, default is stacked; use `type="grouped"` for side-by-side
- **Multiple y columns**: Use comma-separated values like `y="orders.revenue,orders.cases"` to show multiple measures on one chart
- **Dual y-axis**: Use `y2` to overlay metrics with different scales (e.g. revenue + count) on a secondary right axis
- **Combo charts**: Add `y2SeriesType="line"` on BarChart for the classic bar + line combo
- **KPI comparisons**: Use BigValue `comparison` to show ▲/▼ delta between two measures. Add `downIsGood="true"` for metrics where lower is better
- **Side-by-side charts**: Wrap pairs in `<Grid cols="2">` to reduce vertical scrolling

## See Also

- [Dashboards](dashboards) — overview and deployment
- [Queries](dashboards.queries) — query syntax and properties
- [Components](dashboards.components) — chart and display components
