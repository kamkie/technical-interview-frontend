# Architecture Snapshot

> **Artifact role:** Architecture Snapshot (lifecycle spec §7). **Conditional descriptive guide:** load only when the task is structurally sensitive.

Keep this file **compact and current**. It is a map, not a reference manual. Detailed design rationale belongs in spec artifacts; per-package contracts belong in code-level docs.

## Mission Recap

TODO: one-paragraph recap of what the system does and the audience it serves. Mirror `README.md`.

## Top-Level Map

TODO: replace with the actual repo. Example shape:

```
<repo-root>/
├── <source-root>/         # primary source code
├── <tests-root>/          # executable specs
├── <docs-root>/           # published contracts and reference docs
├── <infra-root>/          # deployment / infra
├── ai/                    # AI-facing guidance
└── …
```

## Module / Package Responsibilities

| Module | Responsibility | Primary public surface |
| --- | --- | --- |
| TODO | TODO | TODO |

## Boundaries And Dependencies

- TODO: list invariants the architecture maintains (layering rules, allowed dependency direction, anti-corruption layers, etc.)
- TODO: list explicit non-dependencies (modules that must not import each other)

## External Surfaces

TODO: APIs / events / CLIs the system exposes; for each, point to the published contract.

## Known Pressure Points

TODO: areas where future work is likely; flag here so plans can find them quickly.

## Updating This File

- update when a structural boundary, public surface, or module responsibility changes
- do **not** update for code-level changes that don't move boundaries
- if more detail is needed than fits here, add `ai/references/ARCHITECTURE_DETAILED_MAP.md` and link from this file
