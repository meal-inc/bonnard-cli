# Components

> Chart and display components for rendering query results in dashboards.

## Overview

Components are self-closing HTML-style tags that render query results as charts, tables, or KPI cards. Each component takes a `data` prop referencing a named query.

Choose the component that best fits your data:

- **BigValue** — single KPI number (total revenue, order count)
- **LineChart** — trends over time
- **BarChart** — comparing categories (vertical or horizontal)
- **AreaChart** — cumulative or stacked trends
- **PieChart** — proportional breakdown (best with 5-7 slices)
- **DataTable** — detailed rows for drilling into data

## Syntax

```markdown
<ComponentName data={query_name} prop="value" />
```

- Components are self-closing (`/>`)
- `data` uses curly braces: `data={query_name}`
- Other props use quotes: `x="orders.city"`
- Boolean props can be shorthand: `horizontal`

## Component Reference

### BigValue

Displays a single KPI metric as a large number. Optionally shows a comparison delta (▲/▼) against another measure from the same query.

```markdown
<BigValue data={total_revenue} value="orders.total_revenue" title="Revenue" />
<BigValue data={kpis} value="orders.total_revenue" comparison="orders.total_cost" fmt="eur" comparisonTitle="vs cost" />
<BigValue data={kpis} value="orders.churn_rate" comparison="orders.churn_prev" fmt="pct1" downIsGood="true" comparisonTitle="vs last month" />
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | query ref | Yes | Query name (should return a single row) |
| `value` | string | Yes | Fully qualified measure field name to display |
| `title` | string | No | Label above the value |
| `fmt` | string | No | Format preset or Excel code (e.g. `fmt="eur2"`, `fmt="$#,##0.00"`) |
| `comparison` | string | No | Measure field to compare against (from the same query row). Shows ▲/▼ delta indicator. |
| `comparisonFmt` | string | No | Format for the delta value. Defaults to `fmt` if not set. |
| `comparisonTitle` | string | No | Label after the delta (e.g. `"vs Plan"`, `"vs last month"`) |
| `downIsGood` | string | No | Set to `"true"` to invert colors — a decrease shows green (good for costs, churn, etc.) |

**Comparison behavior:**

- The delta is calculated as `value - comparison`. A positive delta means value > comparison.
- Arrow: ▲ when value exceeds comparison, ▼ when below, – when equal.
- Colors: green (▲) and red (▼) by default. When `downIsGood="true"`, colors invert — a decrease shows green.
- Both `value` and `comparison` must be measures in the same query. The component reads from `data[0]` (first row).

### LineChart

Renders a line chart, typically for time series. Supports multiple y columns, series splitting, and a secondary y-axis for combo charts.

```markdown
<LineChart data={monthly_revenue} x="orders.created_at" y="orders.total_revenue" title="Revenue Trend" />
<LineChart data={trend} x="orders.created_at" y="orders.total_revenue,orders.count" />
<LineChart data={revenue_by_type} x="orders.created_at" y="orders.total_revenue" series="orders.type" />
<LineChart data={combo} x="orders.created_at" y="orders.total_revenue" y2="orders.count" yFmt="eur" y2Fmt="num0" />
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | query ref | Yes | Query name |
| `x` | string | Yes | Field for x-axis (typically a time dimension) |
| `y` | string | Yes | Field(s) for y-axis. Comma-separated for multiple (e.g. `y="orders.total_revenue,orders.count"`) |
| `title` | string | No | Chart title |
| `series` | string | No | Column to split data into separate colored lines |
| `type` | string | No | `"stacked"` for stacked lines (default: no stacking) |
| `yFmt` | string | No | Format preset or Excel code for tooltip values (e.g. `yFmt="eur2"`) |
| `y2` | string | No | Field(s) for secondary y-axis (right side). Comma-separated for multiple. |
| `y2Fmt` | string | No | Format for secondary axis values (e.g. `y2Fmt="num0"`) |
| `y2SeriesType` | string | No | Override chart type for y2 series: `"bar"` or `"area"` (default: `"line"`) |

### BarChart

Renders a vertical bar chart. Add `horizontal` for horizontal bars. Supports multi-series with stacked or grouped display, and a secondary y-axis for combo charts (bars + line).

```markdown
<BarChart data={revenue_by_city} x="orders.city" y="orders.total_revenue" />
<BarChart data={revenue_by_city} x="orders.city" y="orders.total_revenue" horizontal />
<BarChart data={revenue_by_type} x="orders.created_at" y="orders.total_revenue" series="orders.type" />
<BarChart data={revenue_by_type} x="orders.created_at" y="orders.total_revenue" series="orders.type" type="grouped" />
<BarChart data={combo} x="orders.created_at" y="orders.total_revenue" y2="orders.count" yFmt="eur" y2Fmt="num0" y2SeriesType="line" title="Revenue & Orders" />
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | query ref | Yes | Query name |
| `x` | string | Yes | Field for category axis |
| `y` | string | Yes | Field(s) for value axis. Comma-separated for multiple (e.g. `y="orders.total_revenue,orders.count"`) |
| `title` | string | No | Chart title |
| `horizontal` | boolean | No | Render as horizontal bar chart |
| `series` | string | No | Column to split data into separate colored bars |
| `type` | string | No | `"stacked"` (default) or `"grouped"` for multi-series display |
| `yFmt` | string | No | Format preset or Excel code for tooltip values (e.g. `yFmt="usd"`) |
| `y2` | string | No | Field(s) for secondary y-axis (right side). Comma-separated for multiple. Not supported with `horizontal`. |
| `y2Fmt` | string | No | Format for secondary axis values (e.g. `y2Fmt="num0"`) |
| `y2SeriesType` | string | No | Override chart type for y2 series: `"line"` or `"area"` (default: `"bar"`) |

### AreaChart

Renders a filled area chart. Supports series splitting, stacked areas, and a secondary y-axis.

```markdown
<AreaChart data={monthly_revenue} x="orders.created_at" y="orders.total_revenue" />
<AreaChart data={revenue_by_source} x="orders.created_at" y="orders.total_revenue" series="orders.source" type="stacked" />
<AreaChart data={combo} x="orders.created_at" y="orders.total_revenue" y2="orders.count" yFmt="eur" y2Fmt="num0" />
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | query ref | Yes | Query name |
| `x` | string | Yes | Field for x-axis |
| `y` | string | Yes | Field(s) for y-axis. Comma-separated for multiple (e.g. `y="orders.total_revenue,orders.count"`) |
| `title` | string | No | Chart title |
| `series` | string | No | Column to split data into separate colored areas |
| `type` | string | No | `"stacked"` for stacked areas (default: no stacking) |
| `yFmt` | string | No | Format preset or Excel code for tooltip values (e.g. `yFmt="pct1"`) |
| `y2` | string | No | Field(s) for secondary y-axis (right side). Comma-separated for multiple. |
| `y2Fmt` | string | No | Format for secondary axis values (e.g. `y2Fmt="num0"`) |
| `y2SeriesType` | string | No | Override chart type for y2 series: `"line"` or `"bar"` (default: `"area"`) |

### PieChart

Renders a pie/donut chart.

```markdown
<PieChart data={by_status} name="orders.status" value="orders.count" title="Order Status" />
<PieChart data={by_status} name="orders.status" value="orders.total_revenue" title="Revenue Split" fmt="eur" />
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | query ref | Yes | Query name |
| `name` | string | Yes | Field for slice labels |
| `value` | string | Yes | Field for slice values |
| `title` | string | No | Chart title |
| `fmt` | string | No | Format preset or Excel code for tooltip values (e.g. `fmt="eur"`, `fmt="pct1"`) |

### DataTable

Renders query results as a sortable, paginated table. Click any column header to sort ascending/descending.

```markdown
<DataTable data={top_products} />
<DataTable data={top_products} columns="orders.category,orders.total_revenue,orders.count" />
<DataTable data={top_products} rows="25" />
<DataTable data={top_products} rows="all" />
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | query ref | Yes | Query name |
| `columns` | string | No | Comma-separated list of columns to show (default: all) |
| `title` | string | No | Table title |
| `fmt` | string | No | Column format map: `fmt="orders.total_revenue:eur2,orders.created_at:shortdate"` |
| `rows` | string | No | Rows per page. Default `10`. Use `rows="all"` to disable pagination. |

**Sorting:** Click a column header to sort ascending. Click again to sort descending. Null values always sort to the end. Numbers sort numerically, strings sort case-insensitively.

**Formatting:** Numbers right-align with tabular figures. Dates auto-detect and won't wrap. Use `fmt` for explicit formatting per column.

## Secondary Y-Axis (Combo Charts)

LineChart, BarChart, and AreaChart support a secondary y-axis using the `y2` prop. This renders a dual-axis chart with the primary series on the left axis and secondary series on the right — useful for overlaying metrics with different scales (e.g. revenue in EUR + order count).

```markdown
<!-- Bars for revenue (left), line for count (right) -->
<BarChart data={monthly} x="orders.created_at" y="orders.total_revenue" y2="orders.count"
    yFmt="eur" y2Fmt="num0" y2SeriesType="line" title="Revenue & Orders" />

<!-- Two lines with different scales -->
<LineChart data={monthly} x="orders.created_at" y="orders.total_revenue" y2="orders.margin_pct"
    yFmt="eur" y2Fmt="pct1" title="Revenue & Margin" />
```

**Key behaviors:**

- The secondary axis renders on the right side with its own scale and formatting
- `y2SeriesType` overrides the chart type for y2 series — e.g. `y2SeriesType="line"` on a BarChart creates a bar + line combo
- Both `y` and `y2` support comma-separated fields for multiple series on the same axis
- Tooltips format each series with the correct axis format (`yFmt` or `y2Fmt`)
- The secondary axis hides its grid lines to avoid visual clutter
- `y2` is not supported with `horizontal` on BarChart (ignored when horizontal is set)

## Layout

### Auto BigValue Grouping

Consecutive `<BigValue>` components are automatically wrapped in a responsive grid — no `<Grid>` tag needed:

```markdown
<BigValue data={total_revenue} value="orders.total_revenue" title="Revenue" />
<BigValue data={order_count} value="orders.count" title="Orders" />
<BigValue data={avg_order} value="orders.avg_order_value" title="Avg Order" />
```

This renders as a 3-column row. The grid auto-sizes up to 4 columns based on the number of consecutive BigValues. For more control, use an explicit `<Grid>` tag.

### Grid

Wrap components in a `<Grid>` tag to arrange them in columns:

```markdown
<Grid cols="3">
<BigValue data={total_orders} value="orders.count" title="Orders" />
<BigValue data={total_revenue} value="orders.total_revenue" title="Revenue" />
<BigValue data={avg_order} value="orders.avg_order_value" title="Avg Order" />
</Grid>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `cols` | string | `"2"` | Number of columns in the grid |

### Layout Best Practices

**Use `##` for sections, not `#`.** The `#` heading renders very large and wastes vertical space. Use `##` for section titles and `###` for subsections. Reserve `#` for the dashboard title only (which is set in frontmatter, not in the body).

**Group related charts side by side.** Wrap pairs of charts in `<Grid cols="2">` to avoid long vertical scrolling:

```markdown
<Grid cols="2">
<BarChart data={by_channel} x="orders.channel" y="orders.total_revenue" title="By Channel" />
<BarChart data={by_city} x="orders.city" y="orders.total_revenue" title="By City" horizontal />
</Grid>
```

**Start each section with KPIs.** Place `<BigValue>` cards at the top of a section for at-a-glance metrics, then follow with charts for detail.

**Only Grid together components of similar height.** Don't mix a `<BigValue>` with a chart in the same `<Grid>` row — the grid stretches both cells to the tallest item, leaving the BigValue card with a large empty area. Instead, place KPIs in their own row (consecutive BigValues auto-group) and pair charts with other charts of similar size.

**Keep it compact.** A good dashboard fits key information in 2-3 screens of scrolling. Use Grids, concise titles, and avoid unnecessary headings between every chart.

## Formatting

Values are auto-formatted by default — numbers get locale grouping (1,234.56), dates display as "13 Jan 2025", and nulls show as "—". Override with named presets for common currencies and percentages, or use raw Excel format codes for full control.

### Format Presets

| Preset | Excel code | Example output |
|--------|-----------|---------------|
| `num0` | `#,##0` | 1,234 |
| `num1` | `#,##0.0` | 1,234.6 |
| `num2` | `#,##0.00` | 1,234.56 |
| `usd` | `$#,##0` | $1,234 |
| `usd2` | `$#,##0.00` | $1,234.56 |
| `eur` | `#,##0 "€"` | 1,234 € |
| `eur2` | `#,##0.00 "€"` | 1,234.56 € |
| `gbp` | `£#,##0` | £1,234 |
| `gbp2` | `£#,##0.00` | £1,234.56 |
| `chf` | `"CHF "#,##0` | CHF 1,234 |
| `chf2` | `"CHF "#,##0.00` | CHF 1,234.56 |
| `pct` | `0%` | 45% |
| `pct1` | `0.0%` | 45.1% |
| `pct2` | `0.00%` | 45.12% |
| `shortdate` | `d mmm yyyy` | 13 Jan 2025 |
| `longdate` | `d mmmm yyyy` | 13 January 2025 |
| `monthyear` | `mmm yyyy` | Jan 2025 |

Any string that isn't a preset name is treated as a raw Excel format code (ECMA-376). For example: `fmt="orders.total_revenue:$#,##0.00"`.

Note: Percentage presets (`pct`, `pct1`, `pct2`) multiply by 100 per Excel convention — 0.45 displays as "45%".

### Usage Examples

```markdown
<!-- BigValue with currency -->
<BigValue data={total_revenue} value="orders.total_revenue" title="Revenue" fmt="eur2" />

<!-- DataTable with per-column formatting -->
<DataTable data={sales} fmt="orders.total_revenue:usd2,orders.created_at:shortdate,orders.margin:pct1" />

<!-- Chart with formatted tooltips -->
<BarChart data={monthly} x="orders.created_at" y="orders.total_revenue" yFmt="usd" />
<LineChart data={trend} x="orders.created_at" y="orders.growth" yFmt="pct1" />
```

## Field Names

All field names in component props must be **fully qualified** with the view or cube name — the same format used in query blocks. For example, use `value="orders.total_revenue"` not `value="total_revenue"`.

## See Also

- [Queries](dashboards.queries) — query syntax and properties
- [Examples](dashboards.examples) — complete dashboard examples
- [Dashboards](dashboards) — overview and deployment
