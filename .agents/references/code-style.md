# Frontend Code Style Reference

This file owns implementation-facing TypeScript, React, CSS, and edit-shape guidance for the frontend. Use it when changing app source, tests, fixtures, or UI behavior.

## Edit Shape

- Prefer existing local patterns over new abstractions. Read nearby code first, then make the smallest coherent change that preserves the surrounding style.
- Keep changes scoped to the route, feature folder, API module, helper, test, or document that owns the behavior; do not mix unrelated cleanup into implementation work.
- Use generated OpenAPI types where they represent backend data. Do not duplicate contract types by hand unless the type is purely frontend state.
- Keep components, hooks, and helpers small enough that ownership is obvious. Split only when a component has a second meaningful responsibility or a test would become clearer.
- Preserve user-owned dirty worktree changes and do not normalize files outside the assigned write scope.

## TypeScript

- Model backend responses from generated types and API helpers; model UI-only state with explicit local types near the component or helper that owns the state.
- Prefer precise unions, object shapes, and typed helper returns over broad `any`, untyped object maps, or stringly typed status handling.
- Keep query state stable and serializable. Use existing routing/query helpers for URL state, repeated filters, pagination, and sorting before adding new parsing logic.
- Keep error and state branches based on stable fields such as status, `messageKey`, endpoint context, route context, and typed values, not localized English display messages.
- Avoid manual string manipulation for URL query construction when `URLSearchParams` or existing helpers can preserve repeated values correctly.

## React

- Route components should compose feature components and wire data, query state, access state, and page-level feedback; leaf components should focus on rendering and small interactions.
- Use controlled inputs for forms and filters when the UI must reflect route state, validation state, or submitted values.
- Keep loading, empty, success, and error states explicit and consistent with existing shared state helpers.
- Preserve accessibility semantics for controls, navigation, forms, tables, dialogs, and status messages. Use buttons for actions and links for navigation.
- Render login options from session metadata and keep account/logout controls user-facing; do not hard-code provider-specific paths.
- Keep admin and operator controls visually and structurally separate from public catalog and account workflows.

## CSS And Layout

- Use the existing global CSS and theme helpers before adding new styling systems or dependencies.
- Design for a production work surface: clear hierarchy, readable density, predictable spacing, and restrained decoration.
- Avoid nested cards, decorative redesigns with no workflow improvement, hero or marketing treatment, and diagnostic-first UI.
- Use stable responsive constraints for fixed-format elements such as nav, tables, toolbars, filters, icon buttons, counters, and pagination so content does not shift unexpectedly.
- Keep table, filter, action, and auth controls discoverable on narrow and desktop viewports; do not rely on simple vertical stacking when a workflow needs comparison or repeated action.
- Ensure text fits inside controls and does not overlap neighboring content. Prefer wrapping or layout changes over viewport-scaled font sizes.
- Keep color, spacing, focus, disabled, loading, and error states consistent across public, account, admin, and operator surfaces.

## API-Facing UI Rules

Use `docs/backend/` for exact API, session, CSRF, pagination, filter, localization, and versioning rules. In UI code, keep backend-shaped data typed from generated types or API helpers, and do not branch on localized display copy.

## Tests And Fixtures

- Add or update the smallest test layer that proves the user-visible behavior or contract-sensitive request behavior.
- Prefer route and component tests for visible UI states, API tests for request construction and response handling, and mock API tests for local development behavior.
- Keep fixtures representative of contract data and reuse shared fixtures only when multiple tests need the same scenario.
- Avoid overbroad snapshot-style assertions when role, label, query state, request shape, and state semantics can describe the behavior directly.
