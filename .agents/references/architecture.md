# Frontend Architecture Reference

This file owns implementation-facing placement guidance for the frontend. Use it when adding or moving routes, API modules, client helpers, generated types, components, hooks, tests, or shared UI abstractions.

## Source Of Truth

- Product and design intent belongs in `docs/DESIGN.md`; roadmap selection, stable IDs, status, dependencies, blocked backlog, and product non-goals belong in `ROADMAP.md`.
- Backend API behavior belongs to `docs/backend/approved-openapi.json`, `docs/backend/FRONTEND_AI_CONTRACT.md`, and `docs/backend/README.md`; do not encode alternate endpoint behavior in frontend architecture.
- Validation selection belongs in `.agents/references/testing.md`; review triggers belong in `.agents/references/reviews.md`; troubleshooting paths belong in `.agents/references/troubleshooting.md`.
- Use generated types from `src/api/generated/openapi.ts` for backend-shaped data when the imported contract exposes the shape.

## Route And Page Boundaries

- Keep route-level components responsible for route context, access boundaries, query-state wiring, page-level loading and error states, and composition of feature components.
- Keep feature folders aligned to user workflows such as `catalog`, `account`, `admin`, `operator`, `auth`, and `routing`; avoid grouping primary UI by backend endpoint names alone.
- Public catalog, account, admin, and operator routes should remain distinct enough that navigation and tests can describe the user workflow being changed.
- Route guards and session-dependent pages must preserve the backend contract: bootstrap with `GET /api/session`, use session metadata for login, account, logout, and CSRF behavior, and avoid JWT, bearer-token, CORS-first, or provider-path assumptions.
- Do not make diagnostics, mock controls, or implementation proof points the primary route model unless a selected roadmap item explicitly makes them user-facing.

## API And Client Placement

- Put endpoint-specific request construction, response parsing, and error normalization in `src/api/` modules; keep React components from assembling raw contract details when an API helper can own them.
- Keep shared request mechanics such as same-origin `/api/**`, credentials, CSRF header mirroring, localization headers or params, query encoding, and error handling centralized in the smallest existing client helper that fits.
- Preserve Spring pagination conventions with `page`, `size`, and repeated `sort`; preserve repeated filters such as repeated `category` where documented; include a book `version` value when updating books.
- Treat localized response messages as display content. Branch on stable fields such as status, `messageKey`, endpoint context, route context, or typed data fields.
- Regenerate or check `src/api/generated/openapi.ts` only through the repository API type scripts; do not hand-edit generated bindings.
- If imported backend artifacts appear stale or conflict with the backend repository during API-facing work, refresh `docs/backend/` before changing client behavior.

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

- Do not invent endpoints, request fields, authentication headers, CORS requirements, alternate transports, or OAuth provider paths.
- Do not introduce backend-only Gradle, Flyway, REST Docs, deployment runbook, Kubernetes, or operations weight into frontend architecture.
- Do not add a marketing landing page, decorative shell, or diagnostic-first home screen when the task is about the browser product.
- Do not promote advisory hardening, accessibility, smoke, or release checks into mandatory gates before the roadmap or owner document selects thresholds, owners, and failure behavior.
