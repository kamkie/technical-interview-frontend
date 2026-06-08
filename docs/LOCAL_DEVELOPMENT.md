# Local Development

This document owns local setup, npm commands, CI reproduction, troubleshooting, backend contract refresh, browser smoke workflow, local hardening commands, and CI-owned hardening signals for the frontend repository.

## Prerequisites

- PowerShell 7 or Windows PowerShell
- Git
- Node.js 24.x
- npm 11.x, matching `package.json` `packageManager` and `engines`
- Docker, only when building or validating the production container image
- Playwright Chromium, only when running browser smoke commands
- Trivy, kube-linter, kubectl, and Helm when running the selected hardening checks locally
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

For manual browser review that intentionally leaves mock mode running, use the managed wrapper:

```powershell
npm run dev:mock:managed -- --port 5173
```

The managed wrapper starts Vite through the Vite Node API, records PID and port under ignored `temp/dev-servers/`, and closes the server on normal exit. Prefer programmatic smoke or review commands that use `scripts/with-vite.mjs` when the task can run a command and stop Vite automatically.

List repo-local Vite/npm dev servers before and after browser-review work:

```powershell
npm run dev:list
```

Stop only repo-local Vite/npm dev server process chains owned by this checkout:

```powershell
npm run dev:cleanup
```

`dev:list` and `dev:cleanup` match only process command lines that point at this repository, plus repo-owned managed state files for wrappers whose package-script command line is relative. When a task intentionally leaves a server running, record the port, PID, command, and reason. When a task reports a server was stopped, back that statement with a post-stop port check from the cleanup command, `scripts/with-vite.mjs`, or an equivalent explicit probe.

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

| Task                                          | Command                                   |
| --------------------------------------------- | ----------------------------------------- |
| Install dependencies                          | `npm install`                             |
| Run local dev server                          | `npm run dev`                             |
| Run local dev server with mock API            | `npm run dev:mock`                        |
| Run managed mock dev server                   | `npm run dev:mock:managed -- --port 5173` |
| List repo-local dev servers                   | `npm run dev:list`                        |
| Stop repo-local dev servers                   | `npm run dev:cleanup`                     |
| Run production preview                        | `npm run preview`                         |
| Lint                                          | `npm run lint`                            |
| Lint Markdown only                            | `npm run lint:markdown`                   |
| Format Markdown                               | `npm run format:markdown`                 |
| Lint ESLint only                              | `npm run lint:eslint`                     |
| Typecheck and API type freshness check        | `npm run typecheck`                       |
| Run tests once                                | `npm test`                                |
| Run tests with coverage                       | `npm run test:coverage`                   |
| Run tests in watch mode                       | `npm run test:watch`                      |
| Build                                         | `npm run build`                           |
| Build production container image              | `npm run docker:build`                    |
| Audit high-or-critical dependency advisories  | `npm run audit:security`                  |
| Accessibility automation                      | `npm run a11y`                            |
| Advisory bundle and asset budget check        | `npm run hardening:bundle-budget`         |
| Runtime/Nginx invariant gate                  | `npm run hardening:runtime`               |
| Generate release SBOM and license inventory   | `npm run hardening:sbom`                  |
| Rendered-manifest posture advisory check      | `npm run hardening:kube-linter`           |
| Container high-or-critical vulnerability gate | `npm run hardening:trivy`                 |
| Selected hardening checks                     | `npm run hardening:m20`                   |
| Anonymous same-origin browser smoke           | `npm run smoke:anonymous`                 |
| Authenticated mock browser smoke              | `npm run smoke:authenticated`             |
| Generate API types                            | `npm run api:types`                       |
| Verify API types without rewriting            | `npm run api:types:check`                 |
| Validate whitespace in the diff               | `git diff --check`                        |

## Reproduce CI Locally

For app, tooling, release-readiness, and other executable changes, run the same baseline used by CI:

```powershell
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
npm run hardening:bundle-budget
npm run a11y
npm run audit:security
npm run hardening:runtime
git diff --check
```

CI's `Test` step adds Vitest's JUnit reporter so Codecov can ingest test results:

```powershell
npm test -- --reporter=default --reporter=junit --outputFile.junit=../test-results/vitest.junit.xml
```

CI uploads JavaScript bundle analysis to Codecov during `npm run build` on GitHub Actions. The Vite config enables a CI-only Codecov upload plugin that reads Vite/Rolldown `generateBundle` assets, chunks, and modules, then uploads through GitHub OIDC from the CI job instead of a checked-in token or local secret. Local production builds do not upload bundle analysis.

The selected local hardening commands can also be run directly:

```powershell
npm run audit:security
npm run hardening:bundle-budget
npm run hardening:sbom
npm run hardening:runtime
npm run hardening:kube-linter
npm run docker:build
npm run hardening:trivy
```

The aggregate runtime, manifest, and image hardening command is:

```powershell
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
npm run lint:markdown
git diff --check
```

Run broader validation when a docs change also modifies package scripts, generated files, workflows, source code, or test behavior.

Tracked Markdown must use LF line endings, include a final newline, use valid Mermaid fenced-code syntax, avoid hard-wrapped prose and list-item continuation prose outside fenced code, and keep pipe tables aligned with `npm run lint:markdown`. Use `npm run format:markdown` to normalize tracked Markdown before linting.

For Dockerfile, Nginx runtime configuration, or release image workflow changes, also run:

```powershell
npm run docker:build
```

If Docker is unavailable locally, record that explicitly and rely on the tag-driven release workflow only after maintainers accept the environment limitation.

When hardening tooling or runtime config changes, also run the selected checks that apply to the changed artifact. Keep generated reports out of git; selected report files are written under ignored `temp/hardening/` and retained by GitHub Actions where the owning workflow uploads them. Local command output, pull-request logs, workflow logs, GitHub code scanning, GitHub Release assets, and workflow artifacts are the evidence locations. The rendered-manifest check writes scratch manifests under ignored `temp/hardening/rendered`.

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

Browser smoke keeps browser traffic on the frontend origin and same-origin `/api/**` paths. Use `npm run smoke:anonymous` for backend-backed public catalog evidence, `npm run smoke:authenticated` for self-contained authenticated browser evidence against the contract-backed mock API, and [`docs/LOCAL_AUTH_SMOKE.md`](LOCAL_AUTH_SMOKE.md) when live sibling-backend fake-OAuth evidence is required.

At the start of browser-review work, run `npm run dev:list`. At closeout, run `npm run dev:list` again and either stop task-owned servers with `npm run dev:cleanup` or report exactly what remains. Use `scripts/with-vite.mjs` for programmatic Vite-backed checks so the server closes in `finally`; reserve `npm run dev:mock:managed` for an intentionally running interactive server.

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

`npm run smoke:anonymous` first prints the validation date, frontend URL, backend expectation, selected route coverage, API coverage, covered flow, and pass/skip/fail semantics. It then probes the frontend origin and `GET /api/session` through that same origin. If the frontend is not serving, the backend is unavailable through the frontend `/api` proxy, or browser tooling is unavailable, the command records a prerequisite `skip` and exits nonzero. If prerequisites are available but a smoke assertion fails, the command records `fail` and exits nonzero. A prerequisite skip is environment evidence, not a product pass.

When prerequisites are available, the command verifies:

- anonymous `GET /api/session` metadata, including session-cookie and CSRF metadata
- public `GET /api/categories`
- public `GET /api/books` with Spring `page`, `size`, and repeated `sort`
- URL-backed `/catalog` query state for title, author, ISBN, repeated `category`, `page`, `size`, and repeated `sort`
- browser-observed `/api/session`, `/api/categories`, and `/api/books` requests stay on the frontend origin
- a localized public-read failure using stable HTTP status, `messageKey`, and resolved `language` when the backend reproduces the documented invalid publication-year filter combination

The localized-failure probe is required smoke coverage. It must return problem details with stable status, `messageKey`, and endpoint context; the smoke does not branch on English message text.

Authenticated browser smoke can run without the sibling backend or provider secrets:

```powershell
npm run smoke:authenticated
```

The command starts Vite in mock mode through `scripts/with-vite.mjs`, forces an anonymous starting session, launches Playwright Chromium, and chooses an available localhost port starting at `127.0.0.1:5173`. Set `FRONTEND_AUTH_SMOKE_PORT` to request a different starting port, `FRONTEND_AUTH_SMOKE_STRICT_PORT=true` to fail instead of selecting the next open port, and `FRONTEND_SMOKE_HEADLESS=false` to watch the browser run.

`npm run smoke:authenticated` prints the validation date, frontend URL, backend profile (`internal contract-backed mock API`), selected flow, route coverage, API coverage, pass/skip/fail semantics, and skipped authenticated steps. A passing run should report `Skipped authenticated steps: none`. Browser or mock-server prerequisite skips are environment evidence and still exit nonzero; do not treat them as a product pass.

When prerequisites are available, the command verifies:

- anonymous `GET /api/session` metadata and the advertised mock login provider
- metadata-driven login from the rendered provider link
- authenticated `GET /api/session` with account, logout, and CSRF metadata
- `GET /api/account` and the `/account` route for the mock admin account
- `GET /api/admin/users` and the `/admin/users` route for the mock admin account
- CSRF-backed logout through the UI, including mirroring the readable CSRF cookie into the configured header
- post-logout anonymous session state and account-route API protection
- browser-observed authenticated `/api/**` requests stay on the frontend origin

When recording smoke evidence, include the backend profile or availability expectation, frontend URL, browser flow covered, validation date, route coverage, and any skipped prerequisite or authenticated steps with the reason.

## Accessibility Automation

Accessibility automation can run without the sibling backend or provider secrets:

```powershell
npm run a11y
```

The command starts Vite in mock mode through `scripts/with-vite.mjs`, launches Playwright Chromium, and runs axe against the selected mock-browser route scope: anonymous catalog/home state, authenticated `/account`, and authenticated `/admin/users` with the mock admin session. It prints the validation date, frontend URL, backend profile (`internal contract-backed mock API`), route coverage, result semantics, and a summary.

`npm run a11y` fails locally and in CI on serious or critical automated accessibility violations. Moderate, minor, or unknown-impact findings are printed as advisory output during the first pass and do not fail the command. Missing Playwright, Chromium, axe tooling, or mock-server prerequisites are prerequisite failures that exit nonzero; do not treat them as successful product evidence. If Chromium is unavailable, run:

```powershell
npx playwright install chromium
```

Use `FRONTEND_A11Y_PORT` to request a starting port, `FRONTEND_A11Y_STRICT_PORT=true` to fail instead of selecting the next open port, `FRONTEND_A11Y_TIMEOUT_MS` for browser waits, and `FRONTEND_A11Y_HEADLESS=false` to watch the browser run. CI installs Playwright Chromium, then runs `npm run a11y` after `npm run build`; command output and workflow logs are the retained evidence for the first implementation. Accessibility failures are owned by the repository maintainers until a dedicated team or `CODEOWNERS` file exists.

## Hardening Commands And Signals

M13 implements the selected minimum hardening set for the `0.1.0` release hardening pass.

Implemented M13 checks:

- `.github/workflows/ci.yml` has explicit read-only repository permissions and concurrency that cancels superseded pull-request runs while preserving protected-branch, tag, release, and scheduled evidence. It writes Vitest JUnit output to `test-results/vitest.junit.xml` and publishes it to Codecov as `test_results`, then runs `npm run test:coverage` and publishes `coverage/lcov.info` to Codecov with the `frontend` flag using GitHub OIDC. After the production build, the Vite config uploads bundle asset, chunk, and module metadata to Codecov through the same GitHub OIDC permission, and `npm run hardening:bundle-budget` records the selected soft budget evidence.
- `.github/workflows/codeql.yml` runs CodeQL for `javascript-typescript` and `actions` on pull requests, pushes to `main`, and a weekly schedule. Results upload to GitHub code scanning so alerts appear in the repository Security tab, with run details in the CodeQL workflow logs. The workflow also uploads the generated SARIF as a 14-day GitHub Actions artifact for retained evidence.
- `.github/workflows/dependency-review.yml` runs dependency review on pull requests, using a high-or-critical severity gate where the repository supports the GitHub dependency-review API. In this private repository, unsupported runs are advisory so the workflow stays green; use `npm run audit:security` as the local fallback evidence. The workflow emits a warning if dependency-review needs maintainer-side GitHub security features.
- `npm run audit:security` wraps `npm audit --audit-level=high`. It is the selected local hardening command for high or critical advisories in the locked dependency graph, including development dependencies because they participate in build, test, and release validation. Failures appear in local command output and CI workflow logs.
- `.github/dependabot.yml` checks npm, GitHub Actions, and Docker base-image dependencies weekly. It groups npm runtime dependencies, npm tooling/test dependencies, Actions updates, and Docker base-image updates separately. Workflow actions are pinned to commit SHAs with version comments, and Dependabot keeps the pinned GitHub Actions references current. Until the repository owns a stable reviewer team or `CODEOWNERS`, review uses the normal maintainer path instead of named reviewers.

Selected hardening checks:

- Container vulnerability scanning uses Trivy against the image built by `npm run docker:build`. `npm run hardening:trivy` fails on high or critical vulnerability findings. Set `FRONTEND_IMAGE` only when scanning a deliberately different local tag:

  ```powershell
  npm run docker:build
  npm run hardening:trivy
  ```

- Set `FRONTEND_TRIVY_REPORT=temp/hardening/trivy-image-report.json` to write a retained JSON report. The tag-driven Release workflow scans the built release image with Trivy and uploads that report as a 14-day GitHub Actions artifact.

- Deployment posture checks use kube-linter against rendered Kustomize and Helm manifests, not the unrendered source templates alone. The repo-owned wrapper renders the base and local Kustomize overlays plus the base and local Helm chart outputs under ignored `temp/hardening/rendered`, then runs kube-linter against that rendered directory:

  ```powershell
  npm run hardening:kube-linter
  ```

- Runtime/Nginx hardening uses `npm run hardening:runtime`. CI runs it as an enforced check. It covers the production `Dockerfile` and `docker/nginx/` template invariants that this frontend owns, including the canonical Node 24 build stage, use of the unprivileged Nginx image, port `8080`, `/healthz`, same-origin `/api` proxying through `FRONTEND_API_UPSTREAM`, and no browser CORS, JWT, bearer-token, or hard-coded provider-path assumptions.

- Bundle and asset budget checking uses `npm run hardening:bundle-budget` after `npm run build`. The selected baseline is `bundle-budget.config.json`, and the first-pass warning threshold is 10% above that baseline. Warnings are advisory and do not fail CI or release work. The report is written to `temp/hardening/bundle-budget-report.json` unless `FRONTEND_BUNDLE_BUDGET_REPORT` selects another path.

- Release SBOM and license evidence uses `npm run hardening:sbom`. It writes an SPDX JSON SBOM and report-only license inventory under `temp/hardening/release/` unless `FRONTEND_RELEASE_EVIDENCE_DIR` selects another directory. License findings are inventory only until maintainers select a separate license allow or deny policy.

High or critical npm advisories, owned runtime/Nginx invariant violations, and high or critical Trivy vulnerability findings are enforced hardening failures. Rendered-manifest posture findings from `npm run hardening:kube-linter`, bundle budget drift, and license inventory findings stay advisory during the first pass. Tool installation or command/configuration failures should be fixed or recorded as unavailable, and blocking findings should be triaged through the exception path below before release work proceeds.

## Release And Container Publication

The production image is a static Vite build served by unprivileged Nginx on port
8080. Runtime browser traffic still targets same-origin `/api/**`; Nginx proxies those paths to `FRONTEND_API_UPSTREAM`, which defaults to `http://host.docker.internal:8080` for local Docker Desktop use.

The tag-driven `Release` workflow runs for semantic tags matching `v*.*.*` when the tagged commit contains `.github/workflows/release.yml`. It runs the full frontend validation baseline plus `npm run audit:security`, records advisory bundle budget evidence, builds and smoke-tests the container image, scans the release image with Trivy, publishes both `vMAJOR.MINOR.PATCH[-PRERELEASE]` and `sha-<12-char-commit>` tags to GitHub Container Registry, signs the immutable digest with Cosign, publishes GitHub provenance and SPDX SBOM attestations, and creates the GitHub Release from `CHANGELOG.md` with container package links, the SPDX JSON SBOM, and the report-only license inventory. The release workflow retains the SBOM/license handoff artifact and Trivy report artifact for 14 days.

Remote publication is still explicit maintainer work: push `main` and the annotated tag only when the release task asks for remote publication. Use the immutable digest from the workflow summary for package verification, not a mutable GHCR tag alone.

Deferred hardening candidates:

- Live-backend authenticated smoke automation: revisit if maintainers want the automated authenticated command to start or require the sibling backend fake-OAuth profile instead of the internal mock API. External-provider automation still needs provider-specific credentials and identity seeding rules.
- Anonymous browser smoke: `npm run smoke:anonymous` is the canonical anonymous command and must pass in the documented local smoke environment; missing frontend, backend, or browser tooling records a prerequisite skip and exits nonzero, while smoke assertion failures record `fail` and exit nonzero.
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
