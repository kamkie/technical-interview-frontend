# Changelog

This project follows Keep a Changelog style. Release entries stay under `Unreleased` until they are promoted for a release tag.

## [Unreleased]

## [0.5.0] - 2026-06-12

### Added

- Added a frontend build identity card to the operator diagnostics page showing the app name, version, build time, and runtime mode from compile-time constants, rendered outside the operator-surface load state so it stays visible when that backend request fails.
- Added a client-side search input with a no-match state to the category chip groups on the public and admin catalog pages; selected chips always stay visible, the search text never enters the URL, and the repeated category query contract is unchanged.
- Added `./scripts/dev-live-auth.ps1`, which starts the sibling backend with the GitHub and fake OAuth login providers (`local,oauth,fake-oauth`), verifies both providers from `GET /api/session`, and runs the frontend dev server against that backend.

### Changed

- An unreachable backend or a 5xx response without problem details is now classified as backend-unavailable and renders a localized recovery message at every load and mutation display site instead of raw request lines, with Try again actions on the session connection panel and the public catalog error state and a single bounded automatic retry for idempotent reads; problem-details responses and unsafe writes are never retried.
- The session endpoint, cookie, and CSRF metadata tiles moved behind a compact connection-details disclosure so sign-in and sign-out lead their menus, the admin list Refresh buttons were removed because mutations refresh in place, URL changes re-fetch, and error states carry retry actions, and the operator audit filters disable while the route is permission-denied.
- Below the 720px breakpoint, the row action and expand columns of the admin books, categories, localization, users, and operator audit tables pin to the right edge as sticky cells with stacked full-width buttons so row actions stay reachable while the rest of the table scrolls, and the catalog category chip wall renders as a single scrollable row so the table returns near the top of the page.
- The UI localization catalog now loads at the backend pagination clamp of 100 entries per page and fetches the remaining enumerated pages as one parallel wave, keeping the sequential last-marker walk as a fallback.
- The release image now pins its runtime Nginx base by digest so weekly Dependabot digest-bump pull requests signal upstream rebuilds, including the rebuild that allows removing the OpenSSL CVE-2026-45447 package upgrade.

### Fixed

- The anonymous topbar language menu is exempt from the narrow-viewport hide rule, so visitors below the 960px breakpoint keep a language control with the backend language-cookie negotiation intact.
- Raised the dark-theme call-number color so the route-header call number meets WCAG contrast on the catalog-card surface, and the accessibility scan now runs in both light and dark mode with a resolved-theme assertion.
- The operator and localization table status lines now read grammatically in error states, and the unfiltered empty catalog has its own copy distinct from the filtered no-match state and its Clear filters action.
- The dev and preview servers now forward the backend fake provider's browser-facing `/test-support/oauth2/**` endpoints to the backend, so the fake-OAuth login can complete on the frontend origin during live-backend auth smoke instead of dead-ending in the SPA fallback.

## [0.4.0] - 2026-06-11

### Added

- Added admin account block and unblock: the user administration list and inline detail surface each account's status with a client-side status filter, blocked accounts show block provenance, and administrators can block or unblock an account with a required operator reason beside role replacement, backed by the contract `PUT /api/admin/users/{id}/status`; the control stays disabled for the signed-in administrator's own account because the backend rejects self-targeting.
- Added frontend internationalization: the UI renders in the user's resolved language (account preference, then the backend `language` cookie, then browser locale, restricted to backend-supported languages with English fallback), loads chrome strings from the public backend localization catalog, and applies language changes from the account preference control or a new anonymous topbar language selector within the same session.

### Changed

- API requests now carry the resolved UI language as `Accept-Language`, replacing the raw browser-list pass-through on reads, so localized backend payloads match the rendered language.
- Mock API mode now seeds Polish frontend chrome translations plus a partial German set so localized rendering and English fallback are demonstrable without the sibling backend.
- Mock API mode now implements the admin account-status route and seeds a blocked user so the block/unblock workflow is demonstrable without the sibling backend.

### Fixed

- Upgraded the release image's OpenSSL packages past CVE-2026-45447 because the upstream `nginxinc/nginx-unprivileged:1.31-alpine` tag still ships the vulnerable version, and refined the runtime invariant check to assert the effective runtime user stays unprivileged instead of rejecting any `USER root` build step.

## [0.3.1] - 2026-06-09

### Added

- Added SPDX SBOM and report-only license release evidence, advisory bundle-budget reporting, SHA-pinned GitHub Actions workflows, and retained Trivy and CodeQL SARIF artifacts for the selected deferred hardening scope.

### Changed

- Enforced selected hardening thresholds for high-or-critical npm audit advisories, runtime/Nginx invariant violations, and high-or-critical Trivy image findings while keeping kube-linter posture findings advisory.

### Fixed

- Aligned the contract-backed mock API with the public catalog filter contract so conflicting exact and range publication-year filters return localized problem details and managed mock anonymous smoke passes.
- Installed Playwright Chromium in CI before the accessibility gate so selected accessibility automation can run on fresh GitHub-hosted runners.

## [0.3.0] - 2026-06-08

### Added

- Added `npm run dev:mock`, an opt-in same-origin `/api/**` Vite mock API mode backed by generated OpenAPI types for frontend-only development without the sibling backend.
- Added app-level light, dark, and system theme support with a visible persisted preference control across public, account, admin, and operator routes.
- Added production shell, navigation, route-context, loading, empty, and error-state refinements across catalog, account, admin, and operator routes.
- Added deliberate responsive layout coverage and repeatable anonymous and authenticated browser smoke evidence for the primary workflows.
- Added `npm run smoke:authenticated` for self-contained authenticated browser smoke against the contract-backed mock API.
- Added managed dev-server tooling with `npm run dev:mock:managed`, `npm run dev:list`, `npm run dev:cleanup`, and the shared `scripts/with-vite.mjs` Vite lifecycle helper.

### Changed

- Polished the public catalog workflow with canonical route query replacement, visible active filter/sort/page summaries, and clearer accessible sort controls.
- Moved Browser Session diagnostics into a hidden-by-default Session details surface while keeping metadata-driven sign-in, session bootstrap, and logout behavior intact.
- Polished daily catalog, account, admin, and operator workflows with clearer state semantics, visual hierarchy, action grouping, and account/session copy.
- Updated authenticated mock smoke to start Vite through the managed helper while preserving validation date, frontend URL, backend profile, route coverage, API coverage, pass/skip/fail semantics, and skipped-step evidence.

### Fixed

- Kept admin catalog book row action buttons compact for long titles while preserving specific edit/delete accessible names and delete confirmation behavior.
- Set the initial document background before bundled assets load to avoid a white blank-page flash during app startup.

## [0.2.0] - 2026-06-07

### Added

- Added a production Docker image build for the Vite app with an unprivileged Nginx runtime that preserves same-origin `/api/**` proxying.
- Added frontend Kubernetes/Kustomize and Helm reference manifests for deploying the production container with the same-origin `/api/**` proxy configuration.
- Added a tag-driven GitHub Release workflow that validates the candidate, publishes semantic and immutable GHCR image tags, signs and attests the image digest, and renders release notes with package links from `CHANGELOG.md`.
- Added `docs/API_COVERAGE.md`, classifying all 22 approved backend OpenAPI operations as covered by generated types, clients, UI, specs, or tests.
- Added fake-OAuth authenticated smoke readiness guidance for the backend `local,oauth,fake-oauth` profile and `smoke:smoke-user` bootstrap identity.
- Added `npm run smoke:anonymous` for anonymous same-origin browser smoke coverage of session bootstrap, public catalog reads, URL-backed filters, pagination, repeated category/sort query values, and localized public-read failures when reproducible.
- Added advisory M20 hardening commands for runtime/Nginx invariants, rendered Kustomize/Helm manifest linting with kube-linter, and Trivy image scanning.
- Added regression coverage proving login provider links come from `GET /api/session` metadata and are not invented when `authorizationPath` is absent.

### Changed

- Shared the local `/api/**` proxy between Vite dev and preview servers so anonymous smoke can target either frontend origin.
- Aligned the Docker build stage with the repository's Node.js 24 runtime contract.

### Fixed

- Refreshed the npm 11 lockfile metadata so canonical `npm ci` installs pass in CI.
- Restored CodeQL and dependency-review workflows with GitHub code-scanning upload and high-or-critical dependency-review enforcement.
- Aligned CI and container builds to install the npm version declared by `package.json` before running clean installs.
- Pinned the Release workflow's Cosign installer action to a published `sigstore/cosign-installer` tag so tag-triggered publication can resolve the signing setup step.

## [0.1.0] - 2026-06-07

First frontend release.

### Added

- Vite, React, and TypeScript browser app scaffold with Node.js 24.x and npm 11.x as the canonical runtime/tooling baseline.
- Imported backend contract documentation, checked generated OpenAPI TypeScript types, and API type freshness validation.
- Session bootstrap from `GET /api/session`, metadata-driven login provider rendering, CSRF helpers, authenticated logout, and route guards.
- React Router catalog route with URL-synced search, repeated category filters, Spring pagination, sorting controls, loading/empty states, and localized backend error display.
- Local same-origin auth smoke documentation and Vite `/api` proxy guidance for the sibling `technical-interview-demo` backend.
- Authenticated account profile and preferred-language update/clear flow.
- Admin catalog management for backend-supported book and category create, update, delete, list, filter, sort, and error states.
- Admin localization management for supported locales, message editing, and coverage/status states.
- Read-only operator overview and pageable audit log with filters, sorting, recent entries, details, and partial-payload handling.
- Admin user management for user list/detail, role provenance, and role replacement.
- Contract-scoped specs for admin catalog, admin localization, operator audit, and admin user management.
- GitHub Actions CI workflow for lint, typecheck, tests, build, and whitespace validation.
- Static-analysis and hardening checks for explicit workflow permissions/concurrency, CodeQL, dependency-review, high-or-critical npm audit, Dependabot grouping, and documented triage/exception handling.
- Component, route, and API client tests with shared fixtures across public catalog, account, admin, and operator behavior.
- Frontend release procedure covering version selection, changelog promotion, validation evidence, annotated tags, publication guardrails, and post-release roadmap cleanup.
- Human procedure documentation for lifecycle, local development, working with AI, and documentation navigation.
- Lean frontend-specific AI guidance and focused AI references for documentation routing, validation selection, reviews, and release sequencing.

### Changed

- Roadmap now records the M0-M11 implementation slice as complete and moves near-term work to post-`0.1.0` browser smoke coverage and future selected backend-supported scope.
- Setup documentation now includes backend contract refresh, generated API type checks, local auth smoke guidance, hardening commands, and the canonical validation commands.

## [0.0.0]

- Initial repository scaffold.
