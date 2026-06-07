# AI Documentation Reference

This file owns AI-facing artifact routing and cross-file alignment checks for this
frontend repository. Use it with `docs/DEVELOPMENT_LIFECYCLE.md` when a task changes
documentation, repository rules, roadmap scope, specs, setup instructions, or
release state.

## Routing Rules

Start by naming the user-visible behavior, repository rule, or release state being
changed. Then update the smallest owner that can hold the durable rule.

| Change | Owner to update first | Alignment checks |
| --- | --- | --- |
| Backend API integration | `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md` | Generated API types, API client, affected UI, and tests still follow the imported contract |
| Session, auth, CSRF, or localization behavior | Backend contract artifacts and executable tests | `AGENTS.md` backend invariants, route guards, smoke notes, and affected docs agree |
| UI behavior | Component/page code and user-facing tests | `docs/specs/` exists when the behavior is too broad or ambiguous for a roadmap row |
| Setup, local commands, troubleshooting, or tool usage | `docs/LOCAL_DEVELOPMENT.md` | `SETUP.md`, package scripts, and tool config agree when their behavior changes |
| Human AI collaboration guidance | `docs/WORKING_WITH_AI.md` | `CONTRIBUTING.md` and AI references link to the same owner when relevant |
| AI procedure guidance | `.agents/references/` | `AGENTS.md` links to the focused reference instead of duplicating the full rule |
| Product, milestone, or release scope | `ROADMAP.md` | Specs, changelog, and release references agree when the selected scope changes |
| Shipped or release-candidate history | `CHANGELOG.md` | `ROADMAP.md`, package metadata, and release notes agree during release work |

Do not leave durable rules only in plans, scratch notes, or final responses. Plans
can coordinate execution, but the owner document, spec, test, or roadmap row must
carry the rule after the task is complete.

## Cross-File Alignment

Before handoff, check the files that describe the same behavior from different
entry points:

- `AGENTS.md` keeps core AI rules, backend integration invariants, and links to
  focused AI references.
- `docs/README.md` indexes human-facing documentation owners.
- `README.md`, `SETUP.md`, and `CONTRIBUTING.md` should link to owner docs instead
  of copying procedure bodies.
- `ROADMAP.md` tracks selected scope, milestone status, release phase, and deferred
  work.
- `CHANGELOG.md` tracks release-candidate and shipped user-visible history.
- `docs/specs/` holds selected behavior details only when a roadmap row is not
  specific enough.

When two owners disagree, use the truth-priority order in `AGENTS.md`. For
API-facing behavior, the imported backend contract artifacts stay authoritative.

## Completion Checks

For documentation and guidance tasks:

- confirm each new or changed rule has exactly one durable owner
- keep entry-point docs linked to the owner instead of duplicating full procedures
- preserve same-origin `/api/**`, session-cookie, metadata-driven login/logout, and
  CSRF invariants for API-facing guidance
- update `ROADMAP.md` when milestone status, product scope, release state, or
  deferred scope changes
- run validation from `.agents/references/testing.md` and report skipped checks
