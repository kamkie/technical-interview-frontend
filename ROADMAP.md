# Roadmap

This roadmap tracks selected, planned, blocked, and non-goal first-party browser frontend work for the sibling `technical-interview-demo` backend. Roadmap editing rules are owned by `.agents/references/roadmap.md`.

Roadmap hierarchy:

- Milestone: delivery slice with an outcome and order.
- Epic: product or workflow area inside a milestone.
- Task: actionable unit inside an epic.
- Plan: execution artifact created when milestone work needs coordinated execution.

Stable IDs:

- Milestones use `M-AREA-NNN`.
- Epics use `E-AREA-NNN`.
- Tasks use `T-AREA-NNN`.
- Plans use `PLAN-short-kebab-slug`.

Keep IDs stable when wording, status, ordering, or section placement changes. Do not renumber existing IDs. When work is split, keep the original ID for the closest surviving item and assign new IDs to new items. Do not reuse retired IDs for unrelated work.

Labels use stable IDs so the hierarchy stays searchable without turning the roadmap into a table. Backend contract details, validation selection, and AI procedure rules stay in their owner documents instead of being repeated on every item.

## Release Context

- Release phase: `v0.3.1` is published; no next release candidate is selected.
- Latest release: `v0.3.1`.
- Next target version: Not selected; select the next maintenance target before more release prep.
- Current priority: Select the next maintenance target or roadmap scope before more release prep.
- Active product plans: None; `M-QUALITY-001`, `E-A11Y-001`, `E-HARDEN-001`, and `E-HARDEN-002` are done.
- Recent supporting work: Dev-server and browser-review hygiene is complete and archived; command details live in `docs/LOCAL_DEVELOPMENT.md` and validation guidance lives in `.agents/references/testing.md`.
- Selection policy: Breaking user-facing or backend-contract integration changes require a selected roadmap item.

## Product Direction

- Present the app as a production browser product, not as repository or technical demo framing.
- Keep the primary experience focused on catalog, account, admin, and operator workflows backed by the approved backend contract.
- Preserve same-origin `/api/**`, session-cookie auth, metadata-driven login/logout, CSRF, localization, pagination, repeated filters, and versioned update invariants from `docs/backend/`.
- Prefer thin route/page experiences backed by a small shared API client layer.
- Add tests at the smallest useful layer for each user-visible behavior.
- Promote release, smoke, accessibility, or hardening checks only after the roadmap or owner document defines the command, evidence, threshold, and failure owner.

## Milestones

### M-QUALITY-001: Quality Gates

Labels: `type:milestone`, `status:done`

Goal: Add enforceable accessibility and hardening evidence now that command scope, thresholds, skip behavior, and failure ownership are selected; implement the selected deferred hardening scope now that its reporting, budget, pinning, and artifact decisions are made.

#### E-A11Y-001: Accessibility Automation

Labels: `type:epic`, `milestone:M-QUALITY-001`, `status:done`

Selected Decisions:

- Command: add `npm run a11y`.
- Tooling: use Playwright with `@axe-core/playwright`.
- Runtime: reuse the existing mock Vite/auth pattern so the check can run without the sibling backend or provider credentials.
- Route scope: cover anonymous catalog/home state, authenticated `/account`, and authenticated `/admin/users` with the mock admin session.
- Failure threshold: fail local and CI checks on serious or critical automated accessibility violations.
- Advisory handling: report moderate and minor findings without failing the command during the first pass.
- Skip behavior: missing browser tooling is a prerequisite failure, not a product pass; CI should not silently skip the check.
- Failure owner: repository maintainers.
- Evidence: command output and CI logs are enough for the first implementation; retained artifacts can be selected later if the output proves useful.

Tasks:

- T-A11Y-001: Implement the selected accessibility command, threshold, skip rules, and failure owner.
- T-A11Y-002: Wire the accessibility check to run locally and in CI.
- T-A11Y-003: Document local and CI usage, advisory finding handling, and failure triage.

Acceptance Criteria:

- `npm run a11y` runs against the selected anonymous and authenticated mock-browser route scope.
- Serious or critical automated accessibility violations fail the command locally and in CI.
- Moderate and minor findings are visible as advisory output without failing the first-pass gate.
- Missing browser prerequisites are reported as prerequisite failures instead of successful product evidence.
- Documentation records command usage, CI behavior, skip semantics, and repository-maintainer ownership.

#### E-HARDEN-001: Hardening Thresholds

Labels: `type:epic`, `milestone:M-QUALITY-001`, `status:done`

Selected Decisions:

- Enforced CI first pass: wire `npm run audit:security` and `npm run hardening:runtime` into CI.
- Dependency audit threshold: fail on high or critical npm advisories.
- Runtime/Nginx threshold: fail on owned runtime invariant violations.
- Container vulnerability threshold: make high or critical Trivy vulnerability findings fail `npm run hardening:trivy` for local and release-prep image-scan evidence.
- Manifest posture handling: keep `npm run hardening:kube-linter` advisory during the first pass.
- Failure owner: repository maintainers.
- Exception requirements: each exception must name the finding or advisory, affected package or path, current risk, owner, mitigation or planned fix, expiration or revisit trigger, and release decision.
- Evidence: command output and CI logs are enough for the first implementation; retained hardening report artifacts can be selected later if stable report files are chosen.

Tasks:

- T-HARDEN-001: Implement selected failure behavior for high or critical npm advisories, runtime invariant violations, and high or critical Trivy findings.
- T-HARDEN-007: Wire `npm run audit:security` and `npm run hardening:runtime` into CI as enforced checks.
- T-HARDEN-008: Keep manifest posture findings advisory until a stable kube-linter failure threshold is selected.
- T-HARDEN-009: Document hardening command usage, CI behavior, exception requirements, report locations, and repository-maintainer ownership.

Acceptance Criteria:

- CI fails on high or critical npm audit advisories.
- CI fails on owned runtime/Nginx hardening invariant violations.
- `npm run hardening:trivy` fails on high or critical Trivy vulnerability findings when Docker, image, and Trivy prerequisites are available.
- `npm run hardening:kube-linter` remains visible advisory evidence and does not fail release work during the first pass.
- Documentation records command usage, CI behavior, exception requirements, report locations, and repository-maintainer ownership.

#### E-HARDEN-002: Deferred Hardening Scope

Labels: `type:epic`, `milestone:M-QUALITY-001`, `status:done`

Selected Decisions:

- SBOM and license inventory: use SPDX JSON, publish the SBOM as a GitHub Release asset, attach SBOM evidence to the GHCR image through GitHub artifact attestation/provenance, and keep license findings report-only.
- Bundle and asset budgets: add a soft advisory threshold based on the current build baseline plus 10% drift; budget warnings must not fail CI or release work during the first pass.
- GitHub Actions pinning: pin workflow actions to commit SHAs and keep Dependabot GitHub Actions updates active so pinned references stay current.
- Security lint scope: Trivy, CodeQL, and ESLint must stay clean; do not add custom security lint rules until a repeated issue pattern is missed by those selected tools.
- Retained artifacts: upload Trivy reports and CodeQL SARIF as GitHub Actions artifacts with 14-day retention where those checks run; CodeQL code scanning remains the primary security surface.

Tasks:

- T-HARDEN-002: Add SPDX JSON SBOM and report-only license inventory evidence to release publication and GHCR image attestation/provenance.
- T-HARDEN-003: Add soft bundle-size and asset-budget evidence using the current build baseline plus a 10% warning threshold.
- T-HARDEN-004: Pin GitHub Actions workflow actions to commit SHAs while preserving Dependabot action-update maintenance.
- T-HARDEN-005: Confirm the selected security lint scope stays limited to Trivy, CodeQL, and ESLint unless repeated misses justify a later custom rule set.
- T-HARDEN-006: Upload retained Trivy report and CodeQL SARIF artifacts for GitHub Actions runs that produce those reports.

Acceptance Criteria:

- Release publication produces an SPDX JSON SBOM, attaches it to the GitHub Release, and attaches SBOM evidence to the GHCR image through GitHub artifact attestation/provenance.
- License inventory findings remain report-only until a separate license allow/deny policy is selected.
- Bundle and asset budget output warns on more than 10% drift from the selected baseline without failing CI or release work.
- Workflow actions are pinned to commit SHAs and remain covered by Dependabot GitHub Actions updates.
- Trivy, CodeQL, and ESLint remain the selected security lint surfaces; custom security rules stay out of scope until a repeated missed pattern is documented.
- Trivy reports and CodeQL SARIF are retained as GitHub Actions artifacts for 14 days where those checks run.

## Blocked Backlog

Blocked items are planned work, but they need a product choice, stable threshold, credential, owner, or repeatable failure before implementation can start.

No blocked backlog items are selected at this time.

## Product Non-Goals

These are deliberate product and integration boundaries for the current roadmap.

- Alternate API transports, cross-origin browser support, JWT, and bearer-token auth.
- Backend-only operations and deployment runbooks until this frontend owns a deployment target or runtime operations responsibility.
- Backend-specific Gradle, REST Docs, Flyway, restore-drill, application Helm, Kubernetes, and post-deploy smoke gates by default.
- Environment-specific deployment promotion beyond the GHCR package, checked-in reference manifests, and GitHub Release workflow.
- Generic command wrappers, broad workflow-state directories, and reusable execution scaffolding remain non-goals unless selected by a concrete owner; the completed dev-server and smoke helpers are the current narrow exception owned by local-development docs and validation references.
