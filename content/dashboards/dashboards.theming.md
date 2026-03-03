# Theming

> Customize dashboard colors, chart palettes, and visual styles at the org or dashboard level.

## Overview

Dashboards support two levels of theming:

- **Organization theme** — applies to all dashboards in the org
- **Dashboard theme** — per-file override via frontmatter

The cascade order is: defaults → org theme → dashboard frontmatter theme. Each level deep-merges into the previous, so you only need to specify the properties you want to change.

## Theme Properties

A theme object can include any combination of these properties:

### `palette`

The color palette used for chart series. Can be a named palette or an array of hex colors.

**Named palettes:**

| Name | Colors | Best for |
|------|--------|----------|
| `tableau` | 10 balanced colors | General use (default) |
| `default` | 8 saturated Tailwind colors | Bold dashboards |
| `observable` | 10 modern vibrant colors | Data-heavy visualizations |
| `metabase` | 8 soft muted colors | Friendly reports |

**Custom palette:**

```yaml
palette: ["#2563eb", "#dc2626", "#16a34a", "#ca8a04"]
```

### `chartHeight`

Height of chart components in pixels. Default: `320`.

```yaml
chartHeight: 400
```

### `fontFamily`

Override the dashboard font. Default: `Inter, system-ui, sans-serif`.

```yaml
fontFamily: "IBM Plex Sans, sans-serif"
```

### `colors`

Override individual color tokens that control the dashboard UI. Only specify the tokens you want to change — unspecified tokens keep their defaults.

| Token | Description |
|-------|-------------|
| `bg` | Page background |
| `bgMuted` | Muted/secondary background |
| `bgCard` | Card background |
| `border` | Default border color |
| `text` | Primary text |
| `textMuted` | Secondary/muted text |
| `textTitle` | Heading text |
| `textLabel` | Label text (axes, legends) |
| `shadow` | Card shadow |
| `radius` | Border radius |
| `gridLine` | Chart grid lines |
| `legendText` | Chart legend text |
| `tooltip.bg` | Tooltip background |
| `tooltip.border` | Tooltip border |
| `tooltip.text` | Tooltip text |
| `tooltip.shadow` | Tooltip shadow |
| `table.headerBg` | Data table header background |
| `table.hoverBg` | Data table row hover |
| `positive` | Positive/good indicator color (used by BigValue comparison ▲). Default: green |
| `negative` | Negative/bad indicator color (used by BigValue comparison ▼). Default: red |

## Organization Theme

Set a theme that applies to all dashboards in your organization.

```bash
# View current theme
bon theme get

# Set theme from a file
bon theme set theme.yml

# Validate without uploading
bon theme set theme.yml --dry-run

# Reset to defaults
bon theme reset
```

### Example `theme.yml`

```yaml
palette: observable
chartHeight: 360
colors:
  bgCard: "#1e293b"
  border: "#334155"
  gridLine: "#334155"
  tooltip:
    bg: "#1e293b"
    border: "#475569"
```

### Example with custom palette

```yaml
palette:
  - "#2563eb"
  - "#dc2626"
  - "#16a34a"
  - "#ca8a04"
  - "#9333ea"
chartHeight: 300
```

## Dashboard Theme (Frontmatter Override)

Override the org theme for a specific dashboard by adding `theme` to the frontmatter:

```yaml
---
title: Revenue Dashboard
theme:
  palette: metabase
  colors:
    bgCard: "#f0f9ff"
---
```

This overrides the org theme for this dashboard only. Properties not specified in the dashboard theme inherit from the org theme (or defaults if no org theme is set).

### Combining org and dashboard themes

If your org theme uses the Observable palette and a dashboard specifies `palette: metabase`, that dashboard uses Metabase colors while keeping all other org theme settings (chartHeight, colors, etc.).

## Local Preview

Preview dashboards with theming applied locally:

```bash
# Uses deployed org theme (fetched from API)
bon dashboard dev revenue.md

# Uses a local theme file instead
bon dashboard dev revenue.md --theme theme.yml
```

The `--theme` flag watches the theme file for changes — edit and save to see updates live.

## See Also

- [Dashboards](dashboards) — format and deployment
- [Components](dashboards.components) — chart reference
- [Examples](dashboards.examples) — complete examples
