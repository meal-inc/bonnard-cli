# Query API Reference

> Complete reference for querying the Bonnard semantic layer via the SDK.

## query()

Execute a JSON query against the semantic layer. All field names must be fully qualified (e.g. `orders.revenue`, not `revenue`).

```javascript
const { data } = await bon.query({
  measures: ['orders.revenue', 'orders.count'],
  dimensions: ['orders.city'],
  filters: [
    { dimension: 'orders.status', operator: 'equals', values: ['completed'] },
  ],
  timeDimension: {
    dimension: 'orders.created_at',
    granularity: 'month',
    dateRange: ['2025-01-01', '2025-12-31'],
  },
  orderBy: { 'orders.revenue': 'desc' },
  limit: 10,
});
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `measures` | `string[]` | No | Numeric aggregations to compute (e.g. `['orders.revenue']`) |
| `dimensions` | `string[]` | No | Group-by columns (e.g. `['orders.city']`) |
| `filters` | `Filter[]` | No | Row-level filters |
| `timeDimension` | `TimeDimension` | No | Time-based grouping and date range |
| `orderBy` | `Record<string, 'asc' \| 'desc'>` | No | Sort order |
| `limit` | `number` | No | Max rows to return |

At least one of `measures` or `dimensions` is required.

### Response

```javascript
{
  data: [
    { "orders.revenue": 125000, "orders.count": 340, "orders.city": "Berlin" },
    { "orders.revenue": 98000, "orders.count": 280, "orders.city": "Munich" },
  ],
  annotation: {
    measures: {
      "orders.revenue": { title: "Revenue", type: "number" },
      "orders.count": { title: "Count", type: "number" },
    },
    dimensions: {
      "orders.city": { title: "City", type: "string" },
    },
  }
}
```

- `data` — array of result rows, keyed by fully qualified field names
- `annotation` — optional metadata with field titles and types

## Filters

```javascript
filters: [
  { dimension: 'orders.status', operator: 'equals', values: ['completed'] },
  { dimension: 'orders.revenue', operator: 'gt', values: [1000] },
]
```

### Filter operators

| Operator | Description | Example values |
|----------|-------------|---------------|
| `equals` | Exact match (any of values) | `['completed', 'shipped']` |
| `notEquals` | Exclude matches | `['cancelled']` |
| `contains` | Substring match | `['berlin']` |
| `gt` | Greater than | `[1000]` |
| `gte` | Greater than or equal | `[1000]` |
| `lt` | Less than | `[100]` |
| `lte` | Less than or equal | `[100]` |

## Time dimensions

Group data by time periods and filter by date range.

```javascript
timeDimension: {
  dimension: 'orders.created_at',
  granularity: 'month',
  dateRange: ['2025-01-01', '2025-06-30'],
}
```

### Granularities

| Granularity | Groups by |
|-------------|-----------|
| `day` | Calendar day |
| `week` | ISO week (Monday start) |
| `month` | Calendar month |
| `quarter` | Calendar quarter |
| `year` | Calendar year |

Omit `granularity` to filter by date range without time grouping.

### Date range formats

```javascript
// ISO date strings (tuple)
dateRange: ['2025-01-01', '2025-12-31']

// Single string (relative)
dateRange: 'last 30 days'
dateRange: 'last 6 months'
dateRange: 'this year'
dateRange: 'last year'
dateRange: 'today'
dateRange: 'yesterday'
dateRange: 'last week'
dateRange: 'last month'
dateRange: 'last quarter'
```

## Ordering and pagination

```javascript
// Sort by revenue descending
orderBy: { 'orders.revenue': 'desc' }

// Multiple sort keys
orderBy: { 'orders.city': 'asc', 'orders.revenue': 'desc' }

// Limit results
limit: 10
```

## rawQuery()

Pass a Cube-native query object directly, bypassing the SDK's query format conversion. Use when you need features not exposed by `query()` (e.g. segments, offset).

```javascript
const { data } = await bon.rawQuery({
  measures: ['orders.revenue'],
  dimensions: ['orders.city'],
  order: [['orders.revenue', 'desc']],
  limit: 10,
  offset: 20,
});
```

## sql()

Execute a SQL query using Cube's SQL API. Use `MEASURE()` to reference semantic layer measures.

```javascript
const { data } = await bon.sql(
  `SELECT city, MEASURE(revenue), MEASURE(count)
   FROM orders
   WHERE status = 'completed'
   GROUP BY 1
   ORDER BY 2 DESC
   LIMIT 10`
);
```

Response includes an optional schema:

```javascript
{
  data: [
    { city: "Berlin", revenue: 125000, count: 340 },
  ],
  schema: [
    { name: "city", type: "string" },
    { name: "revenue", type: "number" },
    { name: "count", type: "number" },
  ]
}
```

## explore()

Discover available views, measures, dimensions, and segments.

```javascript
const meta = await bon.explore();

for (const view of meta.cubes) {
  console.log(`${view.name}: ${view.description || ''}`);
  for (const m of view.measures) {
    console.log(`  measure: ${m.name} (${m.type})`);
  }
  for (const d of view.dimensions) {
    console.log(`  dimension: ${d.name} (${d.type})`);
  }
}
```

By default returns only views (`viewsOnly: true`). To include underlying cubes:

```javascript
const meta = await bon.explore({ viewsOnly: false });
```

### Response shape

```javascript
{
  cubes: [
    {
      name: "orders",
      title: "Orders",
      description: "Customer orders",
      type: "view",
      measures: [
        { name: "orders.revenue", title: "Revenue", type: "number" },
        { name: "orders.count", title: "Count", type: "number" },
      ],
      dimensions: [
        { name: "orders.city", title: "City", type: "string" },
        { name: "orders.created_at", title: "Created At", type: "time" },
      ],
      segments: [],
    }
  ]
}
```

## toCubeQuery()

Utility function that converts SDK `QueryOptions` into a Cube-native query object. Useful for debugging or when you need to inspect the query before sending.

```javascript
import { toCubeQuery } from '@bonnard/sdk';
// or in browser: Bonnard.toCubeQuery(...)

const cubeQuery = Bonnard.toCubeQuery({
  measures: ['orders.revenue'],
  dimensions: ['orders.city'],
  orderBy: { 'orders.revenue': 'desc' },
});

console.log(JSON.stringify(cubeQuery, null, 2));
// {
//   "measures": ["orders.revenue"],
//   "dimensions": ["orders.city"],
//   "order": [["orders.revenue", "desc"]]
// }
```

## Common patterns

### KPI query (single row, no dimensions)

```javascript
const { data } = await bon.query({
  measures: ['orders.revenue', 'orders.count', 'orders.avg_value'],
});
const kpis = data[0];
// { "orders.revenue": 1250000, "orders.count": 3400, "orders.avg_value": 367.6 }
```

### Top N with dimension

```javascript
const { data } = await bon.query({
  measures: ['orders.revenue'],
  dimensions: ['orders.city'],
  orderBy: { 'orders.revenue': 'desc' },
  limit: 10,
});
```

### Time series

```javascript
const { data } = await bon.query({
  measures: ['orders.revenue'],
  timeDimension: {
    dimension: 'orders.created_at',
    granularity: 'month',
    dateRange: 'last 12 months',
  },
});
// data[0]["orders.created_at"] is an ISO date string like "2025-01-01T00:00:00.000"
```

### Filtered breakdown

```javascript
const { data } = await bon.query({
  measures: ['orders.revenue'],
  dimensions: ['orders.product_category'],
  filters: [
    { dimension: 'orders.city', operator: 'equals', values: ['Berlin'] },
    { dimension: 'orders.revenue', operator: 'gt', values: [100] },
  ],
  orderBy: { 'orders.revenue': 'desc' },
});
```

## See also

- [sdk.browser](sdk.browser) — Browser / CDN quickstart
- [sdk.authentication](sdk.authentication) — Auth patterns
- [sdk.chartjs](sdk.chartjs) — Building dashboards with Chart.js
