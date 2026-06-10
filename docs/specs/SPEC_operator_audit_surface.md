# Operator Audit Surface Spec

## Contract Sources

This spec covers M10 from `ROADMAP.md`: a read-only operator overview plus a pageable audit log.

Use the imported backend contract as the source of truth for endpoint paths, query names, response fields, enum values, and error payloads:

- `docs/backend/approved-openapi.json`
  - `GET /api/admin/operator-surface`
  - `GET /api/admin/audit-logs`
  - `OperatorSurfaceResponse`, `OperatorAuditSection`, `OperatorRuntimeDiagnostics`, `OperatorOperationalStatus`
  - `AuditLogResponse`, `AuditLogPageResponse`, `ApiProblemResponse`
- `docs/backend/FRONTEND_AI_CONTRACT.md`
  - browser traffic targets same-origin `/api/**`
  - authentication is session-cookie based
  - no CORS, JWT, bearer-token, direct actuator, or alternate transport assumptions
  - localized `message` values are display content; branch on status, `messageKey`, and endpoint context

Do not duplicate durable endpoint schemas in frontend docs or implementation. Use generated OpenAPI types or the imported OpenAPI document for exact field shapes.

## Scope

Build a single read-only operator route, `/operator`, that shows:

- operator overview from `GET /api/admin/operator-surface`
- runtime and operational status summaries from that overview payload
- recent audit entries from the overview audit section
- pageable audit rows from `GET /api/admin/audit-logs`
- read-only inline details expanded beneath a selected audit entry

The route may be linked from top-level navigation for authenticated users. The route must remain directly addressable so browser refresh and shared URLs preserve filter state.

Out of scope:

- audit creation, deletion, export, retry, or replay
- CSRF handling for operator reads
- direct browser calls to `/`, `/actuator/**`, `/docs`, or `/v3/api-docs*`
- client-invented role, token, CORS, WebSocket, SSE, or polling contracts
- admin user management or localization editing behavior

## Access Model

M10 adapts to the existing M5 session bootstrap and authenticated route guard.

- Load `GET /api/session` through the existing session bootstrap before rendering protected route content.
- Anonymous users must see the existing sign-in-required guard state and the operator API clients must not call `/api/admin/operator-surface` or `/api/admin/audit-logs`.
- The session contract does not publish admin/operator roles. Do not invent a role field on `SessionResponse`.
- Authenticated users may enter the route. Backend responses from the operator endpoints are the authoritative authorization result.
- A `401` from either operator endpoint means the session is missing or invalid. Render the localized backend problem message when present.
- A `403` means the authenticated user lacks the backend-required ADMIN role. Render the localized backend problem message when present and do not redirect to login.
- Do not require an account profile fetch only to decide whether the operator route can mount. If future implementation already has account roles available, it may use them only as a navigation hint, not as the authorization source.

## API Behavior

Both operator API clients are read-only `GET` clients:

- use same-origin relative `/api/**` paths only
- send `credentials: "same-origin"`
- send `Accept: "application/json"`
- do not send CSRF headers, even when the current session has readable CSRF metadata
- parse `application/problem+json` errors through the shared API error handling path

The overview client must call the imported contract path `GET /api/admin/operator-surface`.

The audit log client must call the imported contract path `GET /api/admin/audit-logs`. If the UI displays or reuses `audit.auditLogEndpoint` from the overview response, validate that it is a relative `/api/**` path before using it. A missing, blank, or non-`/api/**` value must not cause a non-API browser request.

The operator surface includes endpoint strings for technical overview and actuator diagnostics. Render those values only as diagnostics from the payload. Do not fetch or link users to the non-API runtime endpoints unless a later imported backend contract adds supported `/api/**` paths for them.

## Query And State

The pageable audit table state is URL-backed on `/operator` and maps directly to the backend query contract:

- `targetType`
- `action`
- `actorLogin`
- `page`
- `size`
- repeated `sort`

Rules:

- Preserve Spring pagination semantics: `page` is zero-based, `size` is the requested page size, and each sort criterion is serialized as its own `sort` query parameter.
- Preserve repeated `sort` values from the URL when requesting the backend.
- Default omitted `page`, `size`, and `sort` to the backend contract defaults instead of inventing conflicting frontend defaults.
- Reset `page` to `0` when `targetType`, `action`, `actorLogin`, `size`, or visible sort controls change.
- Omit blank `targetType`, `action`, and whitespace-only `actorLogin` from backend requests.
- Keep the browser URL and rendered controls synchronized for refresh, back, and forward navigation.
- Treat `targetType` and `action` option values as contract values from the generated OpenAPI types, not as hand-maintained copies.

## Overview Behavior

The overview area renders independently from the pageable table so one failed request does not hide successful data from the other request.

Required overview states:

- loading state while the overview request is pending
- populated state with audit summary, runtime summary, and operational status summary
- empty/unavailable state when optional overview sections are absent
- localized error state for `401`, `403`, and other backend problem responses
- generic transport error state when no backend problem payload is available

Audit summary:

- show the total audit entry count when `audit.totalEntries` is present
- show the audit log endpoint as diagnostic text only when it is a safe `/api/**` path
- show recent entries newest first as returned by `audit.recentEntries`
- support expanding inline details from a recent entry
- show an empty recent-entry state when the recent list is absent or empty

Runtime summary:

- show available build, git, runtime, dependency, and configuration highlights from `runtime.technicalOverview`
- use the exact nested field names from the imported contract or generated types
- treat missing nested sections as unavailable, not as an application error

Operational status summary:

- show health, liveness, and readiness values when present
- show actuator endpoint strings only as diagnostic labels from the overview payload
- do not fetch actuator endpoints from the browser

## Pageable Audit Rows

The pageable audit table renders data from `AuditLogPageResponse`.

Table behavior:

- show a loading state while rows are pending
- show a row for each audit entry in `content`
- show human-readable timestamps from `createdAt` without changing the stored value
- show target type, target id, action, actor login, and summary using contract field names
- show an empty state when the page is empty
- use `totalElements`, `totalPages`, `number`, `size`, `first`, `last`, and `numberOfElements` for pagination labels and button disabled states when present
- keep pagination controls stable if optional pagination metadata is missing
- allow expanding inline details from any row

Filter controls:

- `targetType`: all targets plus contract enum values
- `action`: all actions plus contract enum values
- `actorLogin`: text input mapped to `actorLogin`
- `size`: compact page-size control that sends `size`
- sort controls may be select-based or table-header based, but requests must preserve repeated `sort`

Do not branch UI behavior on English audit summaries or localized messages.

## Inline Entry Details

Selecting a recent entry or table row expands read-only details inline, directly beneath the selected entry. Selecting the same entry again collapses the details.

The expanded details must show:

- the selected audit entry identity and timestamp
- target type and target id
- action
- actor login
- summary
- structured `details` rendered read-only

Rules:

- Preserve the backend `details` object shape; render it as formatted JSON or key/value sections without editing controls.
- Missing, null, empty, or partially populated `details` must render an empty-details state instead of crashing.
- The expand control communicates its state accessibly (for example `aria-expanded`), and collapsing keeps focus on that control.
- The inline details must not trigger mutation requests.
- Entries are not condensed or grouped; each audit record keeps its own row.

## Partial Payloads

The OpenAPI schemas do not require every object property. Implementation must tolerate partial payloads from both operator endpoints.

Required defensive behavior:

- optional top-level `audit`, `runtime`, and `operations` sections may be absent
- optional nested overview fields may be absent
- optional audit fields may be absent on an entry
- optional page metadata may be absent
- unknown `details` keys must be displayed without schema assumptions
- unknown enum values from the backend must be displayed as text rather than rejected after parsing

Partial payload handling is for robustness only. Do not use it to invent alternate backend contracts.

## Tests

Add focused tests with the implementation slice. Minimum coverage:

API client tests:

- `GET /api/admin/operator-surface` uses `credentials: "same-origin"`, `Accept: "application/json"`, and no CSRF header.
- `GET /api/admin/audit-logs` uses same-origin credentials, JSON accept headers, and no CSRF header.
- audit query serialization preserves `targetType`, `action`, `actorLogin`, `page`, `size`, and repeated `sort`.
- blank filters are omitted.
- localized `ApiProblemResponse.message` is exposed for display on `401` and `403`.
- non-`/api/**` overview endpoint metadata is not used for browser requests.

Route and component tests:

- anonymous `/operator` renders the existing sign-in-required guard and does not call operator endpoints.
- authenticated `/operator` requests overview and audit rows.
- overview renders audit count, runtime summary, operational status, and recent entries.
- filtered URL state hydrates controls and backend requests.
- changing filters resets `page` to `0`.
- repeated sort values survive refresh/back/forward and are sent as repeated `sort`.
- empty audit pages render an empty state.
- selecting a recent entry expands its inline details.
- selecting a table row expands its inline details.
- missing `details` and partial overview payloads render unavailable states without crashing.
- backend `401` and `403` localized errors render without redirect loops.
- transport failures render a generic endpoint-specific error.

Browser or smoke coverage:

- load `/operator` with no authenticated backend session and verify the route guard prevents operator API calls.
- when a live authenticated ADMIN session is available, verify overview, filters, pagination, and inline entry details against the real same-origin backend.
- if no live ADMIN session is available, report that authenticated operator browser smoke was skipped and keep automated component/API coverage as the validation source.

## Acceptance Criteria

M10 is complete when:

- the route is read-only and uses only the two imported operator audit GET contracts
- same-origin `/api/**` and session-cookie authentication rules are preserved
- no operator read request sends CSRF headers
- audit filters preserve `targetType`, `action`, `actorLogin`, `page`, `size`, and repeated `sort`
- overview, runtime/status summaries, recent entries, pageable rows, details, access, errors, empty states, and partial payloads have tests
- no durable endpoint schema is copied into implementation-owned docs or hand-maintained frontend types
