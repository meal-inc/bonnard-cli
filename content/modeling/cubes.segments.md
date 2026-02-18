# Segments

> Segments define reusable row-level filters that can be applied to any query on a cube. Use them for common filters like "active users" or "paid orders" that multiple consumers need.

## Overview

Segments are predefined filters that can be applied to queries. They make common filtering patterns reusable and ensure consistent definitions across analyses.

## Example

```yaml
cubes:
  - name: orders
    sql: SELECT * FROM orders

    segments:
      - name: completed
        sql: "{CUBE}.status = 'completed'"

      - name: high_value
        sql: "{CUBE}.amount > 1000"

      - name: this_year
        sql: "YEAR({CUBE}.created_at) = YEAR(CURRENT_DATE)"
```

## Syntax

### Basic Segment

```yaml
segments:
  - name: active
    sql: "{CUBE}.is_active = true"
```

### Multiple Conditions

```yaml
segments:
  - name: premium_active
    sql: "{CUBE}.is_active = true AND {CUBE}.plan = 'premium'"
```

### Using References

```yaml
segments:
  - name: has_recent_order
    sql: "{CUBE}.last_order_date > CURRENT_DATE - INTERVAL '30 days'"
```

## Segments vs Filters

| Segments | Query Filters |
|----------|---------------|
| Predefined in model | Applied at query time |
| Named and reusable | Ad-hoc |
| Part of the schema | Part of the query |
| Self-documenting | Requires context |

## Segments vs Filtered Measures

| Use Case | Solution |
|----------|----------|
| Filter all measures in a query | Segment |
| Create a specific filtered metric | Filtered measure |

```yaml
# Segment: filters entire query
segments:
  - name: completed
    sql: "{CUBE}.status = 'completed'"

# Filtered measure: only this metric
measures:
  - name: completed_count
    type: count
    filters:
      - sql: "{CUBE}.status = 'completed'"
```

## Common Patterns

### Status Segments

```yaml
segments:
  - name: pending
    sql: "{CUBE}.status = 'pending'"
  - name: completed
    sql: "{CUBE}.status = 'completed'"
  - name: cancelled
    sql: "{CUBE}.status = 'cancelled'"
```

### Time-based Segments

```yaml
segments:
  - name: last_7_days
    sql: "{CUBE}.created_at >= CURRENT_DATE - INTERVAL '7 days'"
  - name: last_30_days
    sql: "{CUBE}.created_at >= CURRENT_DATE - INTERVAL '30 days'"
```

### Business Logic Segments

```yaml
segments:
  - name: churned
    sql: "{CUBE}.last_activity_at < CURRENT_DATE - INTERVAL '90 days'"
  - name: high_value_customer
    sql: "{CUBE}.lifetime_value > 10000"
```

## See Also

- cubes
- cubes.measures.filters
- views
