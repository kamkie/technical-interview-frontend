# New Repository Setup Template

This directory is a clean, repo-agnostic scaffold that satisfies `ai/specs/APPLICATION_LIFECYCLE_SPEC.md` at conformance level **L1 — Spec-Driven Core** (§13), with hooks for L2–L4.

It is intentionally lean: no language-, build-tool-, branching-model-, or CI-specific assumptions. Every file is a placeholder with `TODO:` markers for the adopting repo to fill in.

## What This Template Provides

A minimal artifact set mapped to the **Required Artifact Set** in spec §7:

| Spec role (§7) | Template file |
| --- | --- |
| Project Charter | `README.md` |
| Setup Guide | `SETUP.md` |
| Roadmap (active-work tracking) | `ROADMAP.md` |
| Release History | `CHANGELOG.md` |
| Engineering Rules | `AGENTS.md` |
| Plan | `ai/plans/active/PLAN_EXAMPLE.md` (example) and `ai/templates/PLAN_TEMPLATE.md` |
| Executable Spec | `tests/` (placeholder, repo fills in) |
| Published Contract | `docs/contracts/` (placeholder, repo fills in) |
| Phase Owner Guides | `ai/PLANNING.md`, `ai/EXECUTION.md`, `ai/PLAN_EXECUTION.md`, `ai/TESTING.md`, `ai/REVIEWS.md`, `ai/RELEASES.md`, `ai/WORKFLOW.md`, `ai/DOCUMENTATION.md` |
| Learnings | `ai/LEARNINGS.md` |
| Architecture Snapshot | `ai/ARCHITECTURE.md` |
| Lifecycle Spec (pinned) | `ai/specs/APPLICATION_LIFECYCLE_SPEC.md` (copy from upstream, pin version) |

Plus the spec's adoption-table stubs (§12 steps 5–7) inside `AGENTS.md`:

- change-class table (`Docs` lens routing)
- validation table (`Plan-Tests` / `Run` lens inputs)
- gate table (executable vs. named-approval per phase exit)
- cross-cutting trigger map (§6)

## How To Adopt

Follow `APPLICATION_LIFECYCLE_SPEC.md` §12 *Adoption Guide*:

1. Copy the contents of this directory to the new repo root (merge `ai/` and top-level files).
2. Replace every `TODO:` marker with the repo's real value. Do not leave placeholders in committed files past the first cycle.
3. Pin the lifecycle spec version in `AGENTS.md` (§16).
4. Declare the conformance level in `AGENTS.md` (§13). Default for a new repo is **L1**.
5. Map each lens in spec §3 to exactly one owner artifact below; if a lens has no owner, add one (do not silently drop it).
6. Adopt lens labels (`[Code]`, `[Run]`, `[Replan?]`, …) inside owner-guide prose as the repo grows; this lifts conformance toward **L4 — Lens-Annotated**.
7. Record any spec gap as a roadmap entry with an owner (§12 step 9).

## Layout

```
<repo-root>/
├── AGENTS.md                  # Engineering Rules (§7) + adoption tables (§12.5–7) + trigger map (§6)
├── README.md                  # Project Charter (§7)
├── SETUP.md                   # Setup Guide (§7)
├── ROADMAP.md                 # Roadmap / active-work tracking (§7, §2 Roadmap Intake)
├── CHANGELOG.md               # Release History (§7)
├── CONTRIBUTING.md            # Human-facing entry to the engineering rules
└── ai/
    ├── ARCHITECTURE.md        # Architecture Snapshot (§7)
    ├── CODE_STYLE.md          # Style rules consumed by the Code lens (§3.4)
    ├── PLANNING.md            # Owner of Planning phase (§2 #3, §3.3, §5.2 Plan Loop)
    ├── EXECUTION.md           # Owner of ad-hoc Implementation (§3.4, §5.3 Milestone Loop)
    ├── PLAN_EXECUTION.md      # Owner of whole-plan execution (§5.3 Milestone Loop, multi-milestone)
    ├── TESTING.md             # Owner of Testing phase (§2 #5, §3.5, §5.4 Red-Green Loop)
    ├── REVIEWS.md             # Owner of Review phase (§2 #6, §3.6, §5.5 Review Loop)
    ├── RELEASES.md            # Owner of Release phase (§2 #8, §3.8)
    ├── DOCUMENTATION.md       # Owner of `Docs` lens routing (§3.4) + change-class fan-out
    ├── WORKFLOW.md            # Branch / worktree / integration mechanics (§10)
    ├── LEARNINGS.md           # Learnings (§7, §3.11 Capture-Learning)
    ├── specs/
    │   └── APPLICATION_LIFECYCLE_SPEC.md  # pinned upstream spec
    ├── templates/
    │   └── PLAN_TEMPLATE.md   # input to the `Decompose` / `Validate-Plan` lenses (§3.3)
    ├── plans/
    │   └── active/
    │       └── PLAN_EXAMPLE.md
    └── archive/               # closed plans (§2 `Closed` terminal status)
```

## Non-Goals Of This Template

Mirror of spec §14: this template does **not** prescribe a language, build tool, CI, branching model, issue tracker, or release cadence. Pick those during step 1 of the adoption guide and record them in `AGENTS.md`.
