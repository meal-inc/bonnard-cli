# Dimensions

> Dimensions define the attributes used for grouping and filtering data in your semantic layer. They map to table columns and provide the axes for slicing measures in queries.

## Overview

Dimensions are the attributes used to slice and filter your data. They answer questions like "by what?", "which ones?", and "when?". Dimensions enable grouping measures and applying filters.

## Example

```yaml
dimensions:
  - name: id
    type: number
    sql: id
    primary_key: true
    description: Unique order identifier

  - name: status
    type: string
    sql: status
    description: Order status (pending, completed, cancelled)

  - name: amount
    type: number
    sql: amount
    description: Order amount in dollars

  - name: is_active
    type: boolean
    sql: is_active
    description: Whether the order is currently active

  - name: created_at
    type: time
    sql: created_at
    description: When the order was created
```

## Required Properties

| Property | Description |
|----------|-------------|
| `name` | Unique identifier in snake_case |
| `type` | Data type (string, number, time, etc.) |
| `sql` | SQL expression for the value |

## Optional Properties

| Property | Description |
|----------|-------------|
| `primary_key` | Marks as unique identifier (required for joins) |
| `title` | Human-readable display name |
| `description` | Documentation for consumers |
| `format` | Output format hints |
| `public` | Whether exposed in API (default: true) |

## Dimension Types

### string

Text values for categorization:

```yaml
- name: status
  type: string
  sql: status

- name: full_name
  type: string
  sql: "CONCAT(first_name, ' ', last_name)"
```

### number

Numeric values (not aggregated):

```yaml
- name: quantity
  type: number
  sql: quantity

- name: unit_price
  type: number
  sql: price
```

### boolean

True/false values:

```yaml
- name: is_active
  type: boolean
  sql: is_active

- name: has_subscription
  type: boolean
  sql: "subscription_id IS NOT NULL"
```

### time

Dates and timestamps (enables time-based analysis):

```yaml
- name: created_at
  type: time
  sql: created_at

- name: order_date
  type: time
  sql: DATE(ordered_at)
```

### geo

Geographic coordinates:

```yaml
- name: location
  type: geo
  latitude:
    sql: lat
  longitude:
    sql: lng
```

### switch

Enumerated values with labels:

```yaml
- name: status_label
  type: switch
  case:
    when:
      - sql: "{CUBE}.status = 'active'"
        label: Active
      - sql: "{CUBE}.status = 'inactive'"
        label: Inactive
    else:
      label: Unknown
```

## Primary Key

Mark the unique identifier — required for joins and count_distinct:

```yaml
- name: id
  type: number
  sql: id
  primary_key: true
```

## Calculated Dimensions

Create derived attributes:

```yaml
- name: order_size
  type: string
  sql: >
    CASE
      WHEN {CUBE}.amount > 1000 THEN 'large'
      WHEN {CUBE}.amount > 100 THEN 'medium'
      ELSE 'small'
    END
```

## Best Practices

1. **Always define a primary key** — enables joins and count_distinct
2. **Use appropriate types** — time for dates, string for categories
3. **Name clearly** — `customer_email` not `email1`
4. **Document business logic** — explain calculated dimensions

## See Also

- cubes.dimensions.types
- cubes.dimensions.primary-key
- cubes.dimensions.time
- cubes.joins
