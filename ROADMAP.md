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
| Immediate next action | Choose the frontend stack and scaffold the app shell |

## Active Work

No active implementation work is selected.

## Up Next

1. Choose frontend stack, package manager, Node.js version, and validation commands.
2. Scaffold the app shell and update `README.md`, `SETUP.md`, `AGENTS.md`, and
   `.gitignore` for the chosen tooling.
3. Add backend contract import to the development workflow and generate or verify API
   types from `docs/backend/approved-openapi.json`.
4. Implement the session bootstrap client around `GET /api/session`, including CSRF
   metadata handling and login-provider rendering.
5. Build the first public read flow for books/categories using backend pagination,
   repeated filters, and localization rules.

## Later

- Authenticated account UI.
- Admin/operator surfaces for backend-supported admin APIs.
- Browser smoke or e2e coverage for login/logout once the local backend workflow is
  documented.
- CI pipeline after the app scaffold and validation commands exist.

## Roadmap Rules

- Keep this file focused on selected, planned, or deferred work.
- Use `CHANGELOG.md` for shipped history.
- Add a separate spec only when user-facing behavior is too broad or ambiguous for a
  roadmap row.
- Keep backend API assumptions out of this file; the imported backend contract under
  `docs/backend/` owns those details.
