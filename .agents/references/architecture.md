# Frontend Architecture Reference

This file owns implementation-facing placement guidance for the frontend. Use it when adding or moving routes, API modules, client helpers, generated types, components, hooks, tests, or shared UI abstractions.

## Owner Boundaries

Use `docs/backend/` for exact API behavior, `docs/DESIGN.md` for product and design intent, `ROADMAP.md` for selected scope and status, `.agents/references/testing.md` for validation, `.agents/references/reviews.md` for review triggers, and `.agents/references/troubleshooting.md` for failure triage.

## Route And Page Boundaries

- Keep route-level components responsible for route context, access boundaries, query-state wiring, page-level loading and error states, and composition of feature components.
- Keep feature folders aligned to user workflows such as `catalog`, `account`, `admin`, `operator`, `auth`, and `routing`; avoid grouping primary UI by backend endpoint names alone.
- Public catalog, account, admin, and operator routes should remain distinct enough that navigation and tests can describe the user workflow being changed.
- Route guards and session-dependent pages must preserve the imported backend contract and keep public, account, admin, and operator access boundaries visible in route structure.
- Do not make diagnostics, mock controls, or implementation proof points the primary route model unless a selected roadmap item explicitly makes them user-facing.

## API And Client Placement

- Put endpoint-specific request construction, response parsing, and error normalization in `src/api/` modules; keep React components from assembling raw contract details when an API helper can own them.
- Keep shared request mechanics, query encoding, generated types, and error handling centralized in the smallest existing client helper that fits.
- Branch on stable typed fields and endpoint or route context, not localized display text.
- Regenerate or check `src/api/generated/openapi.ts` only through the repository API type scripts; do not hand-edit generated bindings.
- If imported backend artifacts appear stale or conflict with the backend repository during API-facing work, follow `docs/backend/README.md` before changing client behavior.

## Component And Test Placement

- Place feature components beside their route or workflow folder when they are specific to that surface; place broadly reusable visual or state helpers in `src/ui/` only after at least two real callers need the same abstraction.
- Keep tests close to the behavior they protect: route or component tests for visible workflows, API module tests for request and response behavior, mock API tests for local mock behavior, and routing helper tests for query-state encoding.
- Shared test fixtures belong under `src/test/` when they represent cross-feature data; feature-only fixtures should stay with the feature test.
- Prefer tests that assert stable roles, labels, state semantics, URL query state, request shape, and typed behavior rather than localized English response text.

## Shared Abstractions

- Add a shared abstraction only when it removes meaningful duplication or centralizes a contract-sensitive rule; do not add framework layers, global stores, command wrappers, workflow-state directories, or generic architecture scaffolds for one use case.
- Keep async state, mutation feedback, formatting, pagination, and query-state helpers small and explicit; preserve existing helper names and calling patterns when extending them.
- Keep state ownership local until behavior is genuinely shared across routes. Lift state to a hook or shared helper only when it clarifies data flow or protects a backend-contract invariant.
- Avoid abstractions that hide whether a route is public, authenticated, admin-only, or operator-facing.

## Documentation And Spec Boundaries

- Use `docs/specs/` only when the intended frontend behavior is too broad or ambiguous for `ROADMAP.md` and `docs/DESIGN.md`; do not use frontend specs to redefine backend endpoints or schemas.
- Update `docs/DESIGN.md` for durable product or design intent, not for implementation notes.
- Update `ROADMAP.md` only when selected scope, status, dependencies, release context, blocked backlog, or product non-goals change.
- Keep active plans in `.agents/plans/` as coordination artifacts; move durable architecture rules into this file or another focused owner before plan completion.

## What Not To Add

- Do not encode alternate backend behavior in frontend architecture.
- Do not introduce backend-only Gradle, Flyway, REST Docs, deployment runbook, Kubernetes, or operations weight into frontend architecture.
- Do not add a marketing landing page, decorative shell, or diagnostic-first home screen when the task is about the browser product.
- Do not promote advisory hardening, accessibility, smoke, or release checks into mandatory gates before the roadmap or owner document selects thresholds, owners, and failure behavior.
