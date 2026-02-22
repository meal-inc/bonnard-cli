# SDK

> Build data apps and dashboards on top of your semantic layer.

The Bonnard SDK (`@bonnard/sdk`) is a lightweight TypeScript/JavaScript client for querying your deployed semantic layer. Zero dependencies, ~3KB minified — works in Node.js, browsers, and edge runtimes.

## Two ways to use it

### npm (TypeScript / Node.js / React)

```bash
npm install @bonnard/sdk
```

```typescript
import { createClient } from '@bonnard/sdk';

const bon = createClient({ apiKey: 'bon_pk_...' });
const { data } = await bon.query({
  measures: ['orders.revenue'],
  dimensions: ['orders.city'],
});
```

### CDN (browser / HTML dashboards)

```html
<script src="https://cdn.jsdelivr.net/npm/@bonnard/sdk/dist/bonnard.iife.js"></script>
<script>
  const bon = Bonnard.createClient({ apiKey: 'bon_pk_...' });
</script>
```

Exposes `window.Bonnard` with `createClient` and `toCubeQuery`. See [sdk.browser](sdk.browser) for the full browser quickstart.

## Authentication

Two modes depending on your use case:

| Mode | Key type | Use case |
|------|----------|----------|
| **Publishable key** | `bon_pk_...` | Public dashboards, client-side apps — safe to expose in HTML |
| **Token exchange** | `bon_sk_...` → JWT | Multi-tenant / embedded analytics — server exchanges secret key for scoped token |

```typescript
// Simple: publishable key
const bon = createClient({ apiKey: 'bon_pk_...' });

// Multi-tenant: token exchange
const bon = createClient({
  fetchToken: async () => {
    const res = await fetch('/my-backend/bonnard-token');
    const { token } = await res.json();
    return token;
  },
});
```

The SDK automatically caches tokens and refreshes them 60 seconds before expiry.

See [sdk.authentication](sdk.authentication) for the full auth guide.

## What you can query

| Method | Purpose |
|--------|---------|
| `query()` | JSON query — measures, dimensions, filters, time dimensions |
| `rawQuery()` | Pass a Cube-native query object directly |
| `sql()` | SQL with `MEASURE()` syntax |
| `explore()` | Discover available views, measures, and dimensions |

See [sdk.query-reference](sdk.query-reference) for the full API reference.

## Building HTML dashboards

The SDK pairs with any chart library for single-file HTML dashboards. No build step required — load both from CDN and start querying.

| Library | CDN size (gzip) | Best for |
|---------|----------------|----------|
| **Chart.js** | ~65 KB | Default choice — most LLM training data, smallest payload |
| **ECharts** | ~160 KB | Rich interactivity, built-in dark theme |
| **ApexCharts** | ~130 KB | Best defaults out of box, SVG rendering |

Each guide includes a complete, copy-pasteable HTML starter template:

- [sdk.chartjs](sdk.chartjs) — Chart.js + SDK
- [sdk.echarts](sdk.echarts) — ECharts + SDK
- [sdk.apexcharts](sdk.apexcharts) — ApexCharts + SDK

## See also

- [sdk.browser](sdk.browser) — Browser / CDN quickstart
- [sdk.query-reference](sdk.query-reference) — Full query API reference
- [sdk.authentication](sdk.authentication) — Auth patterns
- [security-context](security-context) — Row-level security for multi-tenant apps
