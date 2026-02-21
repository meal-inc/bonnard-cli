# Rolling Measures

> Rolling measures calculate aggregations over sliding time windows like 7-day averages, 30-day sums, and month-to-date totals. Define the window type, trailing period, and offset.

## Overview

Rolling window measures aggregate data over a sliding time period. Use `rolling_window` to define moving averages, cumulative totals, and time-based comparisons.

## Example

```yaml
measures:
  - name: rolling_7_day_orders
    type: count
    rolling_window:
      trailing: 7 day
      offset: start

  - name: rolling_30_day_revenue
    type: sum
    sql: amount
    rolling_window:
      trailing: 30 day
```

## Syntax

### rolling_window Properties

| Property | Description |
|----------|-------------|
| `trailing` | Time period to look back (e.g., `7 day`, `1 month`) |
| `leading` | Time period to look forward (rare) |
| `offset` | `start` or `end` — which end of the window to align |

### Trailing Window

```yaml
- name: rolling_7_day_avg
  type: avg
  sql: amount
  rolling_window:
    trailing: 7 day
```

### Cumulative (Running Total)

Use `unbounded` for cumulative calculations:

```yaml
- name: cumulative_revenue
  type: sum
  sql: amount
  rolling_window:
    trailing: unbounded
```

### Offset Options

```yaml
# Window ends at current row (default)
rolling_window:
  trailing: 7 day
  offset: end

# Window starts at current row
rolling_window:
  trailing: 7 day
  offset: start
```

## Common Patterns

### 7-Day Moving Average

```yaml
- name: daily_orders
  type: count

- name: rolling_7_day_avg_orders
  type: avg
  sql: "{daily_orders}"
  rolling_window:
    trailing: 7 day
```

### Month-to-Date

```yaml
- name: mtd_revenue
  type: sum
  sql: amount
  rolling_window:
    trailing: 1 month
    offset: start
```

### Year-to-Date

```yaml
- name: ytd_revenue
  type: sum
  sql: amount
  rolling_window:
    trailing: 1 year
    offset: start
```

## Requirements

- Rolling window measures require a time dimension in the query
- Works best with pre-aggregations for performance

## See Also

- cubes.measures
- cubes.measures.calculated
- cubes.dimensions.time
- pre-aggregations
