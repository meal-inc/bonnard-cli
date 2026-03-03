# Refresh Key

> The refresh_key property controls when cube data is refreshed in the cache. Define time-based or query-based refresh strategies to balance data freshness with query performance.

## Overview

The `refresh_key` property determines when the cache should be invalidated. Use it to ensure queries return fresh data while optimizing performance.

## Example

```yaml
cubes:
  - name: orders
    sql_table: orders

    refresh_key:
      every: 1 hour

    measures:
      - name: count
        type: count
```

## Refresh Strategies

### Time-Based Refresh

Refresh at regular intervals:

```yaml
refresh_key:
  every: 1 hour
```

```yaml
refresh_key:
  every: 10 minute
```

```yaml
refresh_key:
  every: 1 day
```

### SQL-Based Refresh

Refresh when a SQL query returns a different value:

```yaml
refresh_key:
  sql: SELECT MAX(updated_at) FROM orders
```

This is efficient for append-only or update-tracked tables.

### Combined Approach

Use SQL with a time-based check interval:

```yaml
refresh_key:
  sql: SELECT MAX(updated_at) FROM orders
  every: 5 minute
```

The SQL runs every 5 minutes; cache refreshes only when the result changes.

## Syntax

### every

Time interval format: `<number> <unit>`

| Unit | Examples |
|------|----------|
| `second` | `30 second` |
| `minute` | `5 minute`, `10 minute` |
| `hour` | `1 hour`, `6 hour` |
| `day` | `1 day` |
| `week` | `1 week` |

### sql

Any SQL that returns a single value. Common patterns:

```yaml
# Max timestamp (for append-only data)
sql: SELECT MAX(created_at) FROM orders

# Row count (for small tables)
sql: SELECT COUNT(*) FROM orders

# Checksum (for frequently updated data)
sql: SELECT CHECKSUM_AGG(CHECKSUM(*)) FROM orders
```

## Common Patterns

### Real-Time Data

```yaml
refresh_key:
  every: 1 minute
```

### Daily Batch Data

```yaml
refresh_key:
  every: 1 day
  sql: SELECT MAX(load_date) FROM daily_snapshot
```

### Event Stream Data

```yaml
refresh_key:
  sql: SELECT MAX(event_id) FROM events
  every: 30 second
```

### Slowly Changing Data

```yaml
refresh_key:
  every: 6 hour
```

## Pre-Aggregation Refresh

Pre-aggregations have their own refresh_key:

```yaml
pre_aggregations:
  - name: main
    measures:
      - count
    refresh_key:
      every: 1 hour
```

## Best Practices

1. **Match data freshness needs** — don't refresh more often than necessary
2. **Use SQL-based refresh** — for tables with update timestamps
3. **Consider pre-aggregations** — they have separate refresh cycles
4. **Monitor performance** — frequent refreshes impact query latency

## See Also

- cubes
- pre-aggregations
- pre-aggregations.rollup
