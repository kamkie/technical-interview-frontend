# Roadmap

This roadmap tracks the planned first-party frontend for `technical-interview-demo`.
Released history belongs in `CHANGELOG.md`.

## Current Project State

| Field                  | Current                                                                              |
|------------------------|--------------------------------------------------------------------------------------|
| Release phase          | Pre-implementation                                                                   |
| Integration branch     | `main`                                                                               |
| Breaking-change policy | Flexible until the first public frontend release                                     |
| Next target version    | `0.1.0`                                                                              |
| Frontend stack         | Vite + React + TypeScript                                                            |
| Package manager        | npm                                                                                  |
| Node.js version        | 24.x                                                                                 |
| Validation commands    | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` |
| Immediate next action  | Add CI pipeline coverage for npm validation commands                                 |

## Active Work

Initial app scaffolding is in place. Backend contract type generation is available
from the imported OpenAPI contract, and the app bootstraps browser session state
from `GET /api/session`. The first public books/categories read flow is in place
with pagination, repeated filters, and localized error handling.

## Up Next

1. Add CI pipeline coverage for the npm validation commands once the repository has a
   selected CI target.

## Later

- Authenticated account UI.
- Admin/operator surfaces for backend-supported admin APIs.
- Browser smoke or e2e coverage for login/logout once the local backend workflow is
  documented.

## Roadmap Rules

- Keep this file focused on selected, planned, or deferred work.
- Use `CHANGELOG.md` for shipped history.
- Add a separate spec only when user-facing behavior is too broad or ambiguous for a
  roadmap row.
- Keep backend API assumptions out of this file; the imported backend contract under
  `docs/backend/` owns those details.
