# Bonnard Documentation

> Learn how to build, deploy, and query a semantic layer with Bonnard. Define metrics once in YAML cubes and views, then query from any BI tool or AI agent.

## Cubes

### Core
- [cubes](cubes) - Define cubes with measures and dimensions
- [cubes.sql](cubes.sql) - Base SQL table or query
- [cubes.extends](cubes.extends) - Reuse members from other cubes
- [cubes.public](cubes.public) - Control API visibility
- [cubes.refresh-key](cubes.refresh-key) - Cache invalidation strategies
- [cubes.data-source](cubes.data-source) - Connect cubes to warehouses

### Measures
- [cubes.measures](cubes.measures) - Quantitative metrics (count, sum, avg)
- [cubes.measures.types](cubes.measures.types) - All 12 measure types
- [cubes.measures.filters](cubes.measures.filters) - Measure-level filters
- [cubes.measures.calculated](cubes.measures.calculated) - Derived metrics from other measures
- [cubes.measures.rolling](cubes.measures.rolling) - Rolling window aggregations
- [cubes.measures.drill-members](cubes.measures.drill-members) - Drill-down dimensions
- [cubes.measures.format](cubes.measures.format) - Output formatting (percent, currency)

### Dimensions
- [cubes.dimensions](cubes.dimensions) - Attributes for grouping/filtering
- [cubes.dimensions.types](cubes.dimensions.types) - All 6 dimension types
- [cubes.dimensions.primary-key](cubes.dimensions.primary-key) - Unique identifiers for joins
- [cubes.dimensions.time](cubes.dimensions.time) - Time-based analysis
- [cubes.dimensions.sub-query](cubes.dimensions.sub-query) - Bring measures into dimensions
- [cubes.dimensions.format](cubes.dimensions.format) - Display formatting (link, image, etc.)

### Relationships & Filters
- [cubes.joins](cubes.joins) - Relationships between cubes
- [cubes.hierarchies](cubes.hierarchies) - Drill-down paths for analysis
- [cubes.segments](cubes.segments) - Reusable predefined filters

## Views

- [views](views) - Compose cubes into focused interfaces
- [views.cubes](views.cubes) - Include cubes with join paths
- [views.includes](views.includes) - Select members to expose
- [views.folders](views.folders) - Organize members into groups

## Pre-Aggregations

- [pre-aggregations](pre-aggregations) - Materialize query results for performance
- [pre-aggregations.rollup](pre-aggregations.rollup) - Summarized data tables

## Syntax

- [syntax](syntax) - YAML syntax and conventions
- [syntax.references](syntax.references) - Reference columns, members, and cubes
- [syntax.context-variables](syntax.context-variables) - CUBE, FILTER_PARAMS, COMPILE_CONTEXT

## Querying

- [querying](querying) - Query your deployed semantic layer
- [querying.mcp](querying.mcp) - Connect AI agents via MCP
- [querying.rest-api](querying.rest-api) - REST API and SQL query reference
- [querying.sdk](querying.sdk) - TypeScript SDK for custom apps

## CLI

- [cli](cli) - CLI commands and development workflow
- [cli.deploy](cli.deploy) - Deploy to Bonnard
- [cli.validate](cli.validate) - Validate cubes and views locally

## Other

- [governance](governance) - User and group-level permissions
- [catalog](catalog) - Browse your data model in the browser
- [slack-teams](slack-teams) - AI agents in team chat (coming soon)

## Quick Reference

```bash
bon docs <topic>            # View topic
bon docs <topic> --recursive # View topic + children
bon docs --search <query>   # Search all topics
bon docs schema <type>      # JSON schema for validation
```
