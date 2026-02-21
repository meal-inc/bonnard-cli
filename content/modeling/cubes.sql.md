# SQL

> Define the SQL table or subquery that powers a cube. Use the sql property to point to a physical table, or write a SELECT statement for derived datasets and transformations.

## Overview

The `sql` property defines the base table or SQL subquery that a cube is built on. This is the foundation for all measures and dimensions in the cube.

## Example

```yaml
cubes:
  - name: orders
    sql: SELECT * FROM public.orders

  - name: orders_with_users
    sql: >
      SELECT o.*, u.name as user_name
      FROM public.orders o
      LEFT JOIN public.users u ON o.user_id = u.id
```

## Options

### sql (required)
The SQL SELECT statement or table reference.

```yaml
# Simple table reference
sql: SELECT * FROM orders

# Subquery with joins
sql: >
  SELECT o.*, p.name as product_name
  FROM orders o
  JOIN products p ON o.product_id = p.id

# Using references to other cubes
sql: SELECT * FROM {users.sql()} WHERE active = true
```

### sql_table
Alternative to `sql` — directly reference a table without SELECT.

```yaml
cubes:
  - name: orders
    sql_table: public.orders
```

## Best Practices

1. **Prefer sql_table** when selecting all columns from a single table
2. **Use subqueries** for complex joins or filtering at the cube level
3. **Avoid aggregations** in the base SQL — let measures handle that

## See Also

- cubes
- cubes.data-source
- syntax.references
