# Rollups

> Rollups are pre-aggregation tables that store summarized data for high-performance queries. Define which measures and dimensions to materialize, and Bonnard generates and refreshes them automatically.

## Overview

Rollup pre-aggregations summarize raw data into aggregated tables, grouped by specified dimensions. They're the most effective way to improve query performance.

## Example

```yaml
pre_aggregations:
  - name: orders_daily
    type: rollup
    measures:
      - count
      - total_revenue
    dimensions:
      - status
      - category
    time_dimension: created_at
    granularity: day
    partition_granularity: month
```

## Time-Based Rollups

### Basic Time Rollup

```yaml
- name: daily_orders
  measures:
    - count
  time_dimension: created_at
  granularity: day
```

### Partitioned Rollup

Partition large datasets for efficient refreshes:

```yaml
- name: orders_monthly_partitioned
  measures:
    - count
    - total_revenue
  time_dimension: created_at
  granularity: day
  partition_granularity: month
```

### Granularity Options

| Granularity | Description |
|-------------|-------------|
| `second` | Per-second aggregation |
| `minute` | Per-minute aggregation |
| `hour` | Hourly aggregation |
| `day` | Daily aggregation |
| `week` | Weekly aggregation |
| `month` | Monthly aggregation |
| `quarter` | Quarterly aggregation |
| `year` | Yearly aggregation |

## Refresh Strategies

### Time-Based Refresh

```yaml
- name: orders_hourly
  measures:
    - count
  time_dimension: created_at
  granularity: hour
  refresh_key:
    every: 1 hour
```

### Incremental Refresh

Only refresh recent partitions:

```yaml
- name: orders_incremental
  measures:
    - count
    - total_revenue
  time_dimension: created_at
  granularity: day
  partition_granularity: month
  refresh_key:
    every: 1 day
    incremental: true
    update_window: 7 day
```

### SQL-Based Refresh

Refresh when data changes:

```yaml
- name: orders_on_change
  measures:
    - count
  refresh_key:
    sql: SELECT MAX(updated_at) FROM orders
```

## Indexes

Add indexes for better query performance:

```yaml
- name: orders_by_status
  measures:
    - count
  dimensions:
    - status
    - category
  indexes:
    - name: status_idx
      columns:
        - status
```

## Query Matching

A query uses a rollup if:
1. All requested measures are in the rollup
2. All requested dimensions are in the rollup
3. Time dimension granularity is compatible
4. Filters match the rollup's data

```yaml
# This rollup...
- name: orders_daily
  measures:
    - count
    - total_revenue
  dimensions:
    - status
  time_dimension: created_at
  granularity: day

# ...matches queries like:
# - orders.count by day
# - orders.total_revenue by status by week (day rolls up to week)
# - orders.count where status = 'completed' by month
```

## Best Practices

1. **Match your queries** — design rollups around common access patterns
2. **Use incremental refresh** — for large time-series data
3. **Partition wisely** — monthly partitions work well for most cases
4. **Add indexes** — for high-cardinality dimension filters

## See Also

- pre-aggregations
- cubes.dimensions.time
- cubes.measures
