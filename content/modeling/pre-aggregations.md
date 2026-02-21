# Pre-Aggregations

> Pre-aggregations materialize query results into summary tables for faster analytics performance. Define rollups to speed up dashboards, AI agent queries, and API responses.

## Overview

Pre-aggregations are materialized tables that store pre-computed query results. They dramatically improve query performance by avoiding repeated aggregation of raw data.

## Example

```yaml
cubes:
  - name: orders
    sql_table: orders

    measures:
      - name: count
        type: count

      - name: total_revenue
        type: sum
        sql: amount

    dimensions:
      - name: status
        type: string
        sql: status

      - name: created_at
        type: time
        sql: created_at

    pre_aggregations:
      - name: orders_by_day
        measures:
          - count
          - total_revenue
        dimensions:
          - status
        time_dimension: created_at
        granularity: day
```

## Pre-Aggregation Types

### rollup (default)
Summarizes data into aggregated form. Most effective for performance.

```yaml
pre_aggregations:
  - name: main
    type: rollup
    measures:
      - count
      - total_revenue
    dimensions:
      - status
    time_dimension: created_at
    granularity: day
```

### original_sql
Persists the cube's SQL query without aggregation. Useful for complex SQL.

```yaml
pre_aggregations:
  - name: base_data
    type: original_sql
```

### rollup_join
Joins pre-aggregations from different data sources (preview feature).

### rollup_lambda
Combines real-time and historical data (advanced).

## Key Properties

| Property | Description |
|----------|-------------|
| `name` | Unique identifier |
| `type` | `rollup`, `original_sql`, `rollup_join`, `rollup_lambda` |
| `measures` | Measures to include |
| `dimensions` | Dimensions to include |
| `time_dimension` | Time dimension for partitioning |
| `granularity` | Time granularity: `day`, `week`, `month`, etc. |
| `partition_granularity` | How to partition data |
| `refresh_key` | When to refresh |
| `scheduled_refresh` | Auto-refresh (default: true) |

## Additive vs Non-Additive

**Additive measures** (count, sum, min, max) can be combined from pre-aggregated data:

```yaml
# These work efficiently with rollups
measures:
  - name: count
    type: count
  - name: total
    type: sum
    sql: amount
```

**Non-additive measures** (count_distinct, avg) may require the original data:

```yaml
# count_distinct needs special handling
measures:
  - name: unique_users
    type: count_distinct
    sql: user_id
```

## Best Practices

1. **Start with common queries** — pre-aggregate your most frequent access patterns
2. **Include all needed members** — queries must match the pre-aggregation exactly
3. **Use partitioning** — for large datasets, partition by time
4. **Monitor refresh** — ensure data stays current

## See Also

- pre-aggregations.rollup
- cubes.measures
- cubes.dimensions.time
