# Technical Interview Frontend

Technical Interview Frontend is the planned first-party browser UI for the sibling
`technical-interview-demo` backend. It will consume the backend's compact `/api/**`
surface, session-cookie authentication, CSRF metadata, localization behavior, and
published OpenAPI contract.

## Status

The repository has an initial Vite app scaffold for the first-party browser UI. The
selected stack is React, TypeScript, Vite, Node.js 24.x, and npm.

Current useful artifacts:

- `AGENTS.md` - AI rules for frontend/backend contract work
- `package.json` and `package-lock.json` - canonical npm project metadata
- `src/` - initial React app shell and component test
- `docs/backend/` - imported backend contract artifacts for frontend agents
- `ROADMAP.md` - next implementation steps
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

## Supported Scope

Planned scope:

- browser UI for public book, category, localization, and session flows
- authenticated account-oriented UI
- admin/operator surfaces for backend-supported admin APIs, once selected
- same-origin deployment against `technical-interview-demo`

Out of scope unless explicitly planned:

- standalone API server behavior
- alternate backend transports
- JWT or bearer-token auth flows
- CORS-first browser integration

## Quick Start

Prerequisites:

- Node.js 24.x
- npm 11.x

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
