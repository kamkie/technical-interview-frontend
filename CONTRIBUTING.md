# Contributing

This repository is a Vite, React, and TypeScript frontend for the sibling
`technical-interview-demo` backend. Most changes should stay contract-first: update
the owning spec, doc, or test alongside implementation when user-visible behavior or
repository rules change.

## Before You Start

1. Read `AGENTS.md` for AI and engineering rules.
2. Check `ROADMAP.md` for the next selected work.
3. Read `SETUP.md` for the current local workflow.

## Backend Contract Discipline

API-facing frontend work must start from the imported backend artifacts under
`docs/backend/`. Refresh them from the sibling backend repository when they are stale:

```powershell
./scripts/sync-backend-contract.ps1
```

Do not invent backend endpoints, fields, auth flows, or browser integration behavior.

## Validation

Current validation follows `AGENTS.md` and `SETUP.md`:

App or tooling changes:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Docs or guidance-only changes:

```powershell
git diff --check
```

## Commit Messages

Use Conventional Commits with the project metadata footers described in `.gitmessage`
for AI-authored commits.
