# Admin Localization Management Spec

## Status

Planned for M9. This spec owns the frontend behavior for admin localization message editing and locale coverage/status.

## Contract Sources

- Exact endpoint paths, methods, request fields, response fields, status codes, and generated TypeScript types come from `docs/backend/approved-openapi.json`.
- Browser integration, session, CSRF, supported languages, and localized-error rules come from `docs/backend/FRONTEND_AI_CONTRACT.md`.
- This spec must not become a duplicate endpoint schema. If the imported backend contract changes, refresh/regenerate the API types before implementing API-facing work.

## Scope

M9 adds an admin-facing localization management surface that lets an ADMIN session review localization messages by stable message key, edit individual localized message entries, and understand coverage across the supported application locales.

Supported locales for M9 are the frontend-contract languages: `en`, `es`, `de`, `fr`, `pl`, `uk`, and `no`.

The feature uses only same-origin `/api/**` browser requests, session-cookie authentication, and the CSRF metadata exposed by `GET /api/session`. It must not introduce CORS-dependent behavior, bearer tokens, hard-coded login paths, or any endpoint outside the imported backend contract.

## Backend Operations

Use the imported localization contract:

- `GET /api/localizations` for pageable localization rows, with the contract-owned `messageKey`, `language`, `page`, `size`, and repeated `sort` query parameters.
- `GET /api/localizations/{id}` for loading one localization row when the UI needs a fresh detail read.
- `POST /api/localizations` for creating a localization row.
- `PUT /api/localizations/{id}` for updating a localization row.
- `DELETE /api/localizations/{id}` for deleting a localization row.

Public read operations may remain public at the client layer, but the M9 management surface is an admin tool. Create, update, and delete operations require an authenticated session with the ADMIN role and a valid CSRF header mirrored from the readable CSRF cookie named by `session.csrf.cookieName` into the header named by `session.csrf.headerName`.

## Access Behavior

The route may be frontend-routed under an admin area, but backend traffic must remain on `/api/localizations...`.

Access rules:

- Anonymous users see the existing authenticated-route treatment before any mutation request is attempted.
- Authenticated users without ADMIN role evidence in the account profile see a restricted state and no edit controls.
- If role evidence is unavailable or stale, the backend remains authoritative. A `401` or `403` from any localization mutation is displayed as a localized backend failure and the UI must not infer access from English text.
- Public localization reads must not be used as proof that the current user can mutate localization data.

## Localization Workspace

The main view groups rows by `messageKey` and shows one locale status per supported locale. The list can be narrowed by message key and language using the contract filters. Pagination and sorting must preserve Spring conventions, including zero-based `page`, `size`, and repeated `sort` parameters.

Coverage/status is derived on the frontend from `GET /api/localizations` results and the supported-locale list in this spec:

- `complete`: every supported locale has one non-blank message for the message key.
- `partial`: at least one supported locale has a message and at least one supported locale is missing or blank.
- `missing`: the currently requested key or locale has no matching localization row.
- `conflict`: more than one row is returned for the same `messageKey` and `language`; show the rows and block bulk assumptions until the backend data is resolved.
- `unknown`: coverage cannot be computed because a required page failed to load.

The UI must make clear which locales are missing without treating localized message text itself as program logic. Coverage decisions are based on stable `messageKey`, `language`, row identity, row presence, and empty/non-empty `messageText`.

## Editing Behavior

The edit unit is one localization row identified by the backend `id`, or a new row for a selected `messageKey` and `language`.

Required behaviors:

- Create a missing locale entry with `POST /api/localizations`.
- Update an existing entry with `PUT /api/localizations/{id}`.
- Delete an existing entry with `DELETE /api/localizations/{id}` after an explicit confirmation.
- Use generated contract types for create/update payloads and returned rows.
- Keep fields and validation aligned with the imported `LocalizationRequest` and `LocalizationResponse` schemas instead of copying those schemas here.
- Refresh or patch the visible row state after a successful mutation so coverage/status reflects the backend response.

The contract permits the request payload to carry a message key. M9 may expose message-key editing for a single row, but it must not present an atomic "rename this key across all locales" operation unless a later backend contract adds that operation. If a future UI chooses to rename multiple locale rows through existing `PUT` calls, each row update must be treated as an independent mutation with per-row success/failure handling and a reload afterward.

## CSRF And Session Handling

Before any unsafe localization write, the implementation must have a current session from `GET /api/session`.

For authenticated writes:

- Use `credentials: "same-origin"`.
- Send JSON with `Accept: application/json` and `Content-Type: application/json` where a body is present.
- Mirror the readable CSRF cookie value from `session.csrf.cookieName` into `session.csrf.headerName` when `session.authenticated === true` and CSRF is enabled.
- If the readable CSRF cookie or CSRF metadata is missing, do not invent a fallback header. Send the request without the header and display the backend response.
- After login success or logout, refresh `GET /api/session` before the next unsafe localization write.

## Localized Failures

Error rendering follows the backend error contract:

- Display localized `ApiProblemResponse.message` when present.
- Preserve `ApiProblemResponse.language` and `messageKey` for diagnostics and accessible context when useful.
- Branch UI logic on stable data only: HTTP status, `messageKey`, endpoint context, row id, `messageKey`, and `language`.
- Never branch on English `message`, `title`, or `detail` text.

Expected failure cases to cover include unauthenticated mutation, authenticated non-admin mutation, invalid or missing CSRF, validation errors for locale/message fields, duplicate/conflicting localization rows if returned by the backend, not-found row update/delete, and network/load failures while computing coverage.

## Tests

Implementation must include focused API-client and UI tests for:

- `GET /api/localizations` query serialization with `messageKey`, `language`, `page`, `size`, and repeated `sort`.
- Coverage calculation for `complete`, `partial`, `missing`, `conflict`, and `unknown`.
- Supported-locale display for `en`, `es`, `de`, `fr`, `pl`, `uk`, and `no`.
- Create, update, and delete requests using same-origin `/api/localizations...`, generated contract types, JSON bodies where required, and M7-style CSRF header mirroring.
- Missing CSRF cookie behavior: no invented header, localized backend failure displayed.
- Anonymous and non-admin access states with no mutation attempt.
- Localized backend failures displayed directly while control flow uses stable status/messageKey/context.
- Successful mutation refresh/patch behavior that updates row data and coverage/status.

If authenticated browser smoke coverage exists by the time M9 is implemented, add or run coverage for the admin localization route. Until then, report the absence of a canonical authenticated admin browser smoke command and rely on focused component/API tests plus the standard validation commands.
