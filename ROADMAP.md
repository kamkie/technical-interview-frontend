# Roadmap

This roadmap tracks the planned first-party frontend for `technical-interview-demo`.
Released history belongs in `CHANGELOG.md`.

## Current Project State

| Field | Current |
| --- | --- |
| Release phase | Pre-implementation |
| Integration branch | `main` |
| Breaking-change policy | Flexible until the first public frontend release |
| Next target version | `0.1.0` |
| Frontend stack | Vite + React + TypeScript |
| Package manager | npm |
| Node.js version | 24.x |
| Validation commands | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Immediate next action | Generate or verify API types from the imported backend OpenAPI contract |

## Active Work

Initial app scaffolding is in place. The next implementation slice is backend contract
type workflow.

## Up Next

1. Add backend contract import to the development workflow and generate or verify API
   types from `docs/backend/approved-openapi.json`.
2. Implement the session bootstrap client around `GET /api/session`, including CSRF
   metadata handling and login-provider rendering.
3. Build the first public read flow for books/categories using backend pagination,
   repeated filters, and localization rules.

## Later

- Authenticated account UI.
- Admin/operator surfaces for backend-supported admin APIs.
- Browser smoke or e2e coverage for login/logout once the local backend workflow is
  documented.
- CI pipeline for the npm validation commands.

## Roadmap Rules

- Keep this file focused on selected, planned, or deferred work.
- Use `CHANGELOG.md` for shipped history.
- Add a separate spec only when user-facing behavior is too broad or ambiguous for a
  roadmap row.
- Keep backend API assumptions out of this file; the imported backend contract under
  `docs/backend/` owns those details.
