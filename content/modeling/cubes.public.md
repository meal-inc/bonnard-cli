# Public

> The public property controls whether cubes, measures, and dimensions are exposed in the API. Set public to false to hide internal implementation details from consumers.

## Overview

The `public` property controls whether a cube or its members are exposed through the API. Set to `false` to hide internal or intermediate data from consumers.

## Example

```yaml
cubes:
  # Hidden cube - used for joins only
  - name: internal_mappings
    public: false
    sql_table: internal.mappings

    dimensions:
      - name: id
        type: number
        sql: id
        primary_key: true

  # Public cube with some hidden members
  - name: orders
    sql_table: orders

    measures:
      - name: count
        type: count

      - name: internal_score
        type: avg
        sql: score
        public: false  # Hidden from API

    dimensions:
      - name: id
        type: number
        sql: id
        primary_key: true
        public: false  # Primary keys auto-hide by default

      - name: status
        type: string
        sql: status
```

## Syntax

### Cube Level

```yaml
cubes:
  - name: internal_cube
    public: false
```

### Measure Level

```yaml
measures:
  - name: debug_metric
    type: count
    public: false
```

### Dimension Level

```yaml
dimensions:
  - name: internal_id
    type: string
    sql: internal_id
    public: false
```

### Segment Level

```yaml
segments:
  - name: test_users
    sql: "{CUBE}.is_test = true"
    public: false
```

## Default Behavior

| Member Type | Default `public` |
|-------------|------------------|
| Cube | `true` |
| Measure | `true` |
| Dimension | `true` |
| Dimension with `primary_key: true` | `false` |
| Segment | `true` |

## Use Cases

### Internal Cubes

Hide cubes used only for joins or intermediate calculations:

```yaml
cubes:
  - name: user_scores_internal
    public: false
    sql: "SELECT user_id, calculate_score() as score FROM users"
```

### Sensitive Fields

Hide fields that shouldn't be queried directly:

```yaml
dimensions:
  - name: password_hash
    type: string
    sql: password_hash
    public: false

  - name: api_secret
    type: string
    sql: api_secret
    public: false
```

### Intermediate Measures

Hide measures used only in calculations:

```yaml
measures:
  - name: raw_numerator
    type: sum
    sql: value
    public: false

  - name: raw_denominator
    type: count
    public: false

  - name: ratio
    type: number
    sql: "{raw_numerator} / NULLIF({raw_denominator}, 0)"
    # This is public (default)
```

### Debug/Test Members

```yaml
segments:
  - name: test_data
    sql: "{CUBE}.is_test = true"
    public: false
```

## Dynamic Visibility

Use `COMPILE_CONTEXT` for dynamic visibility based on context:

```yaml
cubes:
  - name: admin_metrics
    public: "{{ 'true' if COMPILE_CONTEXT.role == 'admin' else 'false' }}"
```

## See Also

- cubes
- cubes.measures
- cubes.dimensions
- views
