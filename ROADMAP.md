# Roadmap

This roadmap tracks the planned first-party browser frontend for the sibling
`technical-interview-demo` backend. Released history belongs in `CHANGELOG.md`.

## Current Baseline

| Field | Current |
| --- | --- |
| Release phase | Pre-release foundation |
| Next target version | `0.1.0` |
| Frontend stack | Vite + React + TypeScript |
| Runtime | Node.js 24.x, npm 11.x |
| Backend integration | Same-origin `/api/**` browser traffic |
| Contract source | `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md` |
| Implemented surface | Session bootstrap, login-provider rendering, public book/category reads |
| Validation baseline | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |

The app currently bootstraps browser session state with `GET /api/session`, renders
login options from session metadata, generates checked OpenAPI TypeScript types, and
shows the first public catalog flow for books and categories with contract-shaped
pagination, repeated filters, and localized backend error display.

## Product Direction

- Build a contract-first browser UI for the backend's supported public,
  authenticated-account, and admin/operator API surfaces.
- Keep integration same-origin and session-cookie based.
- Prefer thin route/page experiences backed by a small shared API client layer.
- Add tests at the smallest useful layer for each user-visible behavior.
- Treat backend contract artifacts as the owner for endpoint shape and durable API
  rules.

## Milestones

| Milestone | Status | Scope | Done when |
| --- | --- | --- | --- |
| M0 - Foundation | In progress | Project scaffold, generated API types, session bootstrap, public catalog reads | Existing validation baseline passes and the app can render session plus catalog states from `/api/session`, `/api/books`, and `/api/categories` |
| M1 - CI and Quality Gate | Next | Repository automation for canonical npm validation commands | CI runs lint, typecheck, tests, build, and whitespace checks on pull requests or the selected branch workflow |
| M2 - Public Catalog UX | Planned | Read-only catalog refinement for search, filters, pagination, loading, empty, and localized error states | Users can scan and filter public books without relying on implementation placeholders; component tests cover visible states |
| M3 - Authenticated Session UX | Planned | Account-aware header/state, logout flow, and route guarding for authenticated-only areas | UI refreshes session after login/logout paths, mirrors CSRF metadata for unsafe authenticated writes, and has smoke or e2e coverage for the affected flow |
| M4 - Account Surfaces | Planned | Backend-supported account profile and self-service flows | Account UI only appears after session bootstrap establishes the current user and tests cover unauthenticated and authenticated states |
| M5 - Admin/Operator Surfaces | Deferred | Backend-supported admin APIs for books, categories, localization, audit, and user management | Scope is selected from the imported backend contract and split into smaller specs before implementation |

## Near-Term Backlog

1. Select the CI target and add a workflow that runs the validation baseline.
2. Tighten public catalog UI behavior before expanding into authenticated writes.
3. Introduce a shared mutation helper only when the first unsafe write is implemented.
4. Add browser smoke or e2e coverage once login/logout can be exercised against a
   documented local backend workflow.
5. Revisit the admin/operator scope after account and CSRF behavior are proven in the
   frontend.

## Deferred Scope

- Alternate API transports, cross-origin browser support, JWT, and bearer-token auth.
- Hard-coded OAuth provider paths outside the session bootstrap response.
- Admin/operator workflows before their backend-supported scope is selected.
- Broad visual design work that is not tied to an implemented user flow.

## Roadmap Rules

- Keep this file focused on selected, planned, or deferred frontend work.
- Use `CHANGELOG.md` for shipped history.
- Add a separate spec only when user-facing behavior is too broad or ambiguous for a
  roadmap row.
- Keep endpoint fields, request schemas, auth header details, and durable API rules in
  `docs/backend/` or executable tests, not in this roadmap.
- Update this file when roadmap or product scope changes; update `SETUP.md`,
  `README.md`, or package configuration only when their owned behavior changes.
