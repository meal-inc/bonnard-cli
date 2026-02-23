# Joins

> Joins connect cubes together so you can query measures and dimensions across multiple tables. Define one-to-many, many-to-one, and one-to-one relationships between cubes.

## Overview

Joins define relationships between cubes, allowing queries to combine measures and dimensions from multiple cubes. Bonnard automatically generates the appropriate SQL JOINs.

## Example

```yaml
cubes:
  - name: orders
    sql: SELECT * FROM orders

    joins:
      - name: users
        relationship: many_to_one
        sql: "{CUBE}.user_id = {users.id}"

      - name: products
        relationship: many_to_one
        sql: "{CUBE}.product_id = {products.id}"
```

## Relationship Types

### many_to_one
Many rows in this cube relate to one row in the joined cube.

```yaml
# Many orders belong to one user
- name: users
  relationship: many_to_one
  sql: "{CUBE}.user_id = {users.id}"
```

### one_to_many
One row in this cube relates to many rows in the joined cube.

```yaml
# One user has many orders
- name: orders
  relationship: one_to_many
  sql: "{CUBE}.id = {orders.user_id}"
```

### one_to_one
One row in this cube relates to exactly one row in the joined cube.

```yaml
# One user has one profile
- name: profiles
  relationship: one_to_one
  sql: "{CUBE}.id = {profiles.user_id}"
```

## Join Properties

| Property | Required | Description |
|----------|----------|-------------|
| `name` | Yes | Name of the cube to join |
| `relationship` | Yes | `many_to_one`, `one_to_many`, or `one_to_one` |
| `sql` | Yes | Join condition |

## Syntax

### {CUBE} Reference
Use `{CUBE}` to reference the current cube:

```yaml
sql: "{CUBE}.user_id = {users.id}"
```

### Referencing Joined Cube
Use `{cube_name}` to reference the joined cube:

```yaml
sql: "{CUBE}.product_id = {products.id}"
```

## Multi-hop Joins

Cubes can access data through transitive joins:

```yaml
# orders -> users -> countries
# Query can use countries.name with orders.count

cubes:
  - name: orders
    joins:
      - name: users
        relationship: many_to_one
        sql: "{CUBE}.user_id = {users.id}"

  - name: users
    joins:
      - name: countries
        relationship: many_to_one
        sql: "{CUBE}.country_id = {countries.id}"
```

## Best Practices

1. **Define joins on the "many" side** — put the join in orders, not users
2. **Use primary keys** — ensure joined cubes have `primary_key` defined
3. **Keep joins simple** — avoid complex conditions
4. **Consider views** for specific join paths

## See Also

- cubes
- cubes.dimensions.primary-key
- views
