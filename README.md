# Technical Interview Frontend

Technical Interview Frontend is the first-party browser UI for the sibling
`technical-interview-demo` backend. It consumes the backend's compact `/api/**`
surface, session-cookie authentication, CSRF metadata, localization behavior, and
published OpenAPI contract.

## Status

The repository contains a Vite, React, and TypeScript app for the local `v0.1.0`
release. The tag has been cut locally but has not been published remotely.

Implemented surface includes session bootstrap, metadata-driven login/logout
controls, public catalog flows, account profile and language preference flows, admin
catalog/localization/user-management surfaces, and the operator overview/audit-log
surface.

## Documentation

Start with the human documentation index:

- [docs/README.md](docs/README.md) - documentation map and ownership rules
- [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) - setup, npm commands, CI
  reproduction, troubleshooting, contract refresh, and smoke workflow
- [docs/DEVELOPMENT_LIFECYCLE.md](docs/DEVELOPMENT_LIFECYCLE.md) - lifecycle,
  artifact routing, and when to use roadmap rows, specs, plans, ADRs, and changelog
  entries
- [docs/WORKING_WITH_AI.md](docs/WORKING_WITH_AI.md) - human guidance for AI-assisted
  planning, implementation, validation, review, and release preparation

Other useful entry points:

- [ROADMAP.md](ROADMAP.md) - selected scope, release state, and deferred work
- [CHANGELOG.md](CHANGELOG.md) - released and candidate history
- [CONTRIBUTING.md](CONTRIBUTING.md) - contributor orientation
- [SECURITY.md](SECURITY.md) - vulnerability reporting and supported security-fix lines
- [docs/backend/](docs/backend/) - imported backend contract artifacts
- [docs/specs/](docs/specs/) - selected admin/operator behavior specs
- [infra/](infra/) - Kubernetes/Kustomize and Helm deployment references

## Quick Start

Prerequisites are Node.js 24.x and npm 11.x. The canonical package manager is pinned
in `package.json`.

```powershell
npm install
npm run dev
```

The dev server binds to `http://127.0.0.1:5173/`. Full local workflow and validation
commands live in [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md).

Build the production container image when validating Docker or release workflow
changes:

```powershell
npm run docker:build
```

## Backend Contract

Backend-facing frontend work must follow the imported contract artifacts in
[docs/backend/](docs/backend/). Do not invent endpoints, request fields,
authentication headers, CORS requirements, or alternate transports. Contract refresh
and API type commands are owned by
[docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md).
