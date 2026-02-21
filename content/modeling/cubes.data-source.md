# Data Source

> The data_source property connects cubes to specific data warehouse connections. Use it when your semantic layer spans multiple databases like PostgreSQL, Snowflake, or BigQuery.

## Overview

The `data_source` property specifies which configured data source a cube should use. This enables multi-database architectures where different cubes query different warehouses.

## Example

```yaml
cubes:
  - name: orders
    sql_table: public.orders
    data_source: default

  - name: analytics_events
    sql_table: events
    data_source: clickhouse_analytics
```

## Syntax

### Single Data Source

```yaml
cubes:
  - name: users
    sql_table: users
    data_source: postgres_main
```

### Default Behavior

If `data_source` is omitted, the cube uses the `default` data source:

```yaml
cubes:
  - name: orders
    sql_table: orders
    # Uses "default" data source
```

## Multi-Database Architecture

Different cubes can query different databases:

```yaml
cubes:
  # Transactional data from Postgres
  - name: orders
    sql_table: public.orders
    data_source: postgres

  # Analytics events from ClickHouse
  - name: events
    sql_table: analytics.events
    data_source: clickhouse

  # ML features from Snowflake
  - name: predictions
    sql_table: ml.predictions
    data_source: snowflake
```

## Data Source Configuration

Data sources are configured in your Bonnard project:

```yaml
# .bon/datasources.yaml
datasources:
  - name: default
    type: postgres
    host: localhost
    database: mydb

  - name: analytics
    type: snowflake
    account: myaccount
    database: ANALYTICS
```

## Cross-Database Joins

Cubes from different data sources cannot be directly joined. Use views or pre-aggregations to combine data from multiple sources.

## See Also

- cubes
- cubes.sql
- cli.deploy
