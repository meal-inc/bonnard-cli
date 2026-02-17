# Sub-Query Dimensions

> Sub-query dimensions let you bring a measure from another cube into a dimension using a correlated subquery. Useful for denormalizing aggregated values like "lifetime revenue per user."

## Overview

Subquery dimensions allow you to reference measures from joined cubes as dimension values. This enables nested aggregations and bringing aggregate values into row-level context.

## Example

```yaml
cubes:
  - name: users
    sql_table: users

    dimensions:
      - name: id
        type: number
        sql: id
        primary_key: true

      - name: name
        type: string
        sql: name

      # Subquery dimension - brings order count as a user attribute
      - name: order_count
        type: number
        sql: "{orders.count}"
        sub_query: true

    joins:
      - name: orders
        relationship: one_to_many
        sql: "{CUBE}.id = {orders.user_id}"

  - name: orders
    sql_table: orders

    measures:
      - name: count
        type: count

    dimensions:
      - name: id
        type: number
        sql: id
        primary_key: true

      - name: user_id
        type: number
        sql: user_id
```

## Properties

| Property | Description |
|----------|-------------|
| `sub_query: true` | Enables measure reference in dimension |
| `propagate_filters_to_sub_query` | Pass query filters to the subquery |

## Syntax

### Basic Subquery Dimension

```yaml
dimensions:
  - name: total_orders
    type: number
    sql: "{orders.count}"
    sub_query: true
```

### With Filter Propagation

```yaml
dimensions:
  - name: recent_order_count
    type: number
    sql: "{orders.count}"
    sub_query: true
    propagate_filters_to_sub_query: true
```

When `propagate_filters_to_sub_query: true`, filters applied in the main query also apply to the subquery aggregation.

## How It Works

Bonnard generates an optimized LEFT JOIN with an aggregation subquery:

```sql
SELECT
  users.id,
  users.name,
  orders_subquery.count AS order_count
FROM users
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM orders
  GROUP BY user_id
) AS orders_subquery ON users.id = orders_subquery.user_id
```

## Use Cases

### User Metrics

```yaml
# On users cube
dimensions:
  - name: lifetime_order_count
    type: number
    sql: "{orders.count}"
    sub_query: true

  - name: lifetime_revenue
    type: number
    sql: "{orders.total_revenue}"
    sub_query: true
```

### Product Statistics

```yaml
# On products cube
dimensions:
  - name: times_purchased
    type: number
    sql: "{order_items.count}"
    sub_query: true

  - name: total_quantity_sold
    type: number
    sql: "{order_items.total_quantity}"
    sub_query: true
```

### Categorization Based on Aggregates

```yaml
dimensions:
  - name: order_count
    type: number
    sql: "{orders.count}"
    sub_query: true

  - name: customer_tier
    type: string
    sql: >
      CASE
        WHEN {order_count} >= 100 THEN 'platinum'
        WHEN {order_count} >= 50 THEN 'gold'
        WHEN {order_count} >= 10 THEN 'silver'
        ELSE 'bronze'
      END
```

## Requirements

1. **Join must exist** between the cubes
2. **Measure must exist** in the joined cube
3. **Primary key required** on both cubes

## Best Practices

1. **Use for commonly needed aggregates** — avoid creating subquery dimensions for rarely used metrics
2. **Consider performance** — subqueries add complexity to generated SQL
3. **Document the relationship** — make it clear where the data comes from

## See Also

- cubes.dimensions
- cubes.joins
- cubes.measures
