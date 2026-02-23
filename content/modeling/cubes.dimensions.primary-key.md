# Primary Key

> The primary_key property marks a dimension as the unique identifier for a cube. Primary keys are required for count_distinct measures and for establishing correct join relationships.

## Overview

The `primary_key` property identifies the dimension that uniquely identifies each row. This is required for `count_distinct` measures and joins to work correctly.

## Example

```yaml
cubes:
  - name: users
    sql: SELECT * FROM users

    dimensions:
      - name: id
        type: number
        sql: id
        primary_key: true

      - name: email
        type: string
        sql: email
```

## Why It Matters

### Enables count_distinct

Without a primary key, count_distinct may produce incorrect results:

```yaml
measures:
  - name: unique_users
    type: count_distinct
    sql: "{users.id}"  # Requires primary_key on users.id
```

### Required for Joins

Primary keys are required to correctly join data:

```yaml
cubes:
  - name: orders
    sql: SELECT * FROM orders

    dimensions:
      - name: id
        type: number
        sql: id
        primary_key: true

    joins:
      - name: users
        relationship: many_to_one
        sql: "{CUBE}.user_id = {users.id}"
```

### Affects Pre-aggregations

Primary keys determine how pre-aggregations handle duplicates.

## Rules

1. **At least one per cube** — required for joins and count_distinct to work
2. **Composite keys supported** — multiple dimensions can be marked as primary key
3. **Must be unique** — the combination of primary key values should not repeat
4. **Usually numeric** — but can be string (UUID, etc.)
5. **Auto-hides from API** — primary key dimensions default to `public: false`

## Common Patterns

### Auto-increment ID

```yaml
- name: id
  type: number
  sql: id
  primary_key: true
```

### UUID

```yaml
- name: id
  type: string
  sql: id
  primary_key: true
```

### Composite Key (use concat)

```yaml
- name: composite_id
  type: string
  sql: "CONCAT(order_id, '-', line_item_id)"
  primary_key: true
```

## See Also

- cubes.dimensions
- cubes.dimensions.types
- cubes.joins
