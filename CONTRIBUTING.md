# Contributing

This repository is a Vite, React, and TypeScript frontend for the sibling `technical-interview-demo` backend. Most changes should stay contract-first: update the owning spec, doc, or test alongside implementation when user-visible behavior or repository rules change.

## Start Here

1. Read [docs/README.md](docs/README.md) to find the owning document.
2. Use [docs/DEVELOPMENT_LIFECYCLE.md](docs/DEVELOPMENT_LIFECYCLE.md) to route the change.
3. Use [docs/DESIGN.md](docs/DESIGN.md) for frontend product and design intent.
4. Use [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) for setup and validation.
5. For AI-assisted work, use [docs/WORKING_WITH_AI.md](docs/WORKING_WITH_AI.md).

API-facing frontend work must follow the imported backend artifacts under [docs/backend/](docs/backend/). Do not invent backend endpoints, request fields, auth flows, or browser integration behavior.

## Validation

Validation commands are owned by [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md). Report skipped checks with the reason in handoff.

## Commits

Do not commit unless the current task authorizes it. Use Conventional Commits with the project metadata footers described in `.gitmessage` for AI-authored commits.
