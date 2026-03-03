# React Components

> Pre-built React chart components for your semantic layer. Drop-in KPIs, charts, and tables — no chart library wiring needed.

The `@bonnard/react` package provides a `BonnardProvider`, six chart components, and a `useBonnardQuery` hook. Components handle theming, formatting, and dark mode automatically. Built on ECharts under the hood.

## Quick start

```bash
npm install @bonnard/react @bonnard/sdk
```

Wrap your app (or dashboard page) in `BonnardProvider`:

```tsx
import { BonnardProvider, BarChart, BigValue } from '@bonnard/react';
import { useBonnardQuery } from '@bonnard/react';

function App() {
  return (
    <BonnardProvider config={{ apiKey: 'bon_pk_YOUR_KEY_HERE' }}>
      <Dashboard />
    </BonnardProvider>
  );
}

function Dashboard() {
  const { data, loading, error } = useBonnardQuery({
    query: {
      measures: ['orders.revenue'],
      dimensions: ['orders.city'],
      orderBy: { 'orders.revenue': 'desc' },
      limit: 10,
    },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!data) return null;

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <BigValue data={data} value="orders.revenue" fmt="usd" title="Total Revenue" />
      <BarChart data={data} x="orders.city" y="orders.revenue" yFmt="usd" />
    </div>
  );
}
```

## Components

All components accept a `data` prop — an array of row objects (from `useBonnardQuery` or `client.query()`). An optional `title` prop renders a heading above the chart.

### BigValue

Single KPI card with optional comparison delta.

| Prop | Type | Description |
|------|------|-------------|
| `data` | `Record<string, unknown>[]` | Query result rows (uses first row) |
| `value` | `string` | Column name for the main value |
| `title` | `string?` | Label above the number (defaults to column name) |
| `fmt` | `string?` | Format preset or Excel code (e.g. `"usd2"`, `"0.0%"`) |
| `comparison` | `string?` | Column name for comparison value (from same row) |
| `comparisonFmt` | `string?` | Format for comparison delta (defaults to `fmt`) |
| `comparisonTitle` | `string?` | Label after delta, e.g. `"vs last month"` |
| `downIsGood` | `boolean?` | Invert colors (for costs/churn — decrease is green) |

```tsx
<BigValue
  data={data}
  value="orders.revenue"
  fmt="usd"
  comparison="orders.prev_revenue"
  comparisonTitle="vs last month"
/>
```

### BarChart

Vertical or horizontal bar chart. Supports stacked/grouped multi-series and dual y-axis.

| Prop | Type | Description |
|------|------|-------------|
| `data` | `Record<string, unknown>[]` | Query result rows |
| `x` | `string` | Column for category axis |
| `y` | `string` | Column(s) for values (comma-separated for multi-measure) |
| `horizontal` | `boolean?` | Render horizontal bars |
| `series` | `string?` | Column to split into separate series |
| `type` | `"stacked" \| "grouped"?` | Multi-series display mode |
| `yFmt` | `string?` | Format preset for y-axis and tooltips |
| `y2` | `string?` | Column(s) for secondary y-axis |
| `y2Fmt` | `string?` | Format for secondary y-axis |
| `y2SeriesType` | `"line" \| "bar" \| "area"?` | Chart type for y2 series |

```tsx
<BarChart data={data} x="orders.city" y="orders.revenue" yFmt="usd" />

{/* Horizontal */}
<BarChart data={data} x="orders.city" y="orders.revenue" horizontal />

{/* Stacked by category */}
<BarChart data={data} x="orders.month" y="orders.revenue" series="orders.category" type="stacked" />
```

### LineChart

Time series and categorical line chart. Same props as BarChart minus `horizontal`.

| Prop | Type | Description |
|------|------|-------------|
| `data` | `Record<string, unknown>[]` | Query result rows |
| `x` | `string` | Column for x-axis (auto-detects time series) |
| `y` | `string` | Column(s) for values |
| `series` | `string?` | Column to split into separate lines |
| `type` | `"stacked" \| "grouped"?` | Multi-series display mode |
| `yFmt` | `string?` | Format preset for y-axis and tooltips |
| `y2` | `string?` | Column(s) for secondary y-axis |
| `y2Fmt` | `string?` | Format for secondary y-axis |
| `y2SeriesType` | `"line" \| "bar" \| "area"?` | Chart type for y2 series |

```tsx
<LineChart data={data} x="orders.created_at" y="orders.revenue" yFmt="usd" />

{/* Dual axis: revenue (bars) + margin % (line) */}
<LineChart
  data={data}
  x="orders.created_at"
  y="orders.revenue"
  yFmt="usd"
  y2="orders.margin_pct"
  y2Fmt="pct1"
  y2SeriesType="bar"
/>
```

### AreaChart

Filled line chart. Same props as LineChart.

```tsx
<AreaChart data={data} x="orders.created_at" y="orders.revenue" yFmt="usd" />

{/* Stacked area */}
<AreaChart data={data} x="orders.created_at" y="orders.revenue" series="orders.channel" type="stacked" />
```

### PieChart

Donut chart with legend and formatted tooltips.

| Prop | Type | Description |
|------|------|-------------|
| `data` | `Record<string, unknown>[]` | Query result rows |
| `name` | `string` | Column for slice labels |
| `value` | `string` | Column for slice values |
| `fmt` | `string?` | Format preset for tooltip values |

```tsx
<PieChart data={data} name="orders.category" value="orders.revenue" fmt="usd" />
```

### DataTable

Sortable, paginated table with auto-formatted columns.

| Prop | Type | Description |
|------|------|-------------|
| `data` | `Record<string, unknown>[]` | Query result rows |
| `columns` | `string[]?` | Column subset and order (defaults to all) |
| `fmt` | `string?` | Column format map: `"revenue:usd2,date:shortdate"` |
| `columnConfigs` | `ColumnConfig[]?` | Per-column config from `<Column>` children. Takes precedence over `columns`/`fmt`. |
| `rows` | `number \| "all"?` | Rows per page (default `10`, `"all"` to disable pagination) |

```tsx
<DataTable
  data={data}
  columns={['orders.city', 'orders.revenue', 'orders.count']}
  fmt="orders.revenue:usd2,orders.count:num"
  rows={20}
/>

{/* Or use columnConfigs for per-column formatting (avoids comma ambiguity in Excel codes) */}
<DataTable
  data={data}
  columnConfigs={[
    { field: 'orders.city', header: 'City' },
    { field: 'orders.revenue', header: 'Revenue', fmt: '$#,##0.00' },
    { field: 'orders.count', header: 'Orders', fmt: 'num0' },
  ]}
/>
```

## useBonnardQuery

Fetch data from your semantic layer inside any component. Must be used within a `BonnardProvider`.

```tsx
import { useBonnardQuery } from '@bonnard/react';

function MyComponent() {
  const { data, loading, error, refetch } = useBonnardQuery({
    query: {
      measures: ['orders.revenue', 'orders.count'],
      dimensions: ['orders.city'],
      orderBy: { 'orders.revenue': 'desc' },
      limit: 10,
    },
    skip: false, // set true to defer execution
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!data) return null;

  // Build your own UI with the raw data
  return (
    <ul>
      {data.map((row, i) => (
        <li key={i}>{row['orders.city']}: ${row['orders.revenue']}</li>
      ))}
    </ul>
  );
}
```

| Option | Type | Description |
|--------|------|-------------|
| `query` | `QueryOptions` | Query object (measures, dimensions, filters, etc.) |
| `skip` | `boolean?` | Skip execution (useful for conditional queries) |

Returns:

| Field | Type | Description |
|-------|------|-------------|
| `data` | `T[] \| undefined` | Query result rows (`undefined` while loading) |
| `loading` | `boolean` | `true` during fetch |
| `error` | `string \| undefined` | Error message if query failed |
| `refetch` | `() => void` | Re-execute the query |

## Format codes

Use format presets in `fmt`, `yFmt`, and `y2Fmt` props. You can also pass raw Excel format codes.

| Preset | Output example | Code |
|--------|---------------|------|
| `num` | 1,234 | `#,##0` |
| `num2` | 1,234.56 | `#,##0.00` |
| `usd` | $1,234 | `$#,##0` |
| `usd2` | $1,234.56 | `$#,##0.00` |
| `eur` | 1,234 € | `#,##0 "€"` |
| `eur2` | 1,234.56 € | `#,##0.00 "€"` |
| `gbp` | £1,234 | `£#,##0` |
| `gbp2` | £1,234.56 | `£#,##0.00` |
| `pct` | 12% | `0%` |
| `pct1` | 12.3% | `0.0%` |
| `pct2` | 12.34% | `0.00%` |
| `shortdate` | 5 Jan 2025 | `d mmm yyyy` |

## Theming

### Dark mode

`BonnardProvider` supports automatic, forced, or system-detected dark mode:

```tsx
<BonnardProvider config={config} darkMode="auto">   {/* system preference (default) */}
<BonnardProvider config={config} darkMode={true}>    {/* always dark */}
<BonnardProvider config={config} darkMode={false}>   {/* always light */}
```

### Color palettes

Override the chart color palette via the `theme` prop. Four built-in palettes: `default`, `tableau` (default), `observable`, `metabase`.

```tsx
<BonnardProvider config={config} theme={{ palette: 'observable' }}>
```

Or provide custom colors:

```tsx
<BonnardProvider
  config={config}
  theme={{ palette: ['#2563eb', '#dc2626', '#16a34a', '#ca8a04'] }}
>
```

### Theme overrides

Customize colors, border radius, chart height, and font via the `theme` prop:

```tsx
<BonnardProvider
  config={config}
  theme={{
    chartHeight: 400,
    fontFamily: '"Inter", sans-serif',
    colors: {
      bg: '#0a0a0a',
      bgCard: '#141414',
      border: '#262626',
    },
  }}
>
```

Theme layers are merged in order: base preset → `orgTheme` → `dashboardTheme` → `theme`.

## See also

- [sdk](sdk) — SDK overview and installation
- [sdk.query-reference](sdk.query-reference) — Full query API reference
- [sdk.authentication](sdk.authentication) — Auth patterns (publishable keys, token exchange)
- [access-control.security-context](access-control.security-context) — Row-level security for multi-tenant apps
