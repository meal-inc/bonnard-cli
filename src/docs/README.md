# Bonnard CLI Documentation

This directory contains the documentation served by `bon docs`.

## Structure

```
docs/
├── _index.md           # Index shown by `bon docs` (llms.txt style)
├── topics/             # Individual topic files
│   ├── cubes.md
│   ├── cubes.measures.md
│   ├── cubes.measures.types.md
│   └── ...
├── schemas/            # JSON schemas for validation
│   ├── cube.schema.json
│   └── view.schema.json
└── README.md           # This file
```

## Topic Naming Convention

Topic IDs use dot notation that maps directly to filenames:

| Topic ID | File |
|----------|------|
| `cubes` | `topics/cubes.md` |
| `cubes.measures` | `topics/cubes.measures.md` |
| `cubes.measures.types` | `topics/cubes.measures.types.md` |

## Topic File Format

Each topic file should follow this structure:

```markdown
# topic.name

> Brief one-line description.

## Overview

Short explanation (2-3 sentences).

## Example

```yaml
# Minimal working example
```

## Reference

| Property | Type | Description |
|----------|------|-------------|
| name | string | ... |

## See Also

- related.topic
- another.topic

```

## Guidelines

- Keep topics concise (~20-40 lines)
- Lead with examples, not theory
- Use tables for property references
- Include "See Also" for discoverability

## Commands

```bash
bon docs                    # Show index
bon docs <topic>            # Show specific topic
bon docs <topic> --recursive # Show topic + children
bon docs --search <query>   # Search topics
bon docs schema <type>      # Show JSON schema
```
