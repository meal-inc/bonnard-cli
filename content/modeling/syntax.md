# Syntax

> YAML syntax reference for defining cubes and views in Bonnard. Covers naming conventions, property formats, SQL expressions, Jinja templating, and member references.

## Overview

Cubes and views are defined in YAML files. Understanding the syntax conventions helps you write correct and maintainable definitions.

## File Structure

### Cubes File

```yaml
cubes:
  - name: orders
    sql_table: public.orders

    measures:
      - name: count
        type: count

    dimensions:
      - name: id
        type: number
        sql: id
        primary_key: true
```

### Views File

```yaml
views:
  - name: orders_overview
    cubes:
      - join_path: orders
        includes:
          - count
          - status
```

## Naming Conventions

### Cube and View Names

- Use `snake_case`
- Be descriptive: `user_orders`, not `uo`
- Use plural for collections: `orders`, `users`

```yaml
cubes:
  - name: orders           # Good
  - name: user_activity    # Good
  - name: Orders           # Bad - use lowercase
  - name: userOrders       # Bad - use snake_case
```

### Member Names

- Use `snake_case`
- Be descriptive but concise

```yaml
measures:
  - name: count                    # Good
  - name: total_revenue            # Good
  - name: average_order_value      # Good
  - name: aov                      # Bad - unclear abbreviation
```

## SQL Expressions

### Inline SQL

```yaml
dimensions:
  - name: full_name
    type: string
    sql: "CONCAT(first_name, ' ', last_name)"
```

### Multi-line SQL

Use YAML block scalar for complex SQL:

```yaml
cubes:
  - name: orders
    sql: >
      SELECT
        o.*,
        u.name as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
```

## Common Patterns

### Quoting

Quote SQL expressions with special characters:

```yaml
# Quoted - required for expressions
sql: "{CUBE}.amount * 0.1"

# Unquoted - simple column reference
sql: amount
```

### Arrays

```yaml
# Inline array
includes: [count, total_revenue]

# Block array
includes:
  - count
  - total_revenue
```

### Booleans

```yaml
primary_key: true
public: false
```

## See Also

- syntax.references
- cubes
- views
