# Changelog

All notable changes to `@bonnard/cli` will be documented in this file.

## [0.2.11] - 2026-02-18

### Added
- Update check notification — `bon` now checks for newer versions in the background and shows a notice after command output

## [0.2.10] - 2026-02-18

### Changed
- CI publish workflow fixes (sync + provenance)

## [0.2.9] - 2026-02-17

### Changed
- CI publish workflow with npm provenance for verified builds

## [0.2.8] - 2026-02-17

### Added
- MCP dashboard tools: list, get, deploy, remove dashboards, get dashboard docs
- Dashboard versioning — version snapshots created on dashboard create/update
- Open-source CLI repository at `github.com/meal-inc/bonnard-cli`

### Changed
- Getting-started docs now lead with `npx` as primary install method
- Added `repository` and `license` fields to package.json
- README updated with open-source callout and GitHub link

## [0.2.7] - 2026-02-16

### Added
- `bon metabase explore` now accepts names (not just IDs) for table, card, dashboard, database, and collection lookups
- Disambiguation output when a name matches multiple resources (shows IDs with context)
- Table IDs included in `bon metabase analyze` report (Table Inventory and Most Referenced Tables sections)

### Changed
- Design guide: removed "5-10 views" target — governance policies control per-user view access, so build as many views as audiences need

## [0.2.6] - 2026-02-16

### Added
- README for npm package page

### Fixed
- TypeScript error in `metabase explore` command (null check on database metadata)

## [0.2.5] - 2026-02-15

### Added
- `/bonnard-design-guide` skill — 7 design principles for building semantic layers that work well for AI agents (question-first design, audience-centric views, filtered measures, descriptions as discovery API, natural language testing, iteration)
- Design principles summary inlined in project rules (always loaded in agent context)

### Changed
- `/bonnard-get-started` skill — added filtered measure example, audience-centric view naming, navigational descriptions, natural language testing step
- `/bonnard-metabase-migrate` skill — added filtered measure guidance from card WHERE clauses, audience-centric view examples, natural language verification step
- Demo data reference updated — added `dim_channel`, `return_quantity`, `return_amount` to Contoso table descriptions

## [0.2.4] - 2026-02-14

### Added
- Redshift as first-class warehouse type (`bon datasource add --type redshift`)
- Redshift auto-detection from dbt profiles and environment variables

### Changed
- `bon deploy` now always syncs all local datasources to remote (upsert), replacing the interactive push flow
- Datasource API endpoint changed from insert to upsert (stale remote configs are updated automatically)
- Removed `--push-datasources` flag from `bon deploy` (no longer needed)

## [0.2.3] - 2026-02-14

### Removed
- `bon datasource test` and `bon datasource push` CLI commands — `bon deploy` handles both automatically

### Changed
- Agent skill templates now show non-interactive `bon datasource add` flags (avoids interactive prompt timeouts)
- Removed stale "test connection" hints from `bon datasource add` output

## [0.2.2] - 2026-02-13

### Added
- `bon metabase connect` — configure Metabase API connection
- `bon metabase explore` — browse databases, collections, cards, dashboards, tables
- `bon metabase analyze` — generate analysis report for semantic layer planning
- Metabase migration agent skill (`/bonnard-metabase-migrate`) for Claude, Cursor, and Codex
- Analysis report now includes "How to Use This Report" guidance section

### Changed
- Shared agent template (`bonnard.md`) now lists metabase commands and links to migration skill

## [0.2.1] - 2026-02-13

### Changed
- Replaced `@cubejs-backend/schema-compiler` (79 MB) with lightweight Zod v4 validator (~60 KB)
- `bon validate` now provides field-level error messages with file context
- Identifier validation (cube/measure/dimension names must match `[_a-zA-Z][_a-zA-Z0-9]*`)
- Refresh key interval validation (`every` must match pattern like `1 hour`, `30 minutes`)

### Added
- Unit and integration tests for YAML schema validation

## [0.2.0] - 2026-02-13

### Added
- `bon deployments` — list deployment history (`--all` for full history)
- `bon diff <id>` — view changes in a deployment (`--breaking` for breaking only)
- `bon annotate <id>` — add notes and context to deployment changes
- `bon deploy` now requires `-m "message"` and detects changes vs previous deployment
- Deploy output shows added, modified, removed, and breaking changes

### Changed
- Agent templates updated with deployment versioning, change tracking, and best practices
- `bon validate` improved with better error detail and field-level validation

### Fixed
- CLI login now works for first-time users without existing org
- `bon docs` topic resolution improvements

## [0.1.13] - 2026-02-09

### Fixed
- `bon docs --search demo` now finds getting-started guide (was only searching modeling topics)
- `bon docs getting-started` now works as a topic

## [0.1.12] - 2026-02-09

### Changed
- Agent skills and getting-started guide now use Contoso demo data examples throughout (sales cube, not generic orders)
- Phase 2 (Explore) now instructs agents to discover schema before creating cubes
- Fixed `bon query` syntax in getting-started docs (was using non-existent `--measures` flag)

## [0.1.11] - 2026-02-08

### Added
- `bon datasource add --demo` — adds a read-only Contoso retail dataset for testing without a warehouse
- Demo data references in getting-started guide, agent skills (Claude/Cursor), and shared bonnard.md template

## [0.1.10] - 2026-02-07

### Changed
- Replaced multiple agent skills with single `bonnard-get-started` walkthrough for Claude, Cursor, and Codex
- Security hardening: input validation, auth fixes

### Fixed
- Removed `workspace:*` dependency that broke npm installs

## [0.1.9] - 2026-02-05

### Added
- Embedded documentation via `bon docs` — browse cubes, views, measures, dimensions, joins
- `bon docs --search` for keyword search across topics
- `bon docs schema` for JSON schema output
- `bon init` detects dbt projects and configures agent context accordingly

## [0.1.8] - 2026-02-03

### Added
- `bon mcp` and `bon mcp test` commands for MCP server setup and connectivity testing
- MCP token persistence in `.bon/`

## [0.1.7] - 2026-02-02

### Added
- `bon whoami` with `--verify` flag
- Codex agent support in `bon init`

## [0.1.6] - 2026-02-01

### Added
- `bon datasource push` — sync local datasources to Bonnard server
- `bon query` — query deployed semantic layer (JSON and SQL formats)

## [0.1.5] - 2026-01-31

### Added
- `bon datasource test` — test warehouse connectivity
- `bon datasource list` and `bon datasource remove`

## [0.1.4] - 2026-01-30

### Added
- `bon datasource add` — interactive and non-interactive modes
- `bon datasource add --from-dbt` — import from dbt profiles.yml
- `bon validate` and `bon deploy` commands

## [0.1.0] - 2026-01-27

### Added
- Initial release: `bon init`, `bon login`, `bon logout`
- Project scaffolding with cubes/, views/, .bon/ structure
- Agent template generation (Claude, Cursor)
