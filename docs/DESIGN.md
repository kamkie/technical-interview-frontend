# Frontend Design

This document owns durable product and design intent for the first-party browser frontend to the sibling `technical-interview-demo` backend. It describes where the UI should go; `ROADMAP.md` owns selection, stable IDs, status, dependencies, release context, and blocked backlog.

## Product Intent

The application is a production browser frontend for the approved backend contract. It should read as a useful catalog, account, admin, and operator tool, not as a repository demo shell, backend explorer, diagnostics console, or marketing landing page.

The first screen and primary navigation should put real user workflows first. Technical diagnostics, raw contract details, and implementation proof points can exist when useful, but they should not dominate everyday catalog, account, admin, or operator tasks.

## Design Priorities

- Contract-first UI: design from the imported backend contract and generated types, not invented endpoints, fields, authentication flows, or transports.
- Workflow clarity: group actions by user task and route context instead of exposing the backend API surface as the navigation model.
- Route context: each route should make the current area, state, available actions, and permission or session implications clear.
- User-facing session controls: login, logout, account access, and provider choices should be visible and understandable without relying on technical labels.
- Admin and operator separation: administrative catalog, user, localization, operator, and audit surfaces should be distinct from public catalog and account workflows.
- Dense operational scanning where appropriate: admin, operator, catalog table, audit, and user-management views should support quick comparison, filtering, sorting, and repeated action without decorative weight.
- Reduced exposed control clutter: remove or demote refresh buttons, raw toggles, diagnostics, and duplicated controls when route context, automatic state, or shared client behavior can carry the interaction.

## Supported Experience

- Public catalog: anonymous users can browse approved public catalog views, categories, pagination, sorting, and repeated filters where documented by the backend contract.
- Account and session: users can understand current session state, choose login providers from backend metadata, reach account preferences, and log out through backend-provided metadata.
- Admin catalog and users: authorized admin users can manage catalog and user workflows with clear separation from public catalog tasks.
- Admin localization: authorized users can manage localization surfaces without treating localized display messages as stable program logic.
- UI language: the rendered chrome follows the user's resolved language — account preference, then the backend `language` cookie, then browser locale — restricted to backend-supported languages with English fallback. Chrome strings come from the public backend localization catalog over in-code English defaults; missing keys or translations fall back to English without breaking the page, and language changes from the account preference control or the anonymous topbar selector apply within the same session.
- Operator and audit surface: operator and audit workflows should favor dense scanning, stable state interpretation, and preservation of existing backend operations.
- Backend-unavailable resilience: the shared API client classifies unreachable-backend failures (a rejected fetch, or a 5xx response without problem details) on stable fields; affected surfaces render localized backend-unavailable messaging instead of raw request lines, the session connection panel and the public catalog error state offer retry actions, and idempotent GET reads get a single bounded automatic retry while problem-details responses and unsafe writes are never retried.
- Narrow-viewport tables: dense tables keep the shared horizontal-scroll container, and below the 720px breakpoint the row action or expand column pins to the right edge as a sticky column so row actions stay reachable; this selected `M-MOBILE-001` pattern applies uniformly across catalog, admin, and operator tables.
- Theme: visual styling should support a production work surface with clear hierarchy, restrained decoration, readable density, and consistent state presentation. The selected visual identity is a digitized card catalog: paper-and-ink palette (manila background, catalog-card surfaces, stamp-blue interactive ink, stamp-red danger, binding-green success) under an ink topbar with brass details, bibliographic serif headings, a monospace record layer for labels, identifiers, and status stamps, and a catalog-card route header with call-number eyebrow and red rule as the signature element.
- Local smoke posture: smoke guidance should stay same-origin and `/api/**` shaped, and should distinguish authenticated and anonymous evidence once those flows are selected.

## Roadmap-Aligned Direction

- `M-UI-001`: archived completed work establishing the production UI foundation with shell and navigation changes, admin separation, user-facing session controls, route context, and basic loading, empty, and error state handling.
- `M-WORKFLOW-001`: archived completed work polishing daily workflows with stronger visual hierarchy, shared state semantics, catalog table and form improvements, admin and operator workflow grouping, and clearer account and session copy.
- `M-SMOKE-001`: archived completed work covering deliberate responsive behavior, authenticated smoke for session bootstrap and logout, and anonymous smoke for shell and public catalog paths.
- `M-QUALITY-001`: keep quality gates blocked until owners, thresholds, failure behavior, and repeatable evidence are selected for accessibility automation, smoke gap promotion, and hardening thresholds.

## Contract And Security Boundaries

- Browser traffic targets same-origin `/api/**`.
- Authentication uses backend session cookies; do not introduce JWT or bearer-token assumptions.
- Bootstrap auth state with `GET /api/session`.
- Render login options from `loginProviders[]`; do not hard-code provider paths.
- Use session metadata for `accountPath`, `logoutPath`, CSRF cookie name, and CSRF header name.
- For unsafe writes with a real current session, mirror the readable CSRF cookie into the configured CSRF request header.
- Treat localized messages as display content.
- Branch on stable fields such as status, `messageKey`, and endpoint context, not English message text.
- Preserve Spring pagination conventions: `page`, `size`, and repeated `sort`.
- Preserve repeated filters where documented, including repeated `category` filters.
- Include a book `version` value when updating books.
- Do not add CORS-first behavior, alternate transports, invented endpoints, invented request fields, invented authentication headers, or provider-specific OAuth paths as frontend design assumptions.

## Non-Goals

- Backend API expansion.
- Backend-only operations, deployment, Gradle, Flyway, REST Docs, or runtime runbook weight.
- Decorative redesign that does not improve workflow clarity, scanning, state handling, or route context.
- Marketing landing page treatment.
- Invented API fields, endpoints, auth headers, CORS requirements, or alternate transports.
- Generic command wrappers.
- Generic planning scaffolds beyond this selected plan's minimum needs.
- Workflow-state directories unless selected by a concrete execution guide for a concrete execution need.

## Design Review Questions

Before UI changes land, agents should be able to answer these questions:

- Which user workflow, route, or repository rule is changing?
- Which contract, generated type, spec, roadmap item, or design section owns the intended behavior?
- Does the design preserve same-origin `/api/**`, session-cookie auth, metadata-driven login/logout, CSRF, localization, pagination, repeated filters, and versioned book updates?
- Does the route make the current context, state, available actions, and permission or session implications clear?
- Are public, account, admin, operator, and audit workflows separated in navigation and visual hierarchy?
- Are localized messages rendered as display content rather than used for control flow?
- Does the screen reduce exposed control clutter without hiding primary actions?
- Do dense tables and operational views support scanning, comparison, pagination, sorting, filtering, and repeated action?
- Are empty, loading, success, and error states consistent with shared state semantics?
- Does the responsive behavior remain deliberate on small and desktop viewports?
- What smallest validation protects the changed user-visible behavior, and what smoke or contract risk remains?
