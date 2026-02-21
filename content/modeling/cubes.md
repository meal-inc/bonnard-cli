# Cubes

> Cubes are the core building blocks of a Bonnard semantic layer. Each cube maps to a database table and defines the measures, dimensions, and joins available for querying.

## Overview

Cubes are the foundational building blocks of your semantic layer. Each cube represents a dataset (typically a database table or SQL query) and defines the measures (metrics) and dimensions (attributes) available for analysis.

## Example

```yaml
cubes:
  - name: orders
    sql_table: public.orders

    measures:
      - name: count
        type: count

      - name: total_revenue
        type: sum
        sql: amount

      - name: average_order_value
        type: number
        sql: "{total_revenue} / NULLIF({count}, 0)"

    dimensions:
      - name: id
        type: number
        sql: id
        primary_key: true

      - name: status
        type: string
        sql: status

      - name: created_at
        type: time
        sql: created_at

    joins:
      - name: users
        relationship: many_to_one
        sql: "{CUBE}.user_id = {users.id}"
```

## Core Properties

| Property | Required | Description |
|----------|----------|-------------|
| `name` | Yes | Unique identifier in snake_case |
| `sql` or `sql_table` | Yes | Data source query or table |
| `measures` | No | Aggregations (count, sum, avg, etc.) |
| `dimensions` | No | Attributes for grouping/filtering |
| `joins` | No | Relationships to other cubes |
| `segments` | No | Predefined filters |
| `pre_aggregations` | No | Materialized query results |

## Data Source

### sql_table (recommended)

For simple table references:

```yaml
cubes:
  - name: orders
    sql_table: public.orders
```

### sql

For complex queries:

```yaml
cubes:
  - name: orders
    sql: >
      SELECT o.*, u.name as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
```

## Naming Conventions

- Use `snake_case` for names
- Use plural nouns: `orders`, `users`, `products`
- Be descriptive: `order_line_items` not `oli`

## File Organization

One cube per file in the `bonnard/cubes/` directory:

```
bonnard/cubes/
├── orders.yaml
├── users.yaml
├── products.yaml
└── line_items.yaml
```

## Best Practices

1. **Define a primary key** — required for joins and count_distinct
2. **Start with basic measures** — count, sum of key metrics
3. **Add dimensions for common filters** — status, dates, categories
4. **Use joins sparingly** — define on the "many" side
5. **Document with descriptions** — help consumers understand the data

## See Also

- cubes.sql
- cubes.measures
- cubes.dimensions
- cubes.joins
- cubes.segments
