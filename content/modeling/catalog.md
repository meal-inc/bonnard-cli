# Catalog

> Browse and understand your data model — no code required.

The Bonnard catalog gives everyone on your team a live view of your semantic layer. Browse cubes, views, measures, and dimensions from the browser. Understand what data is available before writing a single query.

## What you can explore

- **Cubes and Views** — See every deployed source with field counts at a glance
- **Measures** — Aggregation type, SQL expression, format (currency, percentage), and description
- **Dimensions** — Data type, time granularity options, and custom metadata
- **Segments** — Pre-defined filters available for queries

## Field-level detail

Click any field to see exactly how it's calculated:

- **SQL expression** — The underlying query logic
- **Type and format** — How the field is aggregated and displayed
- **Origin cube** — Which cube a view field traces back to
- **Referenced fields** — Dependencies this field relies on
- **Custom metadata** — Tags, labels, and annotations set by your data team

## Built for business users

The catalog is designed for anyone who needs to understand the data, not just engineers. No YAML, no terminal, no warehouse credentials. Browse the schema, read descriptions, and know exactly what to ask your AI agent for.

## Coming soon

- **Relationship visualization** — An interactive visual map showing how cubes connect through joins and shared dimensions
- **Impact analysis** — Understand which views and measures are affected when you change a cube, before you deploy

## See Also

- [views](views) — How to create curated views for your team
- [cubes.public](cubes.public) — Control which cubes are visible
