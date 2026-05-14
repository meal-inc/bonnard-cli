# References

> References let you point to columns, measures, dimensions, and other cubes inside SQL expressions. Use curly-brace syntax to create type-safe, refactor-friendly cross-cube references.

## Overview

Bonnard provides special syntax for referencing columns, measures, dimensions, and other cubes within SQL expressions. This enables dynamic, maintainable cube definitions.

## Reference Types

### Column References

Simple column name (no braces):

```yaml
dimensions:
  - name: status
    type: string
    sql: status
```

### Member References

Reference other members in the same cube with `{member_name}`:

```yaml
dimensions:
  - name: first_name
    type: string
    sql: first_name

  - name: last_name
    type: string
    sql: last_name

  - name: full_name
    type: string
    sql: "CONCAT({first_name}, ' ', {last_name})"
```

### {CUBE} Placeholder

Reference the current cube's columns:

```yaml
measures:
  - name: completed_count
    type: count
    filters:
      - sql: "{CUBE}.status = 'completed'"
```

Equivalent notations:

```yaml
# These are equivalent
sql: "{CUBE}.amount"
sql: "{CUBE.amount}"
```

### Cross-Cube References

Reference other cubes with `{cube_name.member}`:

```yaml
joins:
  - name: users
    relationship: many_to_one
    sql: "{CUBE}.user_id = {users.id}"
```

### Measure References in Calculated Measures

```yaml
measures:
  - name: total_orders
    type: count

  - name: total_revenue
    type: sum
    sql: amount

  - name: average_order_value
    type: number
    sql: "{total_revenue} / NULLIF({total_orders}, 0)"
```

## SQL Reuse

### {cube.sql()} Function

Reference another cube's SQL definition:

```yaml
cubes:
  - name: active_users
    sql: >
      SELECT * FROM {users.sql()}
      WHERE is_active = true
```

## Time Dimension Granularities

Reference time dimensions with granularity:

```yaml
# In pre-aggregations or calculated fields
sql: "{created_at.day}"
sql: "{created_at.month}"
sql: "{created_at.year}"
```

## Join Path References

In views, specify join paths with dot notation:

```yaml
views:
  - name: order_details
    cubes:
      # Direct cube
      - join_path: orders

      # Joined cube (orders -> users)
      - join_path: orders.users

      # Multi-hop (orders -> users -> countries)
      - join_path: orders.users.countries
```

## Escaping Braces

For literal curly braces in SQL (e.g., JSON), escape with backslash:

```yaml
sql: "metadata->>'\{key\}'"
```

## Common Patterns

### Safe Division

```yaml
- name: conversion_rate
  type: number
  sql: "{conversions} / NULLIF({visits}, 0)"
```

### Conditional Logic

```yaml
- name: revenue_category
  type: string
  sql: >
    CASE
      WHEN {total_revenue} > 10000 THEN 'high'
      WHEN {total_revenue} > 1000 THEN 'medium'
      ELSE 'low'
    END
```

### Cross-Cube Calculations

```yaml
- name: orders_per_user
  type: number
  sql: "{orders.count} / NULLIF({users.count}, 0)"
```

## See Also

- syntax
- cubes.measures.calculated
- cubes.joins
