# Hierarchies

> Hierarchies define drill-down paths for dimensional analysis in your semantic layer. Set up parent-child relationships between dimensions so consumers can explore data at different levels.

## Overview

Hierarchies group dimensions into levels of granularity, enabling drill-down and roll-up analysis. Users can navigate from high-level summaries (e.g., country) down to details (e.g., city).

## Example

```yaml
cubes:
  - name: orders
    sql_table: orders

    dimensions:
      - name: country
        type: string
        sql: country

      - name: state
        type: string
        sql: state

      - name: city
        type: string
        sql: city

    hierarchies:
      - name: location
        title: "Geographic Location"
        levels:
          - country
          - state
          - city
```

## Properties

| Property | Required | Description |
|----------|----------|-------------|
| `name` | Yes | Unique identifier |
| `levels` | Yes | Ordered list of dimensions (least to most granular) |
| `title` | No | Human-readable display name |
| `public` | No | API visibility (default: true) |

## Syntax

### Basic Hierarchy

```yaml
hierarchies:
  - name: time_hierarchy
    levels:
      - year
      - quarter
      - month
      - day
```

### With Title

```yaml
hierarchies:
  - name: product_category
    title: "Product Categories"
    levels:
      - department
      - category
      - subcategory
```

### Multiple Hierarchies

A dimension can appear in multiple hierarchies:

```yaml
hierarchies:
  - name: fiscal_time
    levels:
      - fiscal_year
      - fiscal_quarter
      - fiscal_month

  - name: calendar_time
    levels:
      - calendar_year
      - calendar_quarter
      - calendar_month
```

## Cross-Cube Hierarchies

Include dimensions from joined cubes using dot notation:

```yaml
cubes:
  - name: orders
    joins:
      - name: users
        relationship: many_to_one
        sql: "{CUBE}.user_id = {users.id}"

    hierarchies:
      - name: customer_location
        levels:
          - users.country
          - users.state
          - users.city
```

## Common Patterns

### Geographic Hierarchy

```yaml
hierarchies:
  - name: geography
    title: "Location"
    levels:
      - continent
      - country
      - region
      - city
```

### Time Hierarchy

```yaml
hierarchies:
  - name: time
    title: "Time Period"
    levels:
      - year
      - quarter
      - month
      - week
      - day
```

### Organizational Hierarchy

```yaml
hierarchies:
  - name: organization
    title: "Org Structure"
    levels:
      - division
      - department
      - team
```

### Product Hierarchy

```yaml
hierarchies:
  - name: product
    title: "Product Categories"
    levels:
      - brand
      - category
      - product_line
      - sku
```

## BI Tool Support

Hierarchy support varies by visualization tool. Check your specific tool's documentation for compatibility.

## See Also

- cubes.dimensions
- cubes.joins
- views.folders
