# Time Dimensions

> Time dimensions enable date and time-based analysis in your semantic layer. They support automatic granularity (day, week, month, year) and power time-series queries and date filters.

## Overview

Time dimensions (`type: time`) enable powerful time-based analysis including granularity selection, date ranges, and rolling windows. They're essential for any time-series analytics.

## Example

```yaml
dimensions:
  - name: created_at
    type: time
    sql: created_at

  - name: order_date
    type: time
    sql: DATE(ordered_at)
```

## Time Granularities

When querying a time dimension, you can specify granularity:

| Granularity | Description |
|-------------|-------------|
| `second` | Group by second |
| `minute` | Group by minute |
| `hour` | Group by hour |
| `day` | Group by day |
| `week` | Group by week (Monday start) |
| `month` | Group by month |
| `quarter` | Group by quarter |
| `year` | Group by year |

## Query Usage

Time dimensions can be used in `timeDimensions` for special handling:

```json
{
  "measures": ["orders.count"],
  "timeDimensions": [{
    "dimension": "orders.created_at",
    "granularity": "month",
    "dateRange": ["2024-01-01", "2024-12-31"]
  }]
}
```

## Date Ranges

Common date range options:

- `"today"`, `"yesterday"`
- `"this week"`, `"last week"`
- `"this month"`, `"last month"`
- `"this year"`, `"last year"`
- `"last 7 days"`, `"last 30 days"`
- `["2024-01-01", "2024-12-31"]` (custom range)

## Best Practices

### Use Native Timestamps

```yaml
# Good - preserves precision
- name: created_at
  type: time
  sql: created_at

# Avoid - loses time component
- name: created_at
  type: time
  sql: DATE(created_at)
```

### Multiple Time Dimensions

A cube can have multiple time dimensions for different purposes:

```yaml
- name: created_at
  type: time
  sql: created_at

- name: shipped_at
  type: time
  sql: shipped_at

- name: delivered_at
  type: time
  sql: delivered_at
```

### Timezone Handling

For consistent timezone handling, convert in SQL:

```yaml
- name: created_at
  type: time
  sql: "CONVERT_TIMEZONE('UTC', 'America/New_York', created_at)"
```

## See Also

- cubes.dimensions
- cubes.dimensions.types
- cubes.measures.rolling
