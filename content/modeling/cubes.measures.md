# Measures

> Measures define the metrics and aggregations in your semantic layer. Use them to calculate sums, counts, averages, and custom expressions that stay consistent across every consumer.

## Overview

Measures are the quantitative values in your data model — counts, sums, averages, and other aggregations. They answer questions like "how many?", "how much?", and "what's the average?".

## Example

```yaml
measures:
  - name: count
    type: count
    description: Total number of orders

  - name: total_revenue
    type: sum
    sql: amount
    description: Sum of order amounts in dollars

  - name: average_order_value
    type: number
    sql: "{total_revenue} / NULLIF({count}, 0)"
    description: Average revenue per order

  - name: completed_orders
    type: count
    filters:
      - sql: "{CUBE}.status = 'completed'"
    description: Orders with status completed
```

## Required Properties

| Property | Description |
|----------|-------------|
| `name` | Unique identifier in snake_case |
| `type` | Aggregation type (count, sum, avg, etc.) |

## Optional Properties

| Property | Description |
|----------|-------------|
| `sql` | SQL expression (required for most types) |
| `filters` | Conditions for filtered aggregations |
| `title` | Human-readable display name |
| `description` | Documentation for consumers |
| `format` | Output format (percent, currency, etc.) |
| `public` | Whether exposed in API (default: true) |
| `rolling_window` | Rolling aggregation settings |

## Measure Types

### Aggregation Types

```yaml
# Count rows
- name: count
  type: count

# Count distinct values
- name: unique_users
  type: count_distinct
  sql: user_id

# Sum values
- name: total_revenue
  type: sum
  sql: amount

# Average values
- name: average_price
  type: avg
  sql: price

# Min/Max values
- name: first_order
  type: min
  sql: created_at

- name: last_order
  type: max
  sql: created_at
```

### Calculated Types

```yaml
# Calculated number (from other measures)
- name: average_order_value
  type: number
  sql: "{total_revenue} / NULLIF({count}, 0)"

# Boolean result
- name: has_orders
  type: boolean
  sql: "{count} > 0"
```

## Filtered Measures

Add conditions to only count/sum matching rows:

```yaml
- name: completed_orders
  type: count
  filters:
    - sql: "{CUBE}.status = 'completed'"

- name: revenue_this_year
  type: sum
  sql: amount
  filters:
    - sql: "YEAR({CUBE}.created_at) = YEAR(CURRENT_DATE)"
```

## Calculated Measures

Reference other measures to build derived metrics:

```yaml
- name: total_orders
  type: count

- name: completed_orders
  type: count
  filters:
    - sql: "{CUBE}.status = 'completed'"

- name: completion_rate
  type: number
  sql: "100.0 * {completed_orders} / NULLIF({total_orders}, 0)"
  format: percent
```

## Rolling Windows

Calculate metrics over time windows:

```yaml
- name: rolling_7_day_revenue
  type: sum
  sql: amount
  rolling_window:
    trailing: 7 day
```

## Best Practices

1. **Start with count** — every cube should have a basic count
2. **Use descriptive names** — `total_revenue` not `sum1`
3. **Handle division by zero** — always use `NULLIF(x, 0)`
4. **Add formats** — help consumers interpret values
5. **Document complex measures** — explain business logic

## See Also

- cubes.measures.types
- cubes.measures.filters
- cubes.measures.calculated
- cubes.measures.rolling
