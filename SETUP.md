# Setup

The setup owner for this frontend repository is [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md). Use it for prerequisites, npm commands, CI reproduction, troubleshooting, backend contract refresh, browser smoke workflow, and selected hardening commands.

## Quick Start

Use Node.js 24.x and npm 11.x, then run:

```powershell
npm install
npm run dev
```

The dev server binds to `http://127.0.0.1:5173/`. Use `npm run dev:mock` only for frontend-only development against the same-origin contract-backed mock API. Docker is optional for ordinary development and required only when building or validating the production container image.

## Related Workflows

- [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) - canonical local workflow
- [docs/LOCAL_AUTH_SMOKE.md](docs/LOCAL_AUTH_SMOKE.md) - manual same-origin auth smoke
- [docs/backend/](docs/backend/) - imported backend contract artifacts
