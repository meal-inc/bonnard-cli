# Validate

> Run validation checks on your cubes and views before deploying to catch YAML syntax errors, missing references, circular joins, and other issues. Use `bon validate` from the CLI.

## Overview

The `bon validate` command checks your YAML cubes and views for syntax errors and schema violations. Run this before deploying to catch issues early.

## Usage

```bash
bon validate
```

## What Gets Validated

### YAML Syntax

- Valid YAML format
- Proper indentation
- Correct quoting

### Schema Compliance

- Required fields present (name, type, sql)
- Valid field values (known measure types, relationship types)
- Consistent naming conventions

### Reference Integrity

- Referenced cubes exist
- Referenced members exist
- Join relationships are valid

## Example Output

### Success

```
✓ Validating YAML syntax...
✓ Checking bonnard/cubes/orders.yaml
✓ Checking bonnard/cubes/users.yaml
✓ Checking bonnard/views/orders_overview.yaml

All cubes and views valid.
```

### Errors

```
✗ Validating YAML syntax...

bonnard/cubes/orders.yaml:15:5
  error: Unknown measure type "counts"

  Did you mean "count"?

  14:   measures:
  15:     - name: order_count
  16:       type: counts  <-- here
  17:       sql: id

1 error found.
```

## Common Errors

### Missing Required Field

```yaml
# Error: "sql" is required
measures:
  - name: count
    type: count
    # Missing: sql: id
```

### Invalid Type

```yaml
# Error: Unknown dimension type "text"
dimensions:
  - name: status
    type: text    # Should be: string
    sql: status
```

### Reference Not Found

```yaml
# Error: Cube "user" not found (did you mean "users"?)
joins:
  - name: user
    relationship: many_to_one
    sql: "{CUBE}.user_id = {user.id}"
```

### YAML Syntax

```yaml
# Error: Bad indentation
measures:
- name: count  # Should be indented
  type: count
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All validations passed |
| 1 | Validation errors found |

## Best Practices

1. **Run before every deploy** — `bon validate && bon deploy`
2. **Add to CI/CD** — validate on pull requests
3. **Fix errors first** — don't deploy with validation errors
4. **Test connections** — connections are tested automatically during `bon deploy`

## See Also

- cli
- cli.deploy
- syntax
