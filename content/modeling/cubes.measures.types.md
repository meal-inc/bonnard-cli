# Measure Types

> Reference for all 12 measure types available in Bonnard: count, sum, avg, min, max, count_distinct, running_total, and more. Each type maps to a specific SQL aggregation.

## Overview

There are 12 measure types that determine how values are aggregated. Choose the right type based on your analytical needs.

## Measure Types

### count
Counts the number of rows.

```yaml
- name: count
  type: count
```

### count_distinct
Counts unique values of a column.

```yaml
- name: unique_users
  type: count_distinct
  sql: user_id
```

### count_distinct_approx
Approximate count distinct (faster for large datasets).

```yaml
- name: approx_unique_users
  type: count_distinct_approx
  sql: user_id
```

### sum
Adds up numeric values.

```yaml
- name: total_revenue
  type: sum
  sql: amount
```

### avg
Calculates the average of numeric values.

```yaml
- name: average_order_value
  type: avg
  sql: amount
```

### min
Returns the minimum value.

```yaml
- name: first_order_date
  type: min
  sql: created_at
```

### max
Returns the maximum value.

```yaml
- name: last_order_date
  type: max
  sql: created_at
```

### number
A calculated number (not aggregated from rows).

```yaml
- name: conversion_rate
  type: number
  sql: "{completed_orders} / NULLIF({total_orders}, 0)"
```

### string
A calculated string value.

```yaml
- name: status_label
  type: string
  sql: "'Active'"
```

### time
A calculated time value.

```yaml
- name: current_timestamp
  type: time
  sql: NOW()
```

### boolean
A calculated boolean value.

```yaml
- name: has_orders
  type: boolean
  sql: "{count} > 0"
```

### number_agg
Custom aggregate function (advanced).

```yaml
- name: median_price
  type: number_agg
  sql: "PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY {CUBE}.price)"
```

## See Also

- cubes.measures
- cubes.measures.calculated
- cubes.measures.filters
