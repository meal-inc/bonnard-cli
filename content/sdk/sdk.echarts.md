# ECharts + Bonnard SDK

> Build HTML dashboards with Apache ECharts and the Bonnard SDK. No build step required.

ECharts offers rich interactivity (tooltips, zoom, legend toggling), built-in dark theme, and extensive chart types. Larger payload than Chart.js (~160KB gzip) but more powerful.

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
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
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

    // Resize all charts on window resize
    const charts = [];
    window.addEventListener('resize', () => charts.forEach(c => c.resize()));

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

        const barChart = echarts.init(document.getElementById('bar-chart'), 'dark');
        charts.push(barChart);
        barChart.setOption({
          tooltip: { trigger: 'axis', formatter: p => `${p[0].name}: ${formatCurrency(p[0].value)}` },
          xAxis: { type: 'category', data: byCity.data.map(d => d['orders.city']) },
          yAxis: { type: 'value', axisLabel: { formatter: v => formatCurrency(v) } },
          series: [{
            type: 'bar',
            data: byCity.data.map(d => d['orders.revenue']),
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          }],
          grid: { left: 80, right: 20, top: 20, bottom: 40 },
        });

        // Line chart — revenue trend
        const trend = await bon.query({
          measures: ['orders.revenue'],
          timeDimension: {
            dimension: 'orders.created_at',
            granularity: 'month',
            dateRange: 'last 12 months',
          },
        });

        const lineChart = echarts.init(document.getElementById('line-chart'), 'dark');
        charts.push(lineChart);
        lineChart.setOption({
          tooltip: { trigger: 'axis', formatter: p => `${p[0].name}: ${formatCurrency(p[0].value)}` },
          xAxis: {
            type: 'category',
            data: trend.data.map(d => {
              const date = new Date(d['orders.created_at']);
              return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            }),
          },
          yAxis: { type: 'value', axisLabel: { formatter: v => formatCurrency(v) } },
          series: [{
            type: 'line',
            data: trend.data.map(d => d['orders.revenue']),
            smooth: true,
            itemStyle: { color: '#3b82f6' },
            areaStyle: { color: 'rgba(59, 130, 246, 0.15)' },
          }],
          grid: { left: 80, right: 20, top: 20, bottom: 40 },
        });
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
const chart = echarts.init(el, 'dark');
chart.setOption({
  xAxis: { type: 'category', data: data.map(d => d['view.dimension']) },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: data.map(d => d['view.measure']) }],
});
```

### Horizontal bar chart

```javascript
chart.setOption({
  xAxis: { type: 'value' },
  yAxis: { type: 'category', data: data.map(d => d['view.dimension']) },
  series: [{ type: 'bar', data: data.map(d => d['view.measure']) }],
});
```

### Line chart

```javascript
chart.setOption({
  xAxis: { type: 'category', data: labels },
  yAxis: { type: 'value' },
  series: [{ type: 'line', data: values, smooth: true }],
});
```

### Area chart

```javascript
series: [{
  type: 'line',
  data: values,
  smooth: true,
  areaStyle: { color: 'rgba(59, 130, 246, 0.15)' },
}]
```

### Pie chart

```javascript
chart.setOption({
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'], // doughnut — use '60%' for full pie
    data: data.map(d => ({
      name: d['view.dimension'],
      value: d['view.measure'],
    })),
  }],
});
```

### Multi-series line chart

```javascript
const cities = [...new Set(data.map(d => d['orders.city']))];
const dates = [...new Set(data.map(d => d['orders.created_at']))];

chart.setOption({
  tooltip: { trigger: 'axis' },
  legend: { data: cities },
  xAxis: { type: 'category', data: dates.map(d => new Date(d).toLocaleDateString()) },
  yAxis: { type: 'value' },
  series: cities.map(city => ({
    name: city,
    type: 'line',
    smooth: true,
    data: dates.map(date =>
      data.find(d => d['orders.city'] === city && d['orders.created_at'] === date)?.['orders.revenue'] || 0
    ),
  })),
});
```

## Dark mode

ECharts has a built-in dark theme — pass `'dark'` as the second argument to `echarts.init()`:

```javascript
const chart = echarts.init(document.getElementById('chart'), 'dark');
```

The dark theme sets appropriate background, text, axis, and tooltip colors automatically.

## Resize handling

ECharts charts don't auto-resize. Add a resize listener:

```javascript
const charts = [];

// After creating each chart:
charts.push(chart);

// Global resize handler:
window.addEventListener('resize', () => charts.forEach(c => c.resize()));
```

## Color palette

```javascript
const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// Apply to a series:
series: data.map((d, i) => ({
  // ...
  itemStyle: { color: COLORS[i % COLORS.length] },
}))
```

## See also

- [sdk.browser](sdk.browser) — Browser / CDN quickstart
- [sdk.query-reference](sdk.query-reference) — Full query API
- [sdk.chartjs](sdk.chartjs) — Chart.js alternative (smaller payload)
- [sdk.apexcharts](sdk.apexcharts) — ApexCharts alternative
