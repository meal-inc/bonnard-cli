# Query

> Execute queries against the deployed semantic layer from the CLI. Supports JSON queries and SQL mode.

## Overview

The `bon query` command runs queries against your deployed cubes and views. It sends the query to the Bonnard API, which handles retries and timeouts, and returns the results in a tabular or JSON format.

## Usage

```bash
bon query '<json>'
bon query --sql "<sql>"
```

## JSON Queries

JSON queries use the Cube query format with `measures`, `dimensions`, `timeDimensions`, and `filters`.

### Measures only

```bash
bon query '{"measures": ["orders.count"]}'
```

### Measures + dimensions

```bash
bon query '{"measures": ["orders.total_revenue"], "dimensions": ["orders.status"]}'
```

### Time dimensions

Use `timeDimensions` to group by time and optionally filter by date range:

```bash
bon query '{"measures": ["orders.count"], "timeDimensions": [{"dimension": "orders.created_at", "granularity": "month"}]}'
```

With a date range filter:

```bash
bon query '{"measures": ["orders.count"], "timeDimensions": [{"dimension": "orders.created_at", "granularity": "month", "dateRange": ["2024-01-01", "2024-12-31"]}]}'
```

### Filters

Filter by dimension values using `member`, `operator`, and `values`:

```bash
bon query '{"measures": ["orders.count"], "filters": [{"member": "orders.status", "operator": "equals", "values": ["completed"]}]}'
```

#### Filter operators

| Operator | Description | Example values |
|----------|-------------|----------------|
| `equals` | Exact match | `["completed"]` |
| `notEquals` | Not equal | `["cancelled"]` |
| `contains` | String contains | `["premium"]` |
| `notContains` | String doesn't contain | `["test"]` |
| `gt` | Greater than | `["100"]` |
| `gte` | Greater than or equal | `["100"]` |
| `lt` | Less than | `["50"]` |
| `lte` | Less than or equal | `["50"]` |
| `set` | Value is not null | (no values needed) |
| `notSet` | Value is null | (no values needed) |
| `inDateRange` | Date within range | `["2024-01-01", "2024-12-31"]` |
| `beforeDate` | Date before | `["2024-01-01"]` |
| `afterDate` | Date after | `["2024-01-01"]` |

### Combining everything

```bash
bon query '{"measures": ["orders.count", "orders.total_revenue"], "dimensions": ["orders.status"], "timeDimensions": [{"dimension": "orders.created_at", "granularity": "month", "dateRange": ["2024-01-01", "2024-12-31"]}], "filters": [{"member": "orders.status", "operator": "equals", "values": ["completed"]}], "limit": 100}'
```

## SQL Queries

Use `--sql` to write queries in SQL instead of JSON. Wrap measures in `MEASURE()`:

```bash
bon query --sql "SELECT orders.status, MEASURE(orders.count) FROM orders GROUP BY 1"
```

With filters:

```bash
bon query --sql "SELECT orders.status, MEASURE(orders.total_revenue) FROM orders WHERE orders.status = 'completed' GROUP BY 1"
```

## Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--sql` | Use SQL mode instead of JSON | off |
| `--limit <n>` | Max rows to return | none |
| `--format <fmt>` | Output format: `toon` or `json` | `toon` |

## Output Formats

### TOON (default)

Tabular format, easy to read in the terminal:

```
bon query '{"measures": ["orders.count"], "dimensions": ["orders.status"]}'

orders.status  orders.count
─────────────  ────────────
completed      1523
processing     342
cancelled      89
```

### JSON

Machine-readable output:

```
bon query --format json '{"measures": ["orders.count"], "dimensions": ["orders.status"]}'

[
  { "orders.status": "completed", "orders.count": 1523 },
  { "orders.status": "processing", "orders.count": 342 },
  { "orders.status": "cancelled", "orders.count": 89 }
]
```

## Finding Available Fields

Before querying, use `bon schema` to discover what's available:

```bash
bon schema                  # Summary of all cubes and views
bon schema orders           # Detail view: measures, dimensions, time dimensions
bon schema --format json    # Machine-readable output
```

## Error Handling

### Invalid JSON

```
Invalid JSON query. Use --sql for SQL queries.
Example: bon query '{"measures": ["orders.count"]}'
```

### Query errors

```
Query error: "orders.nonexistent" not found
```

### Not logged in

```
Not logged in. Run `bon login` first.
```

## See Also

- cli
- cli.deploy
- rest-api
