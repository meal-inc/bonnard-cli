# REST API

> Query your deployed semantic layer using the Bonnard REST API. Send JSON query objects or SQL strings to retrieve measures and dimensions with filtering, grouping, and time ranges.

## Overview

After deploying with `bon deploy`, you can query the semantic layer using `bon query`. This tests that your cubes and views work correctly and returns data from your warehouse through Bonnard.

## Query Formats

Bonnard supports two query formats:

### JSON Format (Default)

The JSON format uses the REST API structure:

```bash
bon query '{"measures": ["orders.count"]}'

bon query '{
  "measures": ["orders.total_revenue"],
  "dimensions": ["orders.status"],
  "filters": [{
    "member": "orders.created_at",
    "operator": "inDateRange",
    "values": ["2024-01-01", "2024-12-31"]
  }]
}'
```

**JSON Query Properties:**

| Property | Description |
|----------|-------------|
| `measures` | Array of measures to calculate (e.g., `["orders.count"]`) |
| `dimensions` | Array of dimensions to group by (e.g., `["orders.status"]`) |
| `filters` | Array of filter objects |
| `timeDimensions` | Time-based grouping with granularity |
| `segments` | Named filters defined in cubes |
| `limit` | Max rows to return |
| `offset` | Skip rows (pagination) |
| `order` | Sort specification |

**Filter Operators:**

| Operator | Use Case |
|----------|----------|
| `equals`, `notEquals` | Exact match |
| `contains`, `notContains` | String contains |
| `startsWith`, `endsWith` | String prefix/suffix |
| `gt`, `gte`, `lt`, `lte` | Numeric comparison |
| `inDateRange`, `beforeDate`, `afterDate` | Time filtering |
| `set`, `notSet` | NULL checks |

### SQL Format

The SQL format uses the SQL API, where cubes are tables:

```bash
bon query --sql "SELECT status, MEASURE(count) FROM orders GROUP BY 1"

bon query --sql "SELECT
  city,
  MEASURE(total_revenue),
  MEASURE(avg_order_value)
FROM orders
WHERE status = 'completed'
GROUP BY 1
ORDER BY 2 DESC
LIMIT 10"
```

**SQL Syntax Rules:**

1. **Cubes/views are tables** — `FROM orders` references the `orders` cube
2. **Dimensions are columns** — Include in `SELECT` and `GROUP BY`
3. **Measures use `MEASURE()`** — Or matching aggregates (`SUM`, `COUNT`, etc.)
4. **Segments are boolean** — Filter with `WHERE is_completed IS TRUE`

**Examples:**

```sql
-- Count orders by status
SELECT status, MEASURE(count) FROM orders GROUP BY 1

-- Revenue by city with filter
SELECT city, SUM(amount) FROM orders WHERE status = 'shipped' GROUP BY 1

-- Using time dimension with granularity
SELECT DATE_TRUNC('month', created_at), MEASURE(total_revenue)
FROM orders
GROUP BY 1
ORDER BY 1
```

## CLI Usage

```bash
# JSON format (default)
bon query '{"measures": ["orders.count"]}'

# SQL format
bon query --sql "SELECT MEASURE(count) FROM orders"

# Limit rows
bon query '{"measures": ["orders.count"], "dimensions": ["orders.city"]}' --limit 10

# JSON output (instead of table)
bon query '{"measures": ["orders.count"]}' --format json
```

## Output Formats

### Table Format (Default)

```
┌─────────┬───────────────┐
│ status  │ orders.count  │
├─────────┼───────────────┤
│ pending │ 42            │
│ shipped │ 156           │
│ done    │ 892           │
└─────────┴───────────────┘
```

### JSON Format

```bash
bon query '{"measures": ["orders.count"]}' --format json
```

```json
[
  { "orders.status": "pending", "orders.count": 42 },
  { "orders.status": "shipped", "orders.count": 156 },
  { "orders.status": "done", "orders.count": 892 }
]
```

## Common Patterns

### Time Series Analysis

```bash
bon query '{
  "measures": ["orders.total_revenue"],
  "timeDimensions": [{
    "dimension": "orders.created_at",
    "granularity": "month",
    "dateRange": ["2024-01-01", "2024-12-31"]
  }]
}'
```

### Filtering by Dimension

```bash
bon query '{
  "measures": ["orders.count"],
  "dimensions": ["orders.city"],
  "filters": [{
    "member": "orders.status",
    "operator": "equals",
    "values": ["completed"]
  }]
}'
```

### Multiple Measures

```bash
bon query '{
  "measures": ["orders.count", "orders.total_revenue", "orders.avg_order_value"],
  "dimensions": ["orders.category"]
}'
```

## Error Handling

### Common Errors

**"Projection references non-aggregate values"**
- All dimensions must be in `GROUP BY`
- All measures must use `MEASURE()` or matching aggregate

**"Cube not found"**
- Check cube name matches deployed cube
- Run `bon deploy` if cubes changed

**"Not logged in"**
- Run `bon login` first

## See Also

- [cli.deploy](cli.deploy) - Deploy before querying
- [cubes.measures](cubes.measures) - Define measures
- [cubes.dimensions](cubes.dimensions) - Define dimensions
- [views](views) - Create focused query interfaces
