# M11 Admin User Management Spec

## Status

Ready for coordinator review.

## Sources Of Truth

- `ROADMAP.md` M11: admin user list/detail with contract-backed role management.
- `docs/backend/approved-openapi.json`: exact endpoint, request, response, problem, and role-grant schemas.
- `docs/backend/FRONTEND_AI_CONTRACT.md`: same-origin `/api/**`, session-cookie authentication, metadata-driven CSRF, access, and localized-error rules.
- Existing M7 account mutation pattern: unsafe writes use current session metadata to mirror the readable CSRF cookie into the configured CSRF request header.

Do not copy durable schema definitions into implementation code from this spec. Use the imported OpenAPI contract and generated types for exact fields and constraints.

## User-Visible Scope

M11 adds an admin-only user-management surface where an administrator can:

- review persisted application users from the contract-backed admin user list;
- open a selected user's detail view from the loaded list data;
- review the user's current roles and role-grant provenance;
- replace the user's managed role set with an operator-supplied reason;
- see localized backend errors for access, validation, missing CSRF, not-found, and other API failures.

M11 does not add user enablement, disablement, deletion, invitation, impersonation, password management, OAuth-provider management, audit-log browsing, or arbitrary role creation. Those behaviors require separate roadmap and backend contract changes.

## Backend Contract

Use only these M11 endpoints:

- `GET /api/admin/users`
  - Operation `listUsers`.
  - Returns an array of `AdminUserAccountResponse`.
  - Has no documented query parameters. Do not add `page`, `size`, `sort`, search, or filter parameters unless the backend contract changes.
- `PUT /api/admin/users/{id}/roles`
  - Operation `replaceRoles`.
  - Replaces the managed role set for one persisted user.
  - Path parameter `id` is the persisted user id from `AdminUserAccountResponse`.
  - Request body is `AdminUserRoleUpdateRequest`.
  - Successful response is the refreshed `AdminUserAccountResponse`.
  - Error responses use `ApiProblemResponse`.

The contract owns exact fields for `AdminUserAccountResponse`, `AdminUserRoleGrantResponse`, `AdminUserRoleUpdateRequest`, and `ApiProblemResponse`. Implementation may name these generated types directly, but must not define divergent hand-written endpoint shapes.

There is no separate `GET /api/admin/users/{id}` endpoint in the approved contract. The detail route must be backed by the loaded list response and by the refreshed account returned from role replacement. A direct deep link to a user detail route may load the list first and select the matching id; it must not call an invented detail endpoint.

## Access And Session Rules

Admin user management is an authenticated, ADMIN-only surface.

- Bootstrap the app with `GET /api/session` before rendering protected admin content.
- Use existing session-cookie authentication. Do not add JWT, bearer-token, CORS, or provider-path assumptions.
- The backend remains the authorization owner. Treat `401` and `403` `ApiProblemResponse` payloads as localized display content.
- The route may hide or de-emphasize admin navigation when the current account roles are already known, but it must not rely on client-side role checks as the only authorization control.
- Anonymous users must be routed through the existing authenticated-route pattern before admin API calls are made.

## List And Detail Behavior

The primary admin route should be `/admin/users`. If a detail route is added, use a client route such as `/admin/users/:id`; this route is a frontend selection state, not a backend endpoint.

List behavior:

- Fetch `GET /api/admin/users` after an authenticated session is established.
- Render loading, empty, success, and error states.
- Display enough identity information for administrators to distinguish users, using fields supplied by `AdminUserAccountResponse`.
- Display current roles as role labels from the response.
- Do not send unsupported list query parameters.

Detail behavior:

- Selecting a user shows the selected `AdminUserAccountResponse` in a detail panel or route.
- If a direct detail route loads and the id is absent from the fetched list, show a frontend not-found state for that id.
- Role-grant provenance must be visible from the detail view using `AdminUserRoleGrantResponse` data from the contract. Show source, timestamp, granting operator identity when present, and reason when present.
- Preserve localized dates/times according to existing frontend conventions; do not transform UTC instants into new backend fields.

## Role Replacement Behavior

Role management is replacement-based, not patch-based.

- Submit `PUT /api/admin/users/{id}/roles` with a complete replacement role set and a reason field from `AdminUserRoleUpdateRequest`.
- The UI must make `USER` part of every submitted replacement set because the contract says `USER` must always be present.
- Do not submit duplicate roles or roles outside the contract enum.
- Require an explicit operator reason in the UI before enabling or submitting a role replacement. The request must include the contract's reason field. Backend validation remains authoritative for exact accepted values and length.
- On success, replace the list row and selected detail state with the returned `AdminUserAccountResponse`; do not assume the submitted roles are the final state.
- Do not add optimistic role changes unless they are reconciled immediately with the successful backend response and rolled back on failure.
- A replacement that removes `ADMIN` from the signed-in account requires an explicit confirmation dialog before the request is sent, because admin workflows close as soon as it succeeds.
- When a successful replacement targets the signed-in account, propagate the returned roles to the shared current-account state so navigation and admin gates react without a reload.
- When the backend returns `400`, `401`, `403`, or `404`, render the localized `ApiProblemResponse.message` and keep the previous user state visible.

## CSRF Rules

Only unsafe writes need CSRF handling.

- Do not send CSRF headers on `GET /api/admin/users`.
- For authenticated role replacement, use the current session's `csrf.cookieName` and `csrf.headerName` metadata to mirror the readable CSRF cookie into the configured request header.
- Reuse the same CSRF helper pattern as account-language updates and logout.
- If the readable cookie is absent, do not invent a token or header. Let the backend reject the write and render the localized problem response.
- Refresh session state after login or logout before an admin role replacement can be submitted.

## Error And Localization Rules

- Render backend `ApiProblemResponse.message` as display text.
- Use stable fields such as status, `messageKey`, and endpoint context for branching. Do not branch on English message text.
- Preserve the backend-resolved language from the problem response where existing error UI exposes it.
- For network failures or non-JSON failures, use the existing API-client fallback pattern; do not mask localized backend problems when a valid problem payload is returned.

## Required Tests

API-client tests:

- `GET /api/admin/users` calls the same-origin path, sends no invented auth headers, sends no unsupported query parameters, and returns the contract array type.
- `GET /api/admin/users` surfaces localized `401` and `403` problem responses.
- `PUT /api/admin/users/{id}/roles` sends the selected user id, JSON replacement body, and CSRF header from the session metadata and readable cookie.
- Missing readable CSRF cookie does not produce an invented header and surfaces the backend problem response.
- `400` validation, `403` access, and `404` not-found responses preserve the localized backend message.

Route/component tests:

- Anonymous users do not trigger admin list fetches and see the existing authenticated-route experience.
- Authenticated non-admin responses render localized `403` content.
- Empty list renders a clear empty state.
- Successful list renders users, roles, and selectable detail content.
- Direct detail route loads the list and selects the matching user id.
- Missing detail id after list load renders a frontend not-found state without calling an invented endpoint.
- Detail view renders role-grant provenance.
- Role replacement requires an operator reason and keeps `USER` in the submitted role set.
- Successful role replacement updates the row and detail from the backend response.
- Backend validation and missing-CSRF failures keep previous user state visible and render localized error text.

Validation for implementation should run the repository's normal app checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check`. Browser smoke should cover `/admin/users` access and a mocked or live authenticated role-replacement path when the supporting harness exists.
