# ApexCharts + Bonnard SDK

> Build HTML dashboards with ApexCharts and the Bonnard SDK. No build step required.

ApexCharts has the best visual defaults out of the box — no configuration needed for tooltips, responsive behavior, or dark mode. SVG-based rendering produces sharp visuals at any resolution. Moderate payload (~130KB gzip).

## Starter template

Copy this complete HTML file as a starting point. Replace `bon_pk_YOUR_KEY_HERE` with your publishable API key, and update the view/measure/dimension names to match your schema.

Use `explore()` to discover available views and fields — see [sdk.query-reference](sdk.query-reference).

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/apexcharts@3/dist/apexcharts.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@bonnard/sdk/dist/bonnard.iife.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #09090b; color: #fafafa; padding: 24px;
    }
    h1 { font-size: 24px; font-weight: 600; margin-bottom: 24px; }
    .error { color: #ef4444; background: #1c0a0a; padding: 12px; border-radius: 8px; margin-bottom: 16px; display: none; }
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .kpi { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; }
    .kpi-label { font-size: 14px; color: #a1a1aa; margin-bottom: 8px; }
    .kpi-value { font-size: 32px; font-weight: 600; }
    .kpi-value.loading { color: #3f3f46; }
    .charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px; }
    .chart-card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; }
    .chart-title { font-size: 16px; font-weight: 500; margin-bottom: 16px; }
    .chart-container { height: 300px; }
  </style>
</head>
<body>
  <h1>Dashboard</h1>
  <div id="error" class="error"></div>

  <div class="kpis">
    <div class="kpi">
      <div class="kpi-label">Revenue</div>
      <div class="kpi-value loading" id="kpi-revenue">--</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Orders</div>
      <div class="kpi-value loading" id="kpi-orders">--</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Avg Value</div>
      <div class="kpi-value loading" id="kpi-avg">--</div>
    </div>
  </div>

  <div class="charts">
    <div class="chart-card">
      <div class="chart-title">Revenue by City</div>
      <div class="chart-container" id="bar-chart"></div>
    </div>
    <div class="chart-card">
      <div class="chart-title">Revenue Trend</div>
      <div class="chart-container" id="line-chart"></div>
    </div>
  </div>

  <script>
    const bon = Bonnard.createClient({
      apiKey: 'bon_pk_YOUR_KEY_HERE',
    });

    // --- Helpers ---
    function showError(msg) {
      const el = document.getElementById('error');
      el.textContent = msg;
      el.style.display = 'block';
    }

    function formatNumber(v) {
      return new Intl.NumberFormat().format(v);
    }

    function formatCurrency(v) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
    }

    // ApexCharts dark mode defaults
    const darkTheme = {
      chart: { background: 'transparent', foreColor: '#a1a1aa' },
      theme: { mode: 'dark' },
      grid: { borderColor: '#27272a' },
      tooltip: { theme: 'dark' },
    };

    // --- Load data ---
    (async () => {
      try {
        // KPIs
        const kpis = await bon.query({
          measures: ['orders.revenue', 'orders.count', 'orders.avg_value'],
        });
        if (kpis.data.length > 0) {
          const row = kpis.data[0];
          document.getElementById('kpi-revenue').textContent = formatCurrency(row['orders.revenue']);
          document.getElementById('kpi-revenue').classList.remove('loading');
          document.getElementById('kpi-orders').textContent = formatNumber(row['orders.count']);
          document.getElementById('kpi-orders').classList.remove('loading');
          document.getElementById('kpi-avg').textContent = formatCurrency(row['orders.avg_value']);
          document.getElementById('kpi-avg').classList.remove('loading');
        }

        // Bar chart — revenue by city
        const byCity = await bon.query({
          measures: ['orders.revenue'],
          dimensions: ['orders.city'],
          orderBy: { 'orders.revenue': 'desc' },
          limit: 10,
        });

        new ApexCharts(document.getElementById('bar-chart'), {
          ...darkTheme,
          chart: { ...darkTheme.chart, type: 'bar', height: 300 },
          series: [{ name: 'Revenue', data: byCity.data.map(d => d['orders.revenue']) }],
          xaxis: { categories: byCity.data.map(d => d['orders.city']) },
          yaxis: { labels: { formatter: v => formatCurrency(v) } },
          plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
          colors: ['#3b82f6'],
          dataLabels: { enabled: false },
        }).render();

        // Line chart — revenue trend
        const trend = await bon.query({
          measures: ['orders.revenue'],
          timeDimension: {
            dimension: 'orders.created_at',
            granularity: 'month',
            dateRange: 'last 12 months',
          },
        });

        new ApexCharts(document.getElementById('line-chart'), {
          ...darkTheme,
          chart: { ...darkTheme.chart, type: 'area', height: 300 },
          series: [{ name: 'Revenue', data: trend.data.map(d => d['orders.revenue']) }],
          xaxis: {
            categories: trend.data.map(d => {
              const date = new Date(d['orders.created_at']);
              return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            }),
          },
          yaxis: { labels: { formatter: v => formatCurrency(v) } },
          colors: ['#3b82f6'],
          fill: { type: 'gradient', gradient: { opacityFrom: 0.3, opacityTo: 0.05 } },
          stroke: { curve: 'smooth', width: 2 },
          dataLabels: { enabled: false },
        }).render();
      } catch (err) {
        showError('Failed to load dashboard: ' + err.message);
      }
    })();
  </script>
</body>
</html>
```

## Chart types

### Bar chart

```javascript
new ApexCharts(el, {
  chart: { type: 'bar', height: 300 },
  series: [{ name: 'Revenue', data: data.map(d => d['view.measure']) }],
  xaxis: { categories: data.map(d => d['view.dimension']) },
  plotOptions: { bar: { borderRadius: 4 } },
  colors: ['#3b82f6'],
}).render();
```

### Horizontal bar chart

```javascript
new ApexCharts(el, {
  chart: { type: 'bar', height: 300 },
  series: [{ name: 'Revenue', data: data.map(d => d['view.measure']) }],
  xaxis: { categories: data.map(d => d['view.dimension']) },
  plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
}).render();
```

### Line chart

```javascript
new ApexCharts(el, {
  chart: { type: 'line', height: 300 },
  series: [{ name: 'Revenue', data: values }],
  xaxis: { categories: labels },
  stroke: { curve: 'smooth', width: 2 },
}).render();
```

### Area chart

```javascript
new ApexCharts(el, {
  chart: { type: 'area', height: 300 },
  series: [{ name: 'Revenue', data: values }],
  xaxis: { categories: labels },
  fill: { type: 'gradient', gradient: { opacityFrom: 0.3, opacityTo: 0.05 } },
  stroke: { curve: 'smooth', width: 2 },
}).render();
```

### Pie / donut chart

```javascript
new ApexCharts(el, {
  chart: { type: 'donut', height: 300 }, // or 'pie'
  series: data.map(d => d['view.measure']),
  labels: data.map(d => d['view.dimension']),
  colors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
}).render();
```

### Multi-series line chart

```javascript
const cities = [...new Set(data.map(d => d['orders.city']))];
const dates = [...new Set(data.map(d => d['orders.created_at']))];

new ApexCharts(el, {
  chart: { type: 'line', height: 300 },
  series: cities.map(city => ({
    name: city,
    data: dates.map(date =>
      data.find(d => d['orders.city'] === city && d['orders.created_at'] === date)?.['orders.revenue'] || 0
    ),
  })),
  xaxis: { categories: dates.map(d => new Date(d).toLocaleDateString()) },
  stroke: { curve: 'smooth', width: 2 },
}).render();
```

## Dark mode

ApexCharts has built-in dark mode support:

```javascript
const darkTheme = {
  chart: { background: 'transparent', foreColor: '#a1a1aa' },
  theme: { mode: 'dark' },
  grid: { borderColor: '#27272a' },
  tooltip: { theme: 'dark' },
};

new ApexCharts(el, {
  ...darkTheme,
  chart: { ...darkTheme.chart, type: 'bar', height: 300 },
  // ... rest of config
}).render();
```

## Color palette

```javascript
const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// Apply globally:
colors: COLORS,
```

## See also

- [sdk.browser](sdk.browser) — Browser / CDN quickstart
- [sdk.query-reference](sdk.query-reference) — Full query API
- [sdk.chartjs](sdk.chartjs) — Chart.js alternative (smallest payload)
- [sdk.echarts](sdk.echarts) — ECharts alternative (more chart types)
