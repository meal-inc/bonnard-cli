# Measure Format

> The format property controls how measure values are displayed to consumers. Specify currency symbols, decimal places, percentage formatting, and custom number patterns.

## Overview

The `format` property hints to BI tools how to display measure values. This affects rendering in dashboards and reports.

## Example

```yaml
measures:
  - name: total_revenue
    type: sum
    sql: amount
    format: currency

  - name: conversion_rate
    type: number
    sql: "{conversions} / NULLIF({visits}, 0)"
    format: percent

  - name: order_count
    type: count
    # No format - displays as plain number
```

## Supported Formats

| Format | Description |
|--------|-------------|
| `percent` | Percentage display (0.75 → 75%) |
| `currency` | Monetary display ($1,234.56) |
| `number` | Plain number with standard formatting |

### percent

Displays value as a percentage:

```yaml
- name: completion_rate
  type: number
  sql: "{completed} / NULLIF({total}, 0)"
  format: percent
```

Output: `75%` instead of `0.75`

### currency

Displays value as monetary amount:

```yaml
- name: total_revenue
  type: sum
  sql: amount
  format: currency
```

Output: `$1,234.56` (formatting depends on BI tool locale)

### number

Standard number formatting with grouping separators:

```yaml
- name: total_slots
  type: sum
  sql: slot_count
  format: number
```

Output: `1,234` instead of raw `1234`. Use this when the measure represents a count or quantity that benefits from thousand separators.

## Usage Notes

### Format vs Calculation

Format is for display only—it doesn't change the underlying value:

```yaml
# Value is 0.75, displayed as 75%
- name: rate
  type: number
  sql: "{part} / NULLIF({whole}, 0)"
  format: percent

# If you want the value to be 75, multiply in SQL
- name: rate_as_whole_number
  type: number
  sql: "100.0 * {part} / NULLIF({whole}, 0)"
  format: percent  # Displays as 7500% - probably not what you want!
```

### Percentages

For percentages, your SQL should return a decimal (0.75 for 75%):

```yaml
# Correct - returns 0.75, displays as 75%
- name: conversion_rate
  type: number
  sql: "{conversions} / NULLIF({visits}, 0)"
  format: percent

# Also correct - explicit multiplication for clarity
- name: conversion_rate
  type: number
  sql: "1.0 * {conversions} / NULLIF({visits}, 0)"
  format: percent
```

### Currency

For currency, return the raw numeric value:

```yaml
# Correct - returns 1234.56, displays as $1,234.56
- name: revenue
  type: sum
  sql: amount
  format: currency
```

## Common Patterns

### Financial Measures

```yaml
measures:
  - name: revenue
    type: sum
    sql: amount
    format: currency

  - name: cost
    type: sum
    sql: cost
    format: currency

  - name: profit_margin
    type: number
    sql: "({revenue} - {cost}) / NULLIF({revenue}, 0)"
    format: percent
```

### Conversion Metrics

```yaml
measures:
  - name: visits
    type: count_distinct
    sql: session_id

  - name: signups
    type: count

  - name: signup_rate
    type: number
    sql: "{signups} / NULLIF({visits}, 0)"
    format: percent
```

## BI Tool Support

Format support varies by visualization tool. Most tools recognize `percent` and `currency`, but rendering specifics (decimal places, currency symbol) depend on the tool's configuration.

## See Also

- cubes.measures
- cubes.measures.types
- cubes.dimensions.format
