# Documentation

This index points humans to the durable documentation owners for the frontend
repository.

| Need | Read |
| --- | --- |
| Project overview and current surface | [`README.md`](../README.md) |
| Development lifecycle and artifact routing | [`docs/DEVELOPMENT_LIFECYCLE.md`](DEVELOPMENT_LIFECYCLE.md) |
| Local setup, commands, CI reproduction, troubleshooting | [`docs/LOCAL_DEVELOPMENT.md`](LOCAL_DEVELOPMENT.md) |
| Local same-origin auth smoke workflow | [`docs/LOCAL_AUTH_SMOKE.md`](LOCAL_AUTH_SMOKE.md) |
| Working with AI agents | [`docs/WORKING_WITH_AI.md`](WORKING_WITH_AI.md) |
| Current roadmap, release state, deferred scope | [`ROADMAP.md`](../ROADMAP.md) |
| Completed roadmap archive | [`docs/ROADMAP_ARCHIVE.md`](ROADMAP_ARCHIVE.md) |
| Released and candidate history | [`CHANGELOG.md`](../CHANGELOG.md) |
| Contributor entry point | [`CONTRIBUTING.md`](../CONTRIBUTING.md) |
| Vulnerability reporting policy | [`SECURITY.md`](../SECURITY.md) |
| Imported backend contract artifacts | [`docs/backend/`](backend/) |
| Selected behavior specs | [`docs/specs/`](specs/) |
| Infrastructure deployment references | [`infra/`](../infra/) |

## Ownership Rules

Use the smallest owner that covers the change. Put setup commands and local
troubleshooting in `docs/LOCAL_DEVELOPMENT.md`, lifecycle and artifact-routing rules
in `docs/DEVELOPMENT_LIFECYCLE.md`, AI collaboration guidance in
`docs/WORKING_WITH_AI.md`, selected product or release scope in `ROADMAP.md`, and
completed roadmap summaries in `docs/ROADMAP_ARCHIVE.md`.

Do not duplicate full procedures in entry-point docs. Link to the owner and update
the owner when the procedure changes.
