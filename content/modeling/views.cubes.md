# View Cubes

> The cubes property in a view selects which cubes and members to expose. Pick specific measures and dimensions from multiple cubes to create focused, consumer-ready interfaces.

## Overview

The `cubes` property defines which cubes are combined in a view and which of their members (measures, dimensions, segments) are exposed. This is the core mechanism for building focused analytical interfaces.

## Example

```yaml
views:
  - name: orders_overview
    cubes:
      - join_path: orders
        includes:
          - count
          - total_revenue
          - status
          - created_at

      - join_path: orders.users
        includes:
          - name
          - email
```

## Properties

### join_path (required)

Specifies which cube to include and how to reach it via joins:

```yaml
cubes:
  # Direct cube reference
  - join_path: orders

  # Joined cube (orders -> users)
  - join_path: orders.users

  # Multi-hop join (orders -> users -> countries)
  - join_path: orders.users.countries
```

### includes

List specific members to expose:

```yaml
- join_path: orders
  includes:
    - count           # measure
    - total_revenue   # measure
    - status          # dimension
    - created_at      # dimension
```

Include all members with `"*"`:

```yaml
- join_path: orders
  includes: "*"
```

### excludes

Remove specific members when using `includes: "*"`:

```yaml
- join_path: orders
  includes: "*"
  excludes:
    - internal_notes
    - debug_flag
```

### prefix

Add cube name prefix to avoid naming collisions:

```yaml
- join_path: orders
  prefix: true
  includes:
    - count  # Becomes "orders_count" in the view
```

## Member Customization

Override member properties when including:

```yaml
- join_path: orders
  includes:
    - name: count
      alias: order_count
      title: "Total Orders"
      description: "Number of orders placed"

    - name: total_revenue
      alias: revenue
      format: currency
```

### Customization Options

| Option | Description |
|--------|-------------|
| `alias` | Rename the member in this view |
| `title` | Override display name |
| `description` | Override description |
| `format` | Override data format |
| `meta` | Override metadata |

## Common Patterns

### Focused Dashboard View

```yaml
views:
  - name: sales_dashboard
    cubes:
      - join_path: orders
        includes:
          - count
          - total_revenue
          - average_order_value
          - created_at

      - join_path: orders.products
        includes:
          - name: name
            alias: product_name
          - category
```

### Multi-Cube Aggregation

```yaml
views:
  - name: customer_360
    cubes:
      - join_path: users
        includes: "*"
        excludes: [password_hash, api_key]

      - join_path: users.orders
        includes:
          - count
          - total_revenue

      - join_path: users.support_tickets
        includes:
          - count
```

## See Also

- views
- views.includes
- cubes.joins
