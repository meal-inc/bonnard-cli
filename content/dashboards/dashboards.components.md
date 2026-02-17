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
- Other props use quotes: `x="field_name"`
- Boolean props can be shorthand: `horizontal`

## Component Reference

### BigValue

Displays a single KPI metric as a large number.

```markdown
<BigValue data={total_revenue} value="total_revenue" title="Revenue" />
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | query ref | Yes | Query name (should return a single row) |
| `value` | string | Yes | Measure field name to display |
| `title` | string | No | Label above the value |
| `fmt` | string | No | Format preset or Excel code (e.g. `fmt="eur2"`, `fmt="$#,##0.00"`) |

### LineChart

Renders a line chart, typically for time series. Supports multiple y columns and series splitting.

```markdown
<LineChart data={monthly_revenue} x="created_at" y="total_revenue" title="Revenue Trend" />
<LineChart data={trend} x="date" y="revenue,cases" />
<LineChart data={revenue_by_type} x="created_at" y="total_revenue" series="type" />
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | query ref | Yes | Query name |
| `x` | string | Yes | Field for x-axis (typically a time dimension) |
| `y` | string | Yes | Field(s) for y-axis. Comma-separated for multiple (e.g. `y="revenue,cases"`) |
| `title` | string | No | Chart title |
| `series` | string | No | Column to split data into separate colored lines |
| `type` | string | No | `"stacked"` for stacked lines (default: no stacking) |
| `yFmt` | string | No | Format preset or Excel code for tooltip values (e.g. `yFmt="eur2"`) |

### BarChart

Renders a vertical bar chart. Add `horizontal` for horizontal bars. Supports multi-series with stacked or grouped display.

```markdown
<BarChart data={revenue_by_city} x="city" y="total_revenue" />
<BarChart data={revenue_by_city} x="city" y="total_revenue" horizontal />
<BarChart data={revenue_by_type} x="month" y="total_revenue" series="type" />
<BarChart data={revenue_by_type} x="month" y="total_revenue" series="type" type="grouped" />
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | query ref | Yes | Query name |
| `x` | string | Yes | Field for category axis |
| `y` | string | Yes | Field(s) for value axis. Comma-separated for multiple (e.g. `y="revenue,cases"`) |
| `title` | string | No | Chart title |
| `horizontal` | boolean | No | Render as horizontal bar chart |
| `series` | string | No | Column to split data into separate colored bars |
| `type` | string | No | `"stacked"` (default) or `"grouped"` for multi-series display |
| `yFmt` | string | No | Format preset or Excel code for tooltip values (e.g. `yFmt="usd"`) |

### AreaChart

Renders a filled area chart. Supports series splitting and stacked areas.

```markdown
<AreaChart data={monthly_revenue} x="created_at" y="total_revenue" />
<AreaChart data={revenue_by_source} x="created_at" y="total_revenue" series="source" type="stacked" />
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | query ref | Yes | Query name |
| `x` | string | Yes | Field for x-axis |
| `y` | string | Yes | Field(s) for y-axis. Comma-separated for multiple (e.g. `y="revenue,cases"`) |
| `title` | string | No | Chart title |
| `series` | string | No | Column to split data into separate colored areas |
| `type` | string | No | `"stacked"` for stacked areas (default: no stacking) |
| `yFmt` | string | No | Format preset or Excel code for tooltip values (e.g. `yFmt="pct1"`) |

### PieChart

Renders a pie/donut chart.

```markdown
<PieChart data={by_status} name="status" value="count" title="Order Status" />
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | query ref | Yes | Query name |
| `name` | string | Yes | Field for slice labels |
| `value` | string | Yes | Field for slice values |
| `title` | string | No | Chart title |

### DataTable

Renders query results as a sortable, paginated table. Click any column header to sort ascending/descending.

```markdown
<DataTable data={top_products} />
<DataTable data={top_products} columns="name,revenue,count" />
<DataTable data={top_products} rows="25" />
<DataTable data={top_products} rows="all" />
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | query ref | Yes | Query name |
| `columns` | string | No | Comma-separated list of columns to show (default: all) |
| `title` | string | No | Table title |
| `fmt` | string | No | Column format map: `fmt="revenue:eur2,date:shortdate"` |
| `rows` | string | No | Rows per page. Default `10`. Use `rows="all"` to disable pagination. |

**Sorting:** Click a column header to sort ascending. Click again to sort descending. Null values always sort to the end. Numbers sort numerically, strings sort case-insensitively.

**Formatting:** Numbers right-align with tabular figures. Dates auto-detect and won't wrap. Use `fmt` for explicit formatting per column.

## Layout

### Auto BigValue Grouping

Consecutive `<BigValue>` components are automatically wrapped in a responsive grid — no `<Grid>` tag needed:

```markdown
<BigValue data={total_revenue} value="total_revenue" title="Revenue" />
<BigValue data={order_count} value="count" title="Orders" />
<BigValue data={avg_order} value="avg_order_value" title="Avg Order" />
```

This renders as a 3-column row. The grid auto-sizes up to 4 columns based on the number of consecutive BigValues. For more control, use an explicit `<Grid>` tag.

### Grid

Wrap components in a `<Grid>` tag to arrange them in columns:

```markdown
<Grid cols="3">
<BigValue data={total_orders} value="count" title="Orders" />
<BigValue data={total_revenue} value="total_revenue" title="Revenue" />
<BigValue data={avg_order} value="avg_order_value" title="Avg Order" />
</Grid>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `cols` | string | `"2"` | Number of columns in the grid |

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

Any string that isn't a preset name is treated as a raw Excel format code (ECMA-376). For example: `fmt="revenue:$#,##0.00"`.

Note: Percentage presets (`pct`, `pct1`, `pct2`) multiply by 100 per Excel convention — 0.45 displays as "45%".

### Usage Examples

```markdown
<!-- BigValue with currency -->
<BigValue data={total_revenue} value="total_revenue" title="Revenue" fmt="eur2" />

<!-- DataTable with per-column formatting -->
<DataTable data={sales} fmt="total_revenue:usd2,created_at:shortdate,margin:pct1" />

<!-- Chart with formatted tooltips -->
<BarChart data={monthly} x="month" y="revenue" yFmt="usd" />
<LineChart data={trend} x="date" y="growth" yFmt="pct1" />
```

## Field Names

Component field names (e.g. `x="city"`, `value="total_revenue"`) use the **unqualified** measure or dimension name — the same names defined in your cube. For example, if your cube has `measures: [{ name: total_revenue, ... }]`, use `value="total_revenue"`.

## See Also

- [Queries](dashboards.queries) — query syntax and properties
- [Examples](dashboards.examples) — complete dashboard examples
- [Dashboards](dashboards) — overview and deployment
