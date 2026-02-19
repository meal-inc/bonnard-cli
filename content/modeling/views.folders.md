# View Folders

> Folders organize a view's measures and dimensions into logical groups. Use folders to structure large views so consumers can navigate fields by category instead of a flat list.

## Overview

Folders organize view members into logical categories, making large views easier to navigate. They appear as hierarchical groupings in BI tools and dashboards.

## Example

```yaml
views:
  - name: sales_analytics
    cubes:
      - join_path: orders
        includes: "*"

    folders:
      - name: Revenue Metrics
        members:
          - total_revenue
          - average_order_value
          - revenue_growth

      - name: Volume Metrics
        members:
          - count
          - items_sold

      - name: Time
        members:
          - created_at
          - shipped_at
```

## Syntax

### Basic Folder

```yaml
folders:
  - name: "Folder Name"
    members:
      - member_one
      - member_two
```

### Nested Folders

```yaml
folders:
  - name: Metrics
    folders:
      - name: Revenue
        members:
          - total_revenue
          - net_revenue

      - name: Volume
        members:
          - count
          - quantity
```

## Properties

| Property | Description |
|----------|-------------|
| `name` | Display name for the folder |
| `members` | List of member names to include |
| `folders` | Nested sub-folders |

## Common Patterns

### By Data Type

```yaml
folders:
  - name: Measures
    members:
      - count
      - total_revenue
      - average_order_value

  - name: Dimensions
    members:
      - status
      - category
      - region

  - name: Time
    members:
      - created_at
      - updated_at
```

### By Business Domain

```yaml
folders:
  - name: Customer Info
    members:
      - customer_name
      - customer_email
      - customer_segment

  - name: Order Details
    members:
      - order_status
      - order_total
      - items_count

  - name: Shipping
    members:
      - shipped_at
      - delivery_status
      - shipping_cost
```

### By Analysis Type

```yaml
folders:
  - name: KPIs
    members:
      - total_revenue
      - order_count
      - conversion_rate

  - name: Trends
    members:
      - created_at
      - revenue_growth
      - yoy_change

  - name: Breakdowns
    members:
      - category
      - region
      - channel
```

## Best Practices

1. **Keep folders shallow** — avoid deep nesting
2. **Use clear names** — business-friendly labels
3. **Group logically** — related members together
4. **Limit folder count** — 3-7 folders per view

## See Also

- views
- views.cubes
- views.includes
