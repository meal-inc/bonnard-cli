# Views

> Views compose measures and dimensions from multiple cubes into focused, consumer-friendly interfaces. Use views to expose curated data to BI tools, AI agents, and applications.

## Overview

Views are facades that expose selected measures and dimensions from one or more cubes. They define which data is available to consumers, control join paths, and organize members into logical groups.

**Views should represent how a team thinks about data**, not mirror your warehouse tables. Name views by what they answer (`sales_pipeline`, `customer_insights`) rather than what table they wrap (`orders_view`, `users_view`). Build as many views as your audiences need, but make each one purposeful — governance policies control which views each user or role can access.

## Example

```yaml
views:
  - name: sales_analytics
    description: >-
      Sales team view — order revenue, counts, and status breakdowns with
      customer details. Default view for revenue and order questions. Use the
      status dimension (values: pending, completed, cancelled) to filter.
      For customer-level analysis, use customer_insights instead.
    cubes:
      - join_path: orders
        includes:
          - count
          - total_revenue
          - status
          - created_at

      - join_path: orders.users
        includes:
          - name: name
            alias: customer_name
          - email
```

## Core Properties

| Property | Required | Description |
|----------|----------|-------------|
| `name` | Yes | Unique identifier in snake_case |
| `cubes` | Yes | List of cubes and their exposed members |
| `folders` | No | Organize members into groups |
| `title` | No | Human-readable display name |
| `description` | No | Documentation for consumers |
| `public` | No | Whether exposed in API (default: true) |

## Why Use Views?

### 1. Curate for Audiences

Expose only the measures and dimensions a specific audience needs. A single `orders` cube might contribute to a `sales_analytics` view (revenue by status), a `management_kpis` view (high-level totals), and a `finance_reporting` view (invoice amounts). Each view shows different slices of the same data.

```yaml
views:
  - name: sales_analytics
    cubes:
      - join_path: orders
        includes:
          - count
          - total_revenue
        excludes:
          - internal_notes
          - debug_flags
```

### 2. Control Join Paths

Define explicit paths through your data model:

```yaml
views:
  - name: customer_orders
    cubes:
      # Explicit path: orders -> users
      - join_path: orders.users
        includes:
          - name
          - email
```

### 3. Rename and Reorganize

Create user-friendly names and groupings:

```yaml
views:
  - name: analytics
    cubes:
      - join_path: orders
        includes:
          - name: count
            alias: order_count
            title: "Total Orders"

          - name: total_revenue
            alias: revenue
            title: "Revenue"
```

### 4. Govern Data Access

Control what different consumers can see:

```yaml
views:
  - name: public_metrics
    public: true
    cubes:
      - join_path: orders
        includes:
          - count
          - total_revenue

  - name: internal_metrics
    public: false  # Only for internal use
    cubes:
      - join_path: orders
        includes: "*"
```

## File Organization

Store views in the `bonnard/views/` directory:

```
bonnard/views/
├── orders_overview.yaml
├── sales_dashboard.yaml
└── customer_360.yaml
```

## Best Practices

1. **Name views by audience/use case** — `sales_pipeline` not `opportunities_view`. Views represent how teams think about data, not your warehouse schema.
2. **Write descriptions that help AI agents choose** — Lead with scope ("Sales team — revenue, order counts..."), cross-reference related views ("For customer demographics, use customer_insights instead"), and include key dimension values.
3. **Combine multiple cubes** — A view should pull from whichever cubes answer a team's questions. Don't limit views to one cube each.
4. **Be explicit with includes** — list members rather than using "*"
5. **Alias for clarity** — rename members when needed
6. **Organize with folders** — group related members together

## See Also

- views.cubes
- views.includes
- views.folders
- cubes.joins
