# Changelog

This project follows Keep a Changelog style. Release entries stay under `Unreleased`
until the first frontend tag is cut.

## [Unreleased]

This section represents the candidate `0.1.0` frontend surface until a tagged
release is created.

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
- Component, route, and API client tests with shared fixtures across public catalog,
  account, admin, and operator behavior.
- Lean frontend-specific AI guidance.

### Changed

- Roadmap now records the M0-M11 implementation slice as complete and moves
  near-term work to `0.1.0` release hardening plus canonical browser smoke coverage.
- Setup documentation now includes backend contract refresh, generated API type
  checks, local auth smoke guidance, and the canonical validation commands.

## [0.0.0]

- Initial repository scaffold.
