# SDK

> Build custom data apps on top of your semantic layer.

The Bonnard SDK (`@bonnard/sdk`) is a lightweight TypeScript client for querying your deployed semantic layer programmatically. Build dashboards, embedded analytics, internal tools, or data pipelines — all backed by your governed metrics.

## Quick start

```bash
npm install @bonnard/sdk
```

```typescript
import { createClient } from '@bonnard/sdk';

const bonnard = createClient({
  apiKey: 'your-api-key',
});

const result = await bonnard.query({
  cube: 'orders',
  measures: ['revenue', 'count'],
  dimensions: ['status'],
  timeDimension: {
    dimension: 'created_at',
    granularity: 'month',
    dateRange: ['2025-01-01', '2025-12-31'],
  },
});
```

## Type-safe queries

Full TypeScript support with inference. Measures, dimensions, filters, time dimensions, and sort orders are all typed. Query results include field annotations with titles and types.

```typescript
const result = await bonnard.sql<OrderRow>(
  `SELECT status, MEASURE(revenue) FROM orders GROUP BY 1`
);
// result.data is OrderRow[]
```

## What you can build

- **Custom dashboards** — Query your semantic layer from Next.js, React, or any frontend
- **Embedded analytics** — Add governed metrics to your product
- **Data pipelines** — Consume semantic layer data in ETL workflows
- **Internal tools** — Build admin panels backed by consistent metrics

## See Also

- [Overview](/docs/overview) — Platform overview
- [querying.rest-api](querying.rest-api) — Query format reference
