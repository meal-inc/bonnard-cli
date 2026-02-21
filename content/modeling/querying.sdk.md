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
  measures: ['orders.revenue', 'orders.count'],
  dimensions: ['orders.status'],
  timeDimension: {
    dimension: 'orders.created_at',
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

## Multi-tenant queries

When building B2B apps where each customer should only see their own data, use **security context** with token exchange. Your server exchanges a secret key for a scoped token, then your frontend queries with that token — row-level filters are enforced automatically.

```typescript
// Server-side: exchange secret key for a scoped token
const res = await fetch('https://app.bonnard.dev/api/sdk/token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.BONNARD_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    security_context: { tenant_id: currentCustomer.id },
  }),
});
const { token } = await res.json();
// Pass token to the frontend
```

```typescript
// Client-side: query with the scoped token
const bonnard = createClient({
  fetchToken: async () => token, // from your server
});

const result = await bonnard.query({
  measures: ['orders.revenue'],
  dimensions: ['orders.status'],
});
// Only returns rows where tenant_id matches — enforced server-side
```

This requires an `access_policy` on your view with a `{securityContext.attrs.tenant_id}` filter. See [security-context](security-context) for the full setup guide.

## What you can build

- **Custom dashboards** — Query your semantic layer from Next.js, React, or any frontend
- **Embedded analytics** — Add governed metrics to your product
- **Data pipelines** — Consume semantic layer data in ETL workflows
- **Internal tools** — Build admin panels backed by consistent metrics

## See Also

- [Overview](/docs/overview) — Platform overview
- [querying.rest-api](querying.rest-api) — Query format reference
