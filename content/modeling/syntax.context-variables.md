# Context Variables

> Context variables give you access to runtime information inside SQL expressions. Use them to implement row-level security, multi-tenancy, dynamic date ranges, and environment-specific logic.

## Overview

Context variables provide access to runtime information within cube definitions. Use them for dynamic SQL generation, filter handling, and security context.

## Context Variables

### {CUBE}

References the current cube without repeating its name:

```yaml
cubes:
  - name: orders
    dimensions:
      - name: status
        type: string
        sql: "{CUBE}.status"  # Same as "{orders}.status"

    measures:
      - name: completed_count
        type: count
        filters:
          - sql: "{CUBE}.status = 'completed'"
```

Essential when using `extends` so SQL works in child cubes.

### FILTER_PARAMS

Access filter values from queries during SQL generation:

```yaml
cubes:
  - name: orders
    sql: >
      SELECT * FROM orders
      WHERE {FILTER_PARAMS.orders.created_at.filter('created_at')}
```

Useful for:
- Partition pruning in data warehouses
- Predicate pushdown optimization
- Dynamic table selection

Syntax: `{FILTER_PARAMS.cube_name.member_name.filter('sql_expression')}`

### FILTER_GROUP

Wraps multiple FILTER_PARAMS when combining with OR:

```yaml
sql: >
  SELECT * FROM orders
  WHERE {FILTER_GROUP(
    FILTER_PARAMS.orders.status.filter('status'),
    FILTER_PARAMS.orders.type.filter('type')
  )}
```

Prevents incorrect SQL when filters use OR logic.

### COMPILE_CONTEXT

Evaluated once per deployment context. Access via Jinja syntax:

```yaml
cubes:
  - name: orders
    sql_table: "{{ COMPILE_CONTEXT.schema }}.orders"

    public: "{{ 'true' if COMPILE_CONTEXT.role == 'admin' else 'false' }}"
```

Common uses:
- Multi-tenant table names
- Environment-specific configuration
- Role-based visibility

### SQL_UTILS

Helper functions for SQL generation:

```yaml
dimensions:
  - name: created_at_local
    type: time
    sql: "{SQL_UTILS.convertTz('created_at', 'UTC', 'America/New_York')}"
```

**convertTz()**: Converts timestamps between timezones.

Note: Don't use SQL_UTILS dimensions as `timeDimensions` in queries to avoid double conversion.

## Examples

### Partition Filtering (Snowflake/BigQuery)

```yaml
cubes:
  - name: events
    sql: >
      SELECT * FROM events
      WHERE {FILTER_PARAMS.events.timestamp.filter('timestamp')}
```

When querying with a date filter, this pushes the filter to the partition column for efficient pruning.

### Multi-Tenant Tables

```yaml
cubes:
  - name: orders
    sql_table: "{{ COMPILE_CONTEXT.tenant_schema }}.orders"
```

### Dynamic Visibility

```yaml
cubes:
  - name: sensitive_data
    public: "{{ 'true' if COMPILE_CONTEXT.user_role in ['admin', 'analyst'] else 'false' }}"
```

### Timezone Conversion

```yaml
dimensions:
  - name: created_at_et
    type: time
    sql: "{SQL_UTILS.convertTz('created_at', 'UTC', 'America/New_York')}"
    title: "Created At (ET)"
```

## Best Practices

1. **Use {CUBE}** in extendable cubes — never hardcode cube names
2. **Use FILTER_PARAMS** for partition pruning — improves query performance
3. **Use COMPILE_CONTEXT** for deployment config — not for per-query logic
4. **Test filter pushdown** — verify FILTER_PARAMS generates expected SQL

## Deprecated: SECURITY_CONTEXT

`SECURITY_CONTEXT` is deprecated. Use `query_rewrite` for security filtering instead.

## See Also

- syntax
- syntax.references
- cubes.extends
