# Contributing

This repository is not yet scaffolded as an application. Until it is, most changes are
documentation, backend-contract import, or project setup work.

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

Current minimum validation for docs and guidance changes:

```powershell
git diff --check
```

After the app scaffold exists, contributors must use the package scripts documented in
`SETUP.md` and `AGENTS.md`.

## Commit Messages

Use Conventional Commits with the project metadata footers described in `.gitmessage`
for AI-authored commits.
