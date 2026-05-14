# Calculated Measures

> Calculated measures let you build complex metrics from other measures in the same cube. Combine existing aggregations to create ratios, percentages, and derived metrics without raw SQL.

## Overview

Calculated measures combine existing measures to create derived metrics. Use the `number` type and reference other measures with `{measure_name}` syntax.

## Example

```yaml
measures:
  - name: total_orders
    type: count

  - name: total_revenue
    type: sum
    sql: amount

  - name: average_order_value
    type: number
    sql: "{total_revenue} / NULLIF({total_orders}, 0)"
```

## Syntax

### Referencing Measures

Use curly braces to reference other measures:

```yaml
- name: profit_margin
  type: number
  sql: "({revenue} - {cost}) / NULLIF({revenue}, 0)"
```

### Handling Division by Zero

Always use `NULLIF` to prevent division by zero:

```yaml
- name: conversion_rate
  type: number
  sql: "{conversions} / NULLIF({visits}, 0)"
```

## Common Patterns

### Percentages

```yaml
- name: completion_rate
  type: number
  sql: "100.0 * {completed} / NULLIF({total}, 0)"
  format: percent
```

### Ratios

```yaml
- name: orders_per_user
  type: number
  sql: "{order_count} / NULLIF({user_count}, 0)"
```

### Profit Calculations

```yaml
- name: gross_profit
  type: number
  sql: "{revenue} - {cost_of_goods}"

- name: gross_margin
  type: number
  sql: "{gross_profit} / NULLIF({revenue}, 0)"
  format: percent
```

### Year-over-Year

```yaml
- name: yoy_growth
  type: number
  sql: "({revenue_this_year} - {revenue_last_year}) / NULLIF({revenue_last_year}, 0)"
  format: percent
```

## Best Practices

1. **Build on base measures** — don't duplicate aggregation logic
2. **Use descriptive names** — `conversion_rate` not `calc1`
3. **Add format** — helps consumers understand the value
4. **Document complex formulas** with `description`

## See Also

- cubes.measures
- cubes.measures.types
- cubes.measures.rolling
