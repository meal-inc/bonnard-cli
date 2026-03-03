# Dimension Types

> Reference for all 6 dimension types in Bonnard: string, number, boolean, time, geo, and json. Each type determines how the dimension is stored, indexed, and queried.

## Overview

Dimensions define the attributes used to group and filter data. Choose the appropriate type based on the data characteristics.

## Dimension Types

### string
Text values for categorization.

```yaml
- name: status
  type: string
  sql: status

- name: full_name
  type: string
  sql: "CONCAT(first_name, ' ', last_name)"
```

### number
Numeric values (not aggregated).

```yaml
- name: quantity
  type: number
  sql: quantity

- name: price
  type: number
  sql: unit_price
```

### boolean
True/false values.

```yaml
- name: is_active
  type: boolean
  sql: is_active

- name: has_orders
  type: boolean
  sql: "order_count > 0"
```

### time
Date and timestamp values (enables time-based analysis).

```yaml
- name: created_at
  type: time
  sql: created_at

- name: order_date
  type: time
  sql: DATE(ordered_at)
```

### geo
Geographic coordinates (latitude/longitude).

```yaml
- name: location
  type: geo
  latitude:
    sql: lat
  longitude:
    sql: lng
```

### switch
Dimension with predefined set of values.

```yaml
- name: status_label
  type: switch
  sql: status
  case:
    when:
      - sql: "{CUBE}.status = 'active'"
        label: Active
      - sql: "{CUBE}.status = 'inactive'"
        label: Inactive
    else:
      label: Unknown
```

## Type Selection Guide

| Data | Type | Example |
|------|------|---------|
| Categories, names, IDs | `string` | status, country, user_id |
| Prices, quantities | `number` | price, quantity, score |
| Flags, toggles | `boolean` | is_active, has_subscription |
| Dates, timestamps | `time` | created_at, order_date |
| Coordinates | `geo` | location, delivery_point |
| Enumerated values | `switch` | status_label, tier_name |

## See Also

- cubes.dimensions
- cubes.dimensions.primary-key
- cubes.dimensions.time
