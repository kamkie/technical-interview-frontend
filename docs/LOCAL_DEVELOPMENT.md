# Local Development

This document owns local setup, npm commands, CI reproduction, troubleshooting, backend contract refresh, browser smoke workflow, local hardening commands, and CI-owned hardening signals for the frontend repository.

## Prerequisites

- PowerShell 7 or Windows PowerShell
- Git
- Node.js 24.x
- npm 11.x, matching `package.json` `packageManager` and `engines`
- Docker, only when building or validating the production container image
- Playwright Chromium, only when running the anonymous browser smoke command
- Trivy, kube-linter, kubectl, and Helm when running the selected advisory M20 hardening checks locally
- Optional sibling backend checkout at `..\technical-interview-demo` for contract refreshes and local browser smoke

Default sibling layout:

```text
D:\Projects\demo\
|-- technical-interview-demo\
`-- technical-interview-frontend\
```

## Install And Run

Install dependencies:

```powershell
npm install
```

Start the Vite development server:

```powershell
npm run dev
```

The dev server binds to `http://127.0.0.1:5173/` and proxies `/api/**` requests to the local backend during development.

Start the Vite development server with the contract-backed mock API:

```powershell
npm run dev:mock
```

Mock mode binds to the same `http://127.0.0.1:5173/` origin, but installs Vite middleware for same-origin `/api/**` instead of proxying to `http://localhost:8080`. This mode is only for frontend-only development when the sibling backend is unavailable; live backend smoke remains the contract-confidence path.

Mock scenario controls:

| Variable                     | Values                       | Default   | Effect                                                                                                                               |
| ---------------------------- | ---------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `FRONTEND_MOCK_SESSION`      | `admin`, `user`, `anonymous` | `admin`   | Selects the initial mock session. `admin` exposes account, admin, and operator routes.                                               |
| `FRONTEND_MOCK_API_SCENARIO` | `success`, `empty`, `error`  | `success` | Selects normal fixtures, empty list/page data, or representative localized read failures while keeping `GET /api/session` available. |
| `FRONTEND_MOCK_API_DELAY_MS` | positive integer             | none      | Adds an artificial delay to mock `/api/**` responses.                                                                                |

The mock keeps the browser boundary contract intact: browser traffic still uses same-origin `/api/**`; login links come from `GET /api/session` metadata; logout, account path, session cookie, and CSRF names come from session metadata; unsafe authenticated writes must mirror the readable CSRF cookie into the configured header; and catalog queries preserve Spring `page`, `size`, repeated `sort`, and repeated `category` filters. Do not use mock mode to introduce CORS, JWT, bearer token, hard-coded provider paths, or contract fields that the backend does not own.

Preview a production build locally:

```powershell
npm run preview
```

The preview server binds to `http://127.0.0.1:4173/` and uses the same local `/api/**` proxy target as the dev server.

Build the production container image:

```powershell
npm run docker:build
```

Run the container locally with same-origin `/api/**` proxying to a backend on the host:

```powershell
docker run --rm -p 8080:8080 `
  -e FRONTEND_API_UPSTREAM=http://host.docker.internal:8080 `
  technical-interview-frontend
```

The container serves the app on `http://127.0.0.1:8080/` and exposes `/healthz`. Keep `FRONTEND_API_UPSTREAM` pointed at the sibling backend origin without adding browser CORS or token assumptions. On Linux hosts that do not resolve `host.docker.internal`, add Docker's host-gateway mapping or use a backend reachable from the container network.

## Infrastructure References

Reference Kubernetes and Helm assets live under [`infra/`](../infra/). They deploy the same production container image, expose Nginx on port `8080` through a service on port `80`, and keep the server-side `/api/**` proxy target in `FRONTEND_API_UPSTREAM`.

Render the Kustomize and Helm output when those assets change and the tools are available:

```powershell
kubectl kustomize infra/k8s/base
kubectl kustomize infra/k8s/overlays/local
helm template technical-interview-frontend infra/helm/technical-interview-frontend
helm template technical-interview-frontend infra/helm/technical-interview-frontend -f infra/helm/technical-interview-frontend/values-local.yaml
```

These manifests are reference assets. Deployment-specific TLS, DNS, ingress controller annotations, WAF/rate-limit policy, image promotion, and environment promotion belong in deployment-owned overlays or platform policy.

## Canonical Commands

| Task                                         | Command                         |
| -------------------------------------------- | ------------------------------- |
| Install dependencies                         | `npm install`                   |
| Run local dev server                         | `npm run dev`                   |
| Run local dev server with mock API           | `npm run dev:mock`              |
| Run production preview                       | `npm run preview`               |
| Lint                                         | `npm run lint`                  |
| Typecheck and API type freshness check       | `npm run typecheck`             |
| Run tests once                               | `npm test`                      |
| Run tests with coverage                      | `npm run test:coverage`         |
| Run tests in watch mode                      | `npm run test:watch`            |
| Build                                        | `npm run build`                 |
| Build production container image             | `npm run docker:build`          |
| Audit high-or-critical dependency advisories | `npm run audit:security`        |
| M20 advisory runtime/Nginx invariant check   | `npm run hardening:runtime`     |
| M20 advisory rendered-manifest posture check | `npm run hardening:kube-linter` |
| M20 advisory container vulnerability scan    | `npm run hardening:trivy`       |
| M20 advisory hardening checks                | `npm run hardening:m20`         |
| Anonymous same-origin browser smoke          | `npm run smoke:anonymous`       |
| Generate API types                           | `npm run api:types`             |
| Verify API types without rewriting           | `npm run api:types:check`       |
| Validate whitespace in the diff              | `git diff --check`              |

## Reproduce CI Locally

For app, tooling, release-readiness, and other executable changes, run the same baseline used by CI:

```powershell
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
npm run audit:security
git diff --check
```

CI's `Test` step adds Vitest's JUnit reporter so Codecov can ingest test results:

```powershell
npm test -- --reporter=default --reporter=junit --outputFile.junit=../test-results/vitest.junit.xml
```

CI uploads JavaScript bundle analysis to Codecov during `npm run build` on GitHub Actions. The Vite config enables a CI-only Codecov upload plugin that reads Vite/Rolldown `generateBundle` assets, chunks, and modules, then uploads through GitHub OIDC from the CI job instead of a checked-in token or local secret. Local production builds do not upload bundle analysis.

The selected local hardening command can also be run directly:

```powershell
npm run audit:security
npm run hardening:m20
```

Use Corepack to invoke the repository package manager when plain `npm` resolves outside `package.json` `engines` or `packageManager`, for example:

```powershell
corepack npm run lint
corepack npm run audit:security
```

CI installs with `npm ci`, so use `npm ci` locally when reproducing lockfile or clean install failures.

Docs and guidance-only changes may use:

```powershell
git diff --check
```

Run broader validation when a docs change also modifies package scripts, generated files, workflows, source code, or test behavior.

For Dockerfile, Nginx runtime configuration, or release image workflow changes, also run:

```powershell
npm run docker:build
```

If Docker is unavailable locally, record that explicitly and rely on the tag-driven release workflow only after maintainers accept the environment limitation.

When M20 hardening tooling or runtime config changes, also run the selected advisory checks that apply to the changed artifact. Keep generated reports out of git during the first pass; local command output, pull-request logs, or workflow logs are the evidence location. The rendered-manifest check writes scratch manifests under ignored `temp/hardening/rendered`.

## Backend Contract Refresh

Refresh imported backend contract artifacts only when they are stale, conflict with the sibling backend repository, or an API-facing task requires it:

```powershell
./scripts/sync-backend-contract.ps1
```

With a non-default backend checkout:

```powershell
./scripts/sync-backend-contract.ps1 -BackendRepo D:\path\to\technical-interview-demo
```

After refreshing the contract, regenerate checked API types:

```powershell
npm run api:types
```

Use `npm run api:types:check` when you only need to verify that `src/api/generated/openapi.ts` still matches `docs/backend/approved-openapi.json`. `npm run typecheck` already includes that freshness check.

## Browser Smoke Workflow

Manual same-origin auth smoke is documented in [`docs/LOCAL_AUTH_SMOKE.md`](LOCAL_AUTH_SMOKE.md). Use it when verifying session bootstrap, login-provider rendering, account access, CSRF-backed logout, and local backend proxy behavior.

Anonymous browser smoke can run without provider secrets:

```powershell
npm run smoke:anonymous
```

The default frontend URL is `http://127.0.0.1:5173/`. To smoke the Vite preview server or another same-origin frontend, set `FRONTEND_SMOKE_URL`, for example:

```powershell
$env:FRONTEND_SMOKE_URL = 'http://127.0.0.1:4173/'
npm run smoke:anonymous
```

The target origin must serve the frontend and proxy `/api/**` to the sibling backend. The default Vite dev and preview servers proxy `/api/**` to `http://localhost:8080` with `changeOrigin: false`; do not point the browser or smoke command directly at the backend origin.

Backend prerequisites for anonymous smoke:

- The sibling backend is running locally on `http://localhost:8080`.
- A normal local backend profile is enough for public reads, for example `SPRING_PROFILES_ACTIVE=local`. OAuth or fake-OAuth profiles are optional for this anonymous command.
- Frontend dependencies have been installed with `npm install`.
- Playwright's Chromium browser is installed. If the command reports Chromium as unavailable, run:

  ```powershell
  npx playwright install chromium
  ```

`npm run smoke:anonymous` first probes the frontend origin, then `GET /api/session` through that same origin. If the frontend is not serving, or if the backend is unavailable through the frontend `/api` proxy, the command exits successfully with a clear `skip` summary rather than recording a false pass.

When prerequisites are available, the command verifies:

- anonymous `GET /api/session` metadata, including session-cookie and CSRF metadata
- public `GET /api/categories`
- public `GET /api/books` with Spring `page`, `size`, and repeated `sort`
- URL-backed `/catalog` query state for title, author, ISBN, repeated `category`, `page`, `size`, and repeated `sort`
- browser-observed `/api/session`, `/api/categories`, and `/api/books` requests stay on the frontend origin
- a localized public-read failure using stable HTTP status, `messageKey`, and resolved `language` when the backend reproduces the documented invalid publication-year filter combination

If the backend accepts that invalid publication-year combination with `HTTP 200`, only the localized-failure step is skipped. If the backend returns problem details, the smoke branches on status, `messageKey`, and endpoint context, not English message text.

Authenticated smoke remains manual until the repository has agreed local credentials, identity seeding rules, and a canonical command.

When recording smoke evidence, include the backend profile, frontend URL, browser flow covered, validation date, and any skipped authenticated steps with the reason.

## Hardening Commands And Signals

M13 implements the selected minimum hardening set for the `0.1.0` release hardening pass.

Implemented M13 checks:

- `.github/workflows/ci.yml` has explicit read-only repository permissions and concurrency that cancels superseded pull-request runs while preserving protected-branch, tag, release, and scheduled evidence. It writes Vitest JUnit output to `test-results/vitest.junit.xml` and publishes it to Codecov as `test_results`, then runs `npm run test:coverage` and publishes `coverage/lcov.info` to Codecov with the `frontend` flag using GitHub OIDC. After the production build, the Vite config uploads bundle asset, chunk, and module metadata to Codecov through the same GitHub OIDC permission.
- `.github/workflows/codeql.yml` runs CodeQL for `javascript-typescript` and `actions` on pull requests, pushes to `main`, and a weekly schedule. Results upload to GitHub code scanning so alerts appear in the repository Security tab, with run details in the CodeQL workflow logs.
- `.github/workflows/dependency-review.yml` runs dependency review on pull requests, using a high-or-critical severity gate where the repository supports the GitHub dependency-review API. In this private repository, unsupported runs are advisory so the workflow stays green; use `npm run audit:security` as the local fallback evidence. The workflow emits a warning if dependency-review needs maintainer-side GitHub security features.
- `npm run audit:security` wraps `npm audit --audit-level=high`. It is the selected local hardening command for high or critical advisories in the locked dependency graph, including development dependencies because they participate in build, test, and release validation. Failures appear in local command output and CI workflow logs.
- `.github/dependabot.yml` checks npm, GitHub Actions, and Docker base-image dependencies weekly. It groups npm runtime dependencies, npm tooling/test dependencies, Actions updates, and Docker base-image updates separately. Until the repository owns a stable reviewer team or `CODEOWNERS`, review uses the normal maintainer path instead of named reviewers.

Selected M20 advisory checks:

- Container vulnerability scanning uses Trivy against the image built by `npm run docker:build`. The first pass is advisory and keeps Trivy's exit code at `0` for vulnerability findings. Set `FRONTEND_IMAGE` only when scanning a deliberately different local tag:

  ```powershell
  npm run docker:build
  npm run hardening:trivy
  ```

- Deployment posture checks use kube-linter against rendered Kustomize and Helm manifests, not the unrendered source templates alone. The repo-owned wrapper renders the base and local Kustomize overlays plus the base and local Helm chart outputs under ignored `temp/hardening/rendered`, then runs kube-linter against that rendered directory:

  ```powershell
  npm run hardening:kube-linter
  ```

- Runtime/Nginx hardening uses `npm run hardening:runtime`. It covers the production `Dockerfile` and `docker/nginx/` template invariants that this frontend owns, including the canonical Node 24 build stage, use of the unprivileged Nginx image, port `8080`, `/healthz`, same-origin `/api` proxying through `FRONTEND_API_UPSTREAM`, and no browser CORS, JWT, bearer-token, or hard-coded provider-path assumptions.

M20 findings are advisory until a later roadmap row or release decision selects a stable threshold. Tool installation or command/configuration failures should be fixed or recorded as unavailable; vulnerability, posture, and runtime findings should be triaged through the exception path below but do not block a release candidate during the first pass.

## Release And Container Publication

The production image is a static Vite build served by unprivileged Nginx on port
8080. Runtime browser traffic still targets same-origin `/api/**`; Nginx proxies those paths to `FRONTEND_API_UPSTREAM`, which defaults to `http://host.docker.internal:8080` for local Docker Desktop use.

The tag-driven `Release` workflow runs for semantic tags matching `v*.*.*` when the tagged commit contains `.github/workflows/release.yml`. It runs the full frontend validation baseline plus `npm run audit:security`, builds and smoke-tests the container image, publishes both `vMAJOR.MINOR.PATCH[-PRERELEASE]` and `sha-<12-char-commit>` tags to GitHub Container Registry, signs the immutable digest with Cosign, publishes a GitHub provenance attestation, and creates the GitHub Release from `CHANGELOG.md` with container package links.

Remote publication is still explicit maintainer work: push `main` and the annotated tag only when the release task asks for remote publication. Use the immutable digest from the workflow summary for package verification, not a mutable GHCR tag alone.

Deferred hardening candidates:

- SBOM and license reporting: revisit when maintainers select a durable dependency/license inventory requirement for the published container package beyond the signed image itself.
- Enforced bundle-size and asset budgets: revisit when the project owns a reviewed size threshold or production `dist/` growth becomes a repeated review concern.
- Authenticated browser smoke automation: revisit when the repository has agreed local credentials, identity seeding rules, backend profile, and a canonical command.
- Anonymous browser smoke and accessibility automation: revisit when the repository owns a canonical browser command and stable failure thresholds.
- CI artifact upload for hardening reports: revisit when M20 or a later selected check writes a stable report file. Until then, use GitHub code scanning, pull-request check annotations, local command output, and workflow logs as the report locations.
- GitHub Actions SHA pinning: revisit when maintainers select a stricter supply-chain policy or add automation that keeps pinned SHAs current. M13-B should keep trusted versioned actions, explicit permissions, and Dependabot action updates.
- Custom frontend security lint rules: revisit when CodeQL or ESLint misses a repeated security issue pattern and a stable rule set is selected.

Failure triage and exceptions:

- Security and hardening failures are owned by the repository maintainers until a dedicated team or `CODEOWNERS` file exists.
- Prefer a source fix, dependency update, or lockfile refresh over an exception. For CodeQL, inspect the alert and data/control flow before dismissing an alert as not applicable.
- Each exception must name the finding or advisory, affected package/path, current risk, owner, mitigation or planned fix, expiration or revisit trigger, and release decision. Keep exceptions in this section until a dedicated exceptions file is selected.
- A skip must be scoped to the specific check or finding. Do not raise the audit threshold, disable an entire workflow, or remove required workflow steps solely to hide one failure.
- Release candidates require passing selected checks, documented unavailability for any CI-only signal that did not run, and no expired exceptions.

## Troubleshooting

If npm reports an unsupported engine, check `node --version` and `npm --version`. This repository expects Node.js 24.x and npm 11.x.

If `/api/**` requests fail during local development, confirm the backend is running on the target used by the Vite proxy, then keep browser traffic on `http://127.0.0.1:5173/`.

If typecheck fails because generated API types are stale, run `npm run api:types`. If the generated diff is unexpected, inspect the imported backend contract before changing frontend behavior.

If tests pass locally but CI fails during install, reproduce with `npm ci` from a clean checkout so lockfile and engine issues surface.

If `git diff --check` fails, remove trailing whitespace or conflict markers before handoff.
