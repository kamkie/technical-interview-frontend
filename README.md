# Technical Interview Frontend

Technical Interview Frontend is the first-party browser UI for the sibling
`technical-interview-demo` backend. It consumes the backend's compact `/api/**`
surface, session-cookie authentication, CSRF metadata, localization behavior, and
published OpenAPI contract.

## Status

The repository contains a Vite, React, and TypeScript app for the selected `0.1.0`
release candidate. Package metadata is already versioned as `0.1.0`, but no
frontend release tag has been cut yet. The app bootstraps browser session state from
the backend session contract, renders metadata-driven login/logout controls,
supports the public catalog, account profile and language preference flows, and
implements the selected admin and operator surfaces.

Current useful artifacts:

- `AGENTS.md` - AI rules for frontend/backend contract work
- `package.json` and `package-lock.json` - canonical npm project metadata
- `src/` - React routes, API clients, components, and focused tests
- `src/api/session.ts` - typed session bootstrap client and CSRF header helper
- `src/api/catalog.ts` - typed books/categories read and write client
- `src/api/account.ts` - typed account profile and language preference client
- `src/api/localizations.ts` - typed localization management client
- `src/api/adminUsers.ts` - typed admin user management client
- `src/api/operator.ts` - typed operator overview and audit-log client
- `src/api/generated/openapi.ts` - generated TypeScript API types from the imported
  OpenAPI contract
- `docs/backend/` - imported backend contract artifacts for frontend agents
- `docs/specs/` - selected admin/operator behavior specs
- `ROADMAP.md` - current implementation status and next release-hardening work
- `SETUP.md` - current local setup notes

## Backend Contract

Backend-facing frontend work must follow the imported contract artifacts:

- `docs/backend/approved-openapi.json`
- `docs/backend/FRONTEND_AI_CONTRACT.md`
- `docs/backend/README.md`

Refresh them from the sibling backend repository with:

```powershell
./scripts/sync-backend-contract.ps1
```

Regenerate checked-in API types from the imported OpenAPI contract with:

```powershell
npm run api:types
```

`npm run typecheck` verifies that the generated types still match
`docs/backend/approved-openapi.json`.

## Supported Scope

Implemented or selected scope:

- browser UI for public book, category, localization, and session flows
- authenticated account profile, language preference, and logout flows
- admin catalog, localization, and user-management surfaces
- operator overview and audit-log surface
- same-origin deployment against `technical-interview-demo`

Out of scope unless explicitly planned:

- standalone API server behavior
- alternate backend transports
- JWT or bearer-token auth flows
- CORS-first browser integration

## Quick Start

Prerequisites:

- Node.js 24.x
- npm 11.x; `package.json` pins the canonical package manager to `npm@11.14.1`

Install dependencies:

```powershell
npm install
```

Run the local development server:

```powershell
npm run dev
```

The dev server binds to `http://127.0.0.1:5173/`.

Validate a change:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

## Documentation Map

| Need | Read |
| --- | --- |
| AI rules and backend-contract invariants | `AGENTS.md` |
| Local setup and commands | `SETUP.md` |
| Current implementation sequence | `ROADMAP.md` |
| Imported backend contract artifacts | `docs/backend/` |
| Released history | `CHANGELOG.md` |
| Contributor expectations | `CONTRIBUTING.md` |
