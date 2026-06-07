# Security Policy

This repository is the first-party browser frontend for the sibling
`technical-interview-demo` backend. Security reports for this frontend should stay
private until maintainers have triaged the issue and prepared any needed fix.

## Supported Versions

Security fixes target the active `main` branch. Until a remote frontend release is
published, `main` is the only supported security-fix line.

| Version or line | Supported |
| --- | --- |
| `main` | Yes |
| Latest published GitHub release | Yes, once one exists |
| Older tags, archived roadmap states, or feature branches | No, unless maintainers explicitly select a backport |

## Reporting a Vulnerability

Use GitHub private vulnerability reporting for this repository when it is available.
If private vulnerability reporting is unavailable, contact a maintainer through a
private channel instead of opening a public issue, pull request comment, or
discussion with exploit details.

Include as much of the following as you can:

- affected commit, branch, tag, or release
- affected browser, Node.js, npm, container, or deployment environment
- steps to reproduce or a minimal proof of concept
- expected and actual impact
- whether the issue appears frontend-only, backend-only, or cross-repository
- any relevant request paths, response details, logs, or screenshots with secrets
  removed

Report backend vulnerabilities in the sibling `technical-interview-demo` repository.
If a finding spans both repositories, report it privately and identify both affected
repositories so maintainers can coordinate the fix.

## Frontend Security Scope

Frontend security work must preserve the backend contract:

- browser traffic targets same-origin `/api/**`
- authentication is session-cookie based
- login, logout, account, and CSRF behavior come from `GET /api/session` metadata
- the frontend does not add CORS-first flows, JWT or bearer-token assumptions, or
  alternate transports

In-scope frontend findings include issues in the React application, API client
behavior, dependency lockfile, GitHub Actions workflows, release workflow, container
image build, Nginx proxy/runtime configuration, and documentation that would cause
an unsafe supported deployment.

## Triage And Disclosure

Maintainers triage reports on a best-effort basis. This demo repository does not
offer a formal service-level agreement or bug bounty.

Maintainers should prefer a source fix, dependency update, lockfile refresh, or
configuration hardening over broad exceptions. Public disclosure should wait until a
fix, advisory, or release note is ready, unless maintainers explicitly agree on a
different coordinated-disclosure path.

Selected local and CI security signals are documented in
[`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md). At minimum, dependency
advisory triage should use:

```powershell
npm run audit:security
```
