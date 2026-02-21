# Browser / CDN Quickstart

> Load the Bonnard SDK via a `<script>` tag and query your semantic layer from any HTML page.

## Setup

Add the SDK script tag to your HTML. It exposes `window.Bonnard`.

```html
<script src="https://cdn.jsdelivr.net/npm/@bonnard/sdk/dist/bonnard.iife.js"></script>
```

Alternative CDN:
```html
<script src="https://unpkg.com/@bonnard/sdk/dist/bonnard.iife.js"></script>
```

Pin a specific version:
```html
<script src="https://cdn.jsdelivr.net/npm/@bonnard/sdk@0.4.2/dist/bonnard.iife.js"></script>
```

## First query

```html
<script src="https://cdn.jsdelivr.net/npm/@bonnard/sdk/dist/bonnard.iife.js"></script>
<script>
  const bon = Bonnard.createClient({
    apiKey: 'bon_pk_YOUR_KEY_HERE',
  });

  (async () => {
    const { data } = await bon.query({
      measures: ['orders.revenue', 'orders.count'],
      dimensions: ['orders.city'],
      orderBy: { 'orders.revenue': 'desc' },
      limit: 10,
    });

    console.log(data);
    // [{ "orders.revenue": 125000, "orders.count": 340, "orders.city": "Berlin" }, ...]
  })();
</script>
```

Note: the IIFE bundle uses a regular `<script>` tag (not `type="module"`), so top-level `await` is not available. Wrap async code in an IIFE or use `.then()`.

## Async patterns

### IIFE wrapper (recommended)

```html
<script>
  (async () => {
    const bon = Bonnard.createClient({ apiKey: 'bon_pk_...' });
    const { data } = await bon.query({ measures: ['orders.revenue'] });
    document.getElementById('revenue').textContent = data[0]['orders.revenue'];
  })();
</script>
```

### Promise chain

```html
<script>
  const bon = Bonnard.createClient({ apiKey: 'bon_pk_...' });

  bon.query({ measures: ['orders.revenue'] })
    .then(({ data }) => {
      document.getElementById('revenue').textContent = data[0]['orders.revenue'];
    })
    .catch(err => {
      console.error('Query failed:', err.message);
    });
</script>
```

### Parallel queries

```html
<script>
  (async () => {
    const bon = Bonnard.createClient({ apiKey: 'bon_pk_...' });

    const [kpis, byCity] = await Promise.all([
      bon.query({ measures: ['orders.revenue', 'orders.count'] }),
      bon.query({
        measures: ['orders.revenue'],
        dimensions: ['orders.city'],
        orderBy: { 'orders.revenue': 'desc' },
      }),
    ]);

    // Render KPIs
    document.getElementById('revenue').textContent = kpis.data[0]['orders.revenue'];
    document.getElementById('count').textContent = kpis.data[0]['orders.count'];

    // Render chart with byCity.data...
  })();
</script>
```

## Error handling

```html
<script>
  (async () => {
    const bon = Bonnard.createClient({ apiKey: 'bon_pk_...' });

    try {
      const { data } = await bon.query({
        measures: ['orders.revenue'],
      });
      renderDashboard(data);
    } catch (err) {
      document.getElementById('error').textContent = err.message;
      document.getElementById('error').style.display = 'block';
    }
  })();
</script>
```

Common errors:
- `"Unauthorized"` — invalid or expired API key
- `"Query failed"` — invalid measure/dimension names or query structure
- Network errors — API unreachable (CORS, connectivity)

## Custom base URL

By default the SDK points to `https://app.bonnard.dev`. Override for self-hosted or preview deployments:

```html
<script>
  const bon = Bonnard.createClient({
    apiKey: 'bon_pk_...',
    baseUrl: 'https://your-deployment.vercel.app',
  });
</script>
```

## What's on `window.Bonnard`

The IIFE bundle exposes two exports:

| Export | Purpose |
|--------|---------|
| `Bonnard.createClient(config)` | Create an SDK client instance |
| `Bonnard.toCubeQuery(options)` | Convert `QueryOptions` to a Cube-native query object (useful for debugging) |

## Field naming

All field names must be fully qualified with the view name:

```javascript
// Correct
bon.query({ measures: ['orders.revenue'], dimensions: ['orders.city'] });

// Wrong — will fail
bon.query({ measures: ['revenue'], dimensions: ['city'] });
```

## Discovering available fields

Use `explore()` to discover what views, measures, and dimensions are available:

```javascript
const meta = await bon.explore();
for (const view of meta.cubes) {
  console.log(view.name);
  console.log('  Measures:', view.measures.map(m => m.name));
  console.log('  Dimensions:', view.dimensions.map(d => d.name));
}
```

## Next steps

- [sdk.chartjs](sdk.chartjs) — Build a dashboard with Chart.js
- [sdk.echarts](sdk.echarts) — Build a dashboard with ECharts
- [sdk.apexcharts](sdk.apexcharts) — Build a dashboard with ApexCharts
- [sdk.query-reference](sdk.query-reference) — Full query API reference
- [sdk.authentication](sdk.authentication) — Auth patterns for multi-tenant apps
