# Changelog

This project follows Keep a Changelog style. Release entries stay under `Unreleased`
until they are promoted for a release tag.

## [Unreleased]

### Fixed

- Refreshed the npm 11 lockfile metadata so canonical `npm ci` installs pass in CI.
- Restored CodeQL and dependency-review workflows with GitHub code-scanning upload
  and high-or-critical dependency-review enforcement.

## [0.1.0] - 2026-06-07

First frontend release.

### Added

- Vite, React, and TypeScript browser app scaffold with Node.js 24.x and npm 11.x
  as the canonical runtime/tooling baseline.
- Imported backend contract documentation, checked generated OpenAPI TypeScript
  types, and API type freshness validation.
- Session bootstrap from `GET /api/session`, metadata-driven login provider
  rendering, CSRF helpers, authenticated logout, and route guards.
- React Router catalog route with URL-synced search, repeated category filters,
  Spring pagination, sorting controls, loading/empty states, and localized backend
  error display.
- Local same-origin auth smoke documentation and Vite `/api` proxy guidance for the
  sibling `technical-interview-demo` backend.
- Authenticated account profile and preferred-language update/clear flow.
- Admin catalog management for backend-supported book and category create, update,
  delete, list, filter, sort, and error states.
- Admin localization management for supported locales, message editing, and
  coverage/status states.
- Read-only operator overview and pageable audit log with filters, sorting, recent
  entries, details, and partial-payload handling.
- Admin user management for user list/detail, role provenance, and role replacement.
- Contract-scoped specs for admin catalog, admin localization, operator audit, and
  admin user management.
- GitHub Actions CI workflow for lint, typecheck, tests, build, and whitespace
  validation.
- Static-analysis and hardening checks for explicit workflow
  permissions/concurrency, CodeQL, dependency-review, high-or-critical npm audit,
  Dependabot grouping, and documented triage/exception handling.
- Component, route, and API client tests with shared fixtures across public catalog,
  account, admin, and operator behavior.
- Frontend release procedure covering version selection, changelog promotion,
  validation evidence, annotated tags, publication guardrails, and post-release
  roadmap cleanup.
- Human procedure documentation for lifecycle, local development, working with AI,
  and documentation navigation.
- Lean frontend-specific AI guidance and focused AI references for documentation
  routing, validation selection, reviews, and release sequencing.

### Changed

- Roadmap now records the M0-M11 implementation slice as complete and moves
  near-term work to post-`0.1.0` browser smoke coverage and future selected
  backend-supported scope.
- Setup documentation now includes backend contract refresh, generated API type
  checks, local auth smoke guidance, hardening commands, and the canonical
  validation commands.

## [0.0.0]

- Initial repository scaffold.
