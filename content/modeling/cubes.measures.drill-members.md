# Drill Members

> Drill members define which dimensions are shown when a user drills into a measure. Configure drill-down paths so consumers can explore aggregated numbers down to individual records.

## Overview

The `drill_members` property specifies which dimensions should be displayed when a user "drills down" into a measure to see the underlying detail records.

## Example

```yaml
cubes:
  - name: orders
    sql_table: orders

    measures:
      - name: count
        type: count
        drill_members:
          - id
          - status
          - created_at
          - customer_name

      - name: total_revenue
        type: sum
        sql: amount
        drill_members:
          - id
          - amount
          - status
          - created_at

    dimensions:
      - name: id
        type: number
        sql: id
        primary_key: true

      - name: status
        type: string
        sql: status

      - name: amount
        type: number
        sql: amount

      - name: customer_name
        type: string
        sql: customer_name

      - name: created_at
        type: time
        sql: created_at
```

## Syntax

List dimensions by name:

```yaml
measures:
  - name: count
    type: count
    drill_members:
      - id
      - name
      - email
      - created_at
```

## How Drill-Down Works

1. User sees aggregated measure (e.g., "Orders: 1,234")
2. User clicks to drill down
3. BI tool queries the specified `drill_members` dimensions
4. User sees detail records that make up that aggregate

## Cross-Cube Drill Members

Reference dimensions from joined cubes:

```yaml
cubes:
  - name: orders
    joins:
      - name: users
        relationship: many_to_one
        sql: "{CUBE}.user_id = {users.id}"

    measures:
      - name: count
        type: count
        drill_members:
          - id
          - status
          - users.name      # From joined cube
          - users.email     # From joined cube
          - created_at
```

## Best Practices

### Include Identifying Information

```yaml
drill_members:
  - id              # Primary identifier
  - name            # Human-readable name
  - created_at      # When it happened
```

### Include Relevant Context

```yaml
# For a revenue measure
drill_members:
  - order_id
  - product_name
  - amount          # The value being summed
  - customer_name
  - order_date
```

### Keep Lists Focused

Don't include every dimension—focus on what's useful for understanding that specific measure:

```yaml
# Good - focused on revenue context
- name: total_revenue
  drill_members:
    - id
    - amount
    - product
    - customer

# Bad - too many unrelated fields
- name: total_revenue
  drill_members:
    - id
    - amount
    - product
    - customer
    - internal_code
    - debug_flag
    - sync_status
```

## BI Tool Support

Drill-down support varies by visualization tool. Check your specific tool's documentation for how it handles `drill_members`.

## See Also

- cubes.measures
- cubes.dimensions
- cubes.joins
