# Roadmap

This roadmap tracks the planned first-party browser frontend for the sibling
`technical-interview-demo` backend. Released history belongs in `CHANGELOG.md`.

## Current Baseline

| Field               | Current                                                                              |
|---------------------|--------------------------------------------------------------------------------------|
| Release phase       | Pre-release foundation                                                               |
| Next target version | `0.1.0`                                                                              |
| Frontend stack      | Vite + React + TypeScript                                                            |
| Runtime             | Node.js 24.x, npm 11.x                                                               |
| Routing target      | React Router                                                                         |
| CI target           | GitHub Actions                                                                       |
| Backend integration | Same-origin `/api/**` browser traffic                                                |
| Contract source     | `docs/backend/approved-openapi.json` and `docs/backend/FRONTEND_AI_CONTRACT.md`      |
| Implemented surface | Session bootstrap, login-provider rendering, public book/category reads              |
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

| Milestone                         | Status      | Scope                                                                                                    | Done when                                                                                                                                                 |
|-----------------------------------|-------------|----------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| M0 - Foundation                   | In progress | Project scaffold, generated API types, session bootstrap, public catalog reads                           | Existing validation baseline passes and the app can render session plus catalog states from `/api/session`, `/api/books`, and `/api/categories`           |
| M1 - CI and Quality Gate          | Next        | GitHub Actions workflow for canonical npm validation commands                                            | CI runs lint, typecheck, tests, build, and whitespace checks on pull requests or the selected branch workflow                                             |
| M2 - Simple Public Catalog UX     | Planned     | Basic table layout with read-only search, filters, pagination, loading, empty, localized errors, and mock/test fixtures for each visible state | Users can scan and filter public books without relying on implementation placeholders; component tests cover fixture-backed visible states                |
| M3 - Advanced Catalog Controls    | Planned     | React Router route-level navigation with browser history expectations, richer table controls, URL-synced filters, sorting UI, and deeper catalog state handling | Users can share filtered catalog URLs, adjust sorting through the UI, navigate with browser back/forward controls, and use richer table controls with tests covering route/query-state synchronization |
| M4 - Local Auth Workflow Docs     | Planned     | Document repeatable local same-origin auth against `..\technical-interview-demo`, including backend startup, Vite `/api` proxy wiring, OAuth setup, manual smoke steps, and automation limits | `SETUP.md` links to a local auth smoke doc covering `local,oauth` startup, provider credentials, admin identity seeding, session/account/logout checks, CSRF handling, and anonymous-vs-authenticated automation policy |
| M5 - Authenticated Session UX     | Planned     | Account-aware header/state, logout flow, and route guarding for authenticated-only areas                 | UI refreshes session after login/logout paths, mirrors CSRF metadata for unsafe authenticated writes, and has smoke or e2e coverage based on the documented local workflow |
| M6 - Account Profile Surface      | Planned     | Read-only account profile page plus account-aware menu/header                                            | Account UI only appears after session bootstrap establishes the current user and tests cover unauthenticated and authenticated states                     |
| M7 - Account Language Preference  | Planned     | Account self-service flow for reading, updating, and clearing the current user's preferred language      | Users can update or clear the contract-backed account language preference with CSRF handling and tests for loading, success, validation/error, unauthenticated, and missing-CSRF states |
| M8 - Admin Catalog Management     | Planned     | Combined backend-supported admin book and category management                                            | Combined book/category admin scope is selected from the imported backend contract, split into a small spec, and covered by tests for list, create, update, delete, and error states |
| M9 - Admin Localization Management | Planned    | Backend-supported localization message-key editing plus locale coverage/status                           | Localization admin scope is selected from the imported backend contract, split into a small spec, and covered by tests for supported locales, message edits, coverage/status states, and localized failures |
| M10 - Operator Audit Surface      | Planned     | Read-only operator overview plus pageable audit log with filters for target type, action, and actor      | Operators can inspect runtime/status summaries, recent audit entries, filtered pageable audit rows, and audit details with tests for access, loading, empty, filtered, paginated, localized error, and partial-payload states |
| M11 - Admin User Management       | Planned     | Admin user list/detail with contract-backed role management                                              | Admins can review user profiles, roles, and role-grant provenance, then replace managed roles with CSRF handling and tests for access, empty, success, validation, localized error, and missing-CSRF states |

## Near-Term Backlog

1. Add a GitHub Actions workflow that runs the validation baseline.
2. Tighten simple public catalog UI behavior before expanding into advanced catalog
   controls or authenticated writes.
3. Document the local backend login/logout workflow against
   `..\technical-interview-demo` before implementing authenticated session UX.
4. Introduce a shared mutation helper only when the first unsafe write is implemented.
5. Revisit account self-service and the first admin/operator slice after account
   profile and CSRF behavior are proven in the frontend.

## Pragmatic Smoke Split

- Public catalog milestones can use anonymous browser smoke or e2e coverage against
  the sibling backend at `..\technical-interview-demo`, validating session bootstrap,
  categories, books, filters, pagination, and localized read errors.
- Authenticated session and logout coverage should wait for M4's documented local
  backend auth workflow. Once that workflow exists, browser coverage should exercise
  login-provider rendering from session metadata, session refresh after login/logout,
  and CSRF handling for unsafe authenticated writes.

## Implementation Defaults

- M1 CI should add `.github/workflows/ci.yml`, trigger on pull requests and pushes to
  `main`, use Node.js 24.x with `npm ci`, and run lint, typecheck, tests, build, and
  `git diff --check`.
- M2 table columns should be title, author, publication year, ISBN, and categories.
  Pagination stays button-based in M2; richer table controls belong to M3.
- M2 fixture-backed visible states should use shared fixtures under
  `src/test/fixtures/`, covering loading, populated, empty, filtered, paginated,
  localized book error, and category error states.
- M4 local auth documentation should live at `docs/LOCAL_AUTH_SMOKE.md` and be linked
  from `SETUP.md`.
- M4 local same-origin development should use a Vite `/api` proxy to
  `http://localhost:8080` for the backend running from `..\technical-interview-demo`.

## Deferred Scope

- Alternate API transports, cross-origin browser support, JWT, and bearer-token auth.
- Hard-coded OAuth provider paths outside the session bootstrap response.
- Admin/operator workflows outside the selected milestone and spec scope.
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
