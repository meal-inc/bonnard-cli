# Extends

> Extends lets you inherit measures, dimensions, and joins from other cubes to reduce duplication. Build base cubes with shared logic and extend them for specific use cases.

## Overview

The `extends` property allows a cube to inherit measures, dimensions, segments, and joins from another cube. This promotes code reusability and keeps your data model DRY.

## Example

```yaml
cubes:
  # Base cube with shared members
  - name: base_events
    sql_table: events

    measures:
      - name: count
        type: count

    dimensions:
      - name: id
        type: number
        sql: "{CUBE}.id"
        primary_key: true

      - name: created_at
        type: time
        sql: "{CUBE}.created_at"

  # Child cube extends base
  - name: page_views
    extends: base_events
    sql_table: page_view_events

    dimensions:
      - name: page_url
        type: string
        sql: "{CUBE}.url"

  # Another child cube
  - name: purchases
    extends: base_events
    sql_table: purchase_events

    measures:
      - name: total_revenue
        type: sum
        sql: "{CUBE}.amount"
```

## How It Works

When a cube extends another:

1. **Measures merge** — child gets all parent measures plus its own
2. **Dimensions merge** — child gets all parent dimensions plus its own
3. **Segments merge** — child gets all parent segments plus its own
4. **Joins merge** — child gets all parent joins plus its own

## Important: Use {CUBE}

Always use `{CUBE}` when referencing columns in extendable cubes:

```yaml
# Good - works in parent and child cubes
dimensions:
  - name: created_at
    type: time
    sql: "{CUBE}.created_at"

# Bad - breaks in child cubes
dimensions:
  - name: created_at
    type: time
    sql: "{base_events}.created_at"
```

## Overriding Members

Child cubes can override parent members by defining them with the same name:

```yaml
cubes:
  - name: base_orders
    measures:
      - name: count
        type: count
        description: "Total orders"

  - name: completed_orders
    extends: base_orders
    measures:
      - name: count
        type: count
        description: "Completed orders only"
        filters:
          - sql: "{CUBE}.status = 'completed'"
```

## Common Patterns

### Event Tables

```yaml
cubes:
  - name: base_event
    dimensions:
      - name: id
        sql: "{CUBE}.id"
        primary_key: true
      - name: user_id
        sql: "{CUBE}.user_id"
      - name: timestamp
        type: time
        sql: "{CUBE}.timestamp"

  - name: clicks
    extends: base_event
    sql_table: click_events

  - name: impressions
    extends: base_event
    sql_table: impression_events
```

### Multi-Tenant Tables

```yaml
cubes:
  - name: base_orders
    sql: "SELECT * FROM orders WHERE tenant_id = '{{COMPILE_CONTEXT.tenant}}'"

  - name: tenant_orders
    extends: base_orders
```

## Best Practices

1. **Use {CUBE} everywhere** — never hardcode cube names in SQL
2. **Keep base cubes focused** — only include truly shared members
3. **Don't over-extend** — deep inheritance chains are hard to maintain
4. **Document inheritance** — make it clear which cubes extend others

## See Also

- cubes
- syntax.references
- syntax.context-variables
