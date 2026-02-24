# View Includes

> The includes and excludes properties control which cube members appear in a view. Include everything from a cube and selectively exclude fields, or cherry-pick specific members.

## Overview

The `includes` and `excludes` properties control which measures, dimensions, and segments from a cube are exposed in a view. This enables creating focused interfaces that show only relevant data.

## Basic Syntax

### Include Specific Members

```yaml
- join_path: orders
  includes:
    - count
    - total_revenue
    - status
```

### Include All Members

```yaml
- join_path: orders
  includes: "*"
```

### Exclude Specific Members

```yaml
- join_path: orders
  includes: "*"
  excludes:
    - internal_id
    - debug_flag
```

## Member Types

All cube member types can be included:

```yaml
- join_path: orders
  includes:
    # Measures
    - count
    - total_revenue
    - average_order_value

    # Dimensions
    - status
    - created_at
    - customer_email

    # Segments
    - completed
    - high_value
```

## Renaming with Alias

Rename members to avoid collisions or improve clarity:

```yaml
- join_path: orders
  includes:
    - name: count
      alias: order_count

    - name: created_at
      alias: order_date
```

## Prefix Mode

Automatically prefix all members with cube name:

```yaml
- join_path: orders
  prefix: true
  includes: "*"
  # count -> orders_count
  # status -> orders_status
```

Custom prefix:

```yaml
- join_path: orders
  prefix: true
  includes:
    - name: count
      alias: total_orders  # Override automatic prefix
```

## Combining Multiple Cubes

When including the same member name from multiple cubes, use aliases:

```yaml
views:
  - name: combined_metrics
    cubes:
      - join_path: orders
        includes:
          - name: count
            alias: order_count

      - join_path: users
        includes:
          - name: count
            alias: user_count
```

## Wildcard Patterns

Use `"*"` to include all, then exclude what you don't need:

```yaml
- join_path: users
  includes: "*"
  excludes:
    - password_hash
    - api_secret
    - internal_notes
```

## Best Practices

1. **Be explicit** — list specific members rather than using `"*"` in production
2. **Use aliases** — make member names clear and consistent
3. **Exclude sensitive data** — never expose passwords, keys, or PII
4. **Document with descriptions** — override descriptions for clarity

## See Also

- views
- views.cubes
- views.folders
