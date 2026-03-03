# Chart.js + Bonnard SDK

> Build HTML dashboards with Chart.js and the Bonnard SDK. No build step required.

Chart.js is the recommended chart library for HTML dashboards — smallest payload (~65KB gzip), most LLM training data, and excellent documentation.

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
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
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
    .chart-container { position: relative; height: 300px; }
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
      <div class="chart-container"><canvas id="bar-chart"></canvas></div>
    </div>
    <div class="chart-card">
      <div class="chart-title">Revenue Trend</div>
      <div class="chart-container"><canvas id="line-chart"></canvas></div>
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

    // Chart.js defaults for dark mode
    Chart.defaults.color = '#a1a1aa';
    Chart.defaults.borderColor = '#27272a';

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

        new Chart(document.getElementById('bar-chart'), {
          type: 'bar',
          data: {
            labels: byCity.data.map(d => d['orders.city']),
            datasets: [{
              label: 'Revenue',
              data: byCity.data.map(d => d['orders.revenue']),
              backgroundColor: '#3b82f6',
              borderRadius: 4,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                ticks: { callback: v => formatCurrency(v) },
                grid: { color: '#27272a' },
              },
              x: { grid: { display: false } },
            },
          },
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

        new Chart(document.getElementById('line-chart'), {
          type: 'line',
          data: {
            labels: trend.data.map(d => {
              const date = new Date(d['orders.created_at']);
              return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            }),
            datasets: [{
              label: 'Revenue',
              data: trend.data.map(d => d['orders.revenue']),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 3,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                ticks: { callback: v => formatCurrency(v) },
                grid: { color: '#27272a' },
              },
              x: { grid: { display: false } },
            },
          },
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
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: data.map(d => d['view.dimension']),
    datasets: [{
      label: 'Revenue',
      data: data.map(d => d['view.measure']),
      backgroundColor: '#3b82f6',
      borderRadius: 4,
    }],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  },
});
```

### Horizontal bar chart

```javascript
new Chart(ctx, {
  type: 'bar',
  data: { /* same as above */ },
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
  },
});
```

### Line chart

```javascript
new Chart(ctx, {
  type: 'line',
  data: {
    labels: data.map(d => new Date(d['view.date']).toLocaleDateString()),
    datasets: [{
      label: 'Revenue',
      data: data.map(d => d['view.measure']),
      borderColor: '#3b82f6',
      tension: 0.3,
    }],
  },
});
```

### Area chart (filled line)

```javascript
datasets: [{
  label: 'Revenue',
  data: data.map(d => d['view.measure']),
  borderColor: '#3b82f6',
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  fill: true,
}]
```

### Pie / doughnut chart

```javascript
new Chart(ctx, {
  type: 'doughnut', // or 'pie'
  data: {
    labels: data.map(d => d['view.dimension']),
    datasets: [{
      data: data.map(d => d['view.measure']),
      backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
    }],
  },
});
```

### Multi-series line chart

```javascript
// Query with a grouping dimension
const { data } = await bon.query({
  measures: ['orders.revenue'],
  dimensions: ['orders.city'],
  timeDimension: { dimension: 'orders.created_at', granularity: 'month' },
});

// Group data by city
const cities = [...new Set(data.map(d => d['orders.city']))];
const dates = [...new Set(data.map(d => d['orders.created_at']))];

new Chart(ctx, {
  type: 'line',
  data: {
    labels: dates.map(d => new Date(d).toLocaleDateString()),
    datasets: cities.map((city, i) => ({
      label: city,
      data: dates.map(date =>
        data.find(d => d['orders.city'] === city && d['orders.created_at'] === date)?.['orders.revenue'] || 0
      ),
      borderColor: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5],
    })),
  },
});
```

## Dark mode setup

Set Chart.js defaults before creating charts:

```javascript
Chart.defaults.color = '#a1a1aa';       // label/tick color
Chart.defaults.borderColor = '#27272a'; // grid line color
```

## Color palette

Recommended palette for multi-series charts:

```javascript
const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
```

## See also

- [sdk.browser](sdk.browser) — Browser / CDN quickstart
- [sdk.query-reference](sdk.query-reference) — Full query API
- [sdk.echarts](sdk.echarts) — ECharts alternative
- [sdk.apexcharts](sdk.apexcharts) — ApexCharts alternative
