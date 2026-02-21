# Dimension Format

> The format property controls how dimension values are displayed to consumers. Apply date formatting, number formatting, or custom patterns to make dimension output human-readable.

## Overview

The `format` property hints to BI tools how to render dimension values. Dimensions support more format options than measures.

## Example

```yaml
dimensions:
  - name: avatar_url
    type: string
    sql: avatar_url
    format: imageUrl

  - name: profile_link
    type: string
    sql: "CONCAT('https://example.com/users/', id)"
    format: link

  - name: price
    type: number
    sql: unit_price
    format: currency

  - name: external_id
    type: number
    sql: external_system_id
    format: id
```

## Supported Formats

### imageUrl

Displays the value as an image in table views:

```yaml
- name: product_image
  type: string
  sql: image_url
  format: imageUrl

- name: avatar
  type: string
  sql: profile_picture_url
  format: imageUrl
```

### link

Displays the value as a clickable hyperlink:

```yaml
- name: website
  type: string
  sql: website_url
  format: link

- name: order_link
  type: string
  sql: "CONCAT('https://admin.example.com/orders/', id)"
  format: link
```

### id

Prevents number formatting (no commas in large numbers):

```yaml
- name: external_id
  type: number
  sql: external_system_id
  format: id
```

Output: `1234567890` instead of `1,234,567,890`

### currency

Displays as monetary value:

```yaml
- name: unit_price
  type: number
  sql: price
  format: currency
```

### percent

Displays as percentage:

```yaml
- name: discount_rate
  type: number
  sql: discount
  format: percent
```

### Custom Time Format

Use POSIX strftime format strings for time dimensions:

```yaml
- name: created_at
  type: time
  sql: created_at
  format: "%Y-%m-%d %H:%M:%S"

- name: birth_date
  type: time
  sql: birth_date
  format: "%B %d, %Y"  # "January 15, 2024"
```

## Time Format Specifiers

| Specifier | Description | Example |
|-----------|-------------|---------|
| `%Y` | 4-digit year | 2024 |
| `%y` | 2-digit year | 24 |
| `%m` | Month (01-12) | 03 |
| `%B` | Full month name | March |
| `%b` | Abbreviated month | Mar |
| `%d` | Day of month (01-31) | 15 |
| `%H` | Hour (00-23) | 14 |
| `%I` | Hour (01-12) | 02 |
| `%M` | Minute (00-59) | 30 |
| `%S` | Second (00-59) | 45 |
| `%p` | AM/PM | PM |

## Common Patterns

### User Profiles

```yaml
dimensions:
  - name: avatar
    type: string
    sql: avatar_url
    format: imageUrl

  - name: profile_url
    type: string
    sql: "CONCAT('/users/', username)"
    format: link
```

### Product Catalog

```yaml
dimensions:
  - name: image
    type: string
    sql: image_url
    format: imageUrl

  - name: sku
    type: string
    sql: sku
    format: id

  - name: price
    type: number
    sql: price
    format: currency
```

### Timestamps

```yaml
dimensions:
  - name: created_at
    type: time
    sql: created_at
    format: "%Y-%m-%d"

  - name: last_login
    type: time
    sql: last_login_at
    format: "%b %d, %Y at %I:%M %p"
```

## BI Tool Support

Format support varies by visualization tool. Most tools recognize common formats, but rendering details may differ.

## See Also

- cubes.dimensions
- cubes.dimensions.types
- cubes.measures.format
