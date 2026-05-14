# Measure Filters

> Measure filters apply permanent WHERE conditions to measures for conditional aggregations. Create filtered metrics like "revenue from paid plans" or "active users in the last 30 days."

## Overview

The `filters` property lets you define measures that only count or aggregate rows matching specific conditions. This creates reusable filtered metrics without requiring query-time filters.

## Example

```yaml
measures:
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

## Syntax

### Single Filter

```yaml
- name: active_users
  type: count_distinct
  sql: user_id
  filters:
    - sql: "{CUBE}.is_active = true"
```

### Multiple Filters (AND logic)

```yaml
- name: completed_paid_orders
  type: count
  filters:
    - sql: "{CUBE}.status = 'completed'"
    - sql: "{CUBE}.payment_status = 'paid'"
```

## Use Cases

### Percentage Calculations

```yaml
measures:
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

### Time-Based Metrics

```yaml
- name: orders_last_30_days
  type: count
  filters:
    - sql: "{CUBE}.created_at >= CURRENT_DATE - INTERVAL '30 days'"
```

## Best Practices

1. **Use {CUBE}** to reference the current cube's columns
2. **Combine with number type** for calculated ratios
3. **Keep filters simple** — complex logic belongs in the base SQL

## See Also

- cubes.measures
- cubes.measures.calculated
- cubes.segments
