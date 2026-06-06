# M8 Admin Catalog Management Spec

## Purpose

M8 adds a combined admin surface for managing books and categories already exposed
by the imported backend contract. The feature is an authenticated, admin-oriented
extension of the existing catalog experience: admins can review catalog data,
create and edit books, delete books, create and edit categories, and delete only
categories that the backend reports as safe to delete.

This spec owns frontend behavior for the M8 implementation. It does not own API
schemas. Exact request fields, response fields, status codes, and generated types
come from `docs/backend/approved-openapi.json` and the generated OpenAPI types.

## Contract Sources

Use these sources in priority order for implementation:

1. `docs/backend/approved-openapi.json`
2. `docs/backend/FRONTEND_AI_CONTRACT.md`
3. Existing M7 session and CSRF helpers in `src/api/session.ts`
4. Existing public catalog query behavior in `src/api/catalog.ts`

Contract invariants:

- All browser API traffic stays same-origin under `/api/**`.
- Authentication uses the backend session cookie. Do not add JWT, bearer-token,
  CORS, provider-path, or alternate transport assumptions.
- Bootstrap auth state with `GET /api/session`.
- Unsafe writes use the current session metadata to mirror the readable CSRF
  cookie into the configured CSRF request header.
- Missing readable CSRF cookies are not invented client-side. Send the write
  without the CSRF header and render the localized backend failure.
- Localized backend `ApiProblemResponse.message` values are display content.
  Branch only on stable fields such as status, `messageKey`, and endpoint
  context.
- Preserve Spring pagination conventions: `page`, `size`, and repeated `sort`.
- Preserve repeated book category filters with repeated `category` query params.
- Book update requests must include the current `version` value from the loaded
  book.

## OpenAPI Operations In Scope

Use generated types from the imported OpenAPI contract for these operations:

| Behavior | Operation |
| --- | --- |
| List books | `GET /api/books` |
| Get one book for edit | `GET /api/books/{id}` |
| Create book | `POST /api/books` |
| Update book | `PUT /api/books/{id}` |
| Delete book | `DELETE /api/books/{id}` |
| List categories | `GET /api/categories` |
| Create category | `POST /api/categories` |
| Update category | `PUT /api/categories/{id}` |
| Delete category | `DELETE /api/categories/{id}` |

The implementation may use the existing public list clients where they already
match the contract. Write clients must be added through the same small API layer
style used for account language updates: generated OpenAPI types, same-origin
credentials, JSON bodies where the contract requires them, `Accept:
application/json`, and session-derived CSRF headers.

## Routes And Access

- Add an admin catalog route such as `/admin/catalog`.
- The route must require an authenticated session before rendering admin controls.
- The route must require an admin-capable session state from the backend contract.
  If the current session/account payload exposes roles, use that stable role data
  only for client-side affordances. The backend remains the source of truth and
  must still handle `401` and `403` write failures.
- Anonymous users must not see mutation controls. They should see the existing
  authenticated route guard behavior with login choices from `loginProviders[]`.
- Authenticated non-admin users must not see mutation controls. If the backend
  returns `403`, render the localized backend message and keep the user on the
  admin catalog route.
- Do not hard-code OAuth provider URLs, `/login`, or provider-specific paths.

## Admin Catalog Layout

The page should expose books and categories together because category management
directly affects book editing:

- A book management area with the existing catalog filters, URL-synced query
  state, pageable results, sortable columns, and row actions.
- A category management area listing all categories with create, edit, and delete
  actions.
- Book forms must use the category list from `GET /api/categories` for category
  selection.
- Loading, empty, success, and error states must be independently visible for
  books and categories so a category fetch failure does not hide a loaded book
  list, and a book fetch failure does not hide category management if categories
  loaded.

Do not replace the public catalog route. M8 adds admin management while preserving
existing public catalog behavior.

## Book Management Behavior

### List

- Keep the public catalog query contract for books: `title`, `author`, `isbn`,
  `year`, `yearFrom`, `yearTo`, repeated `category`, `page`, `size`, and repeated
  `sort`.
- Keep URL-synced query behavior for filters, page, page size, and sort.
- Render backend-localized read errors directly.

### Create

- Submit `POST /api/books` with the contract `BookCreateRequest` shape from
  generated types.
- Send `credentials: 'same-origin'`, `Accept: application/json`, `Content-Type:
  application/json`, and the CSRF header returned by the existing helper when the
  readable cookie is available.
- On success, add or refetch the affected book list and keep pagination behavior
  deterministic. If the created book is not visible under the current filters,
  show a success state and leave filters unchanged.
- Render validation or authorization failures from localized backend errors.

### Update

- Load or use a current `Book` record that includes `version` before opening the
  edit flow.
- Submit `PUT /api/books/{id}` with the generated `BookUpdateRequest` type and
  include the current `version`.
- On success, replace visible row/form data with the returned `Book`.
- On stale version failure, keep the edit form open, render the localized backend
  message, and offer a reload/refetch action that gets the latest book before the
  user retries. Do not branch on English message text and do not invent a
  client-side conflict status if the backend returns a different localized
  ProblemDetail shape.

### Delete

- Confirm destructive book deletes before calling `DELETE /api/books/{id}`.
- Send same-origin credentials and session-derived CSRF headers.
- On success, remove the book from the current visible results or refetch the
  current page. If the current page becomes empty and a previous page exists,
  request the previous page using the same filters and repeated sort values.
- Render localized backend failures directly.

## Category Management Behavior

### List

- Fetch categories from `GET /api/categories`.
- Use categories both for the category management list and book form/category
  filter controls.
- Render localized category read errors directly while preserving any successfully
  loaded book state.

### Create

- Submit `POST /api/categories` with the generated `CategoryCreateRequest` type.
- On success, insert or refetch the category list and make the new category
  available to book forms and filters.
- Render localized validation, `401`, or `403` failures directly.

### Update

- Submit `PUT /api/categories/{id}` with the generated `CategoryUpdateRequest`
  type.
- On success, replace visible category data and refresh any book form/category
  filter labels that reference the changed category.
- Render localized `401`, `403`, and `404` failures directly.

### Delete

- Confirm destructive category deletes before calling
  `DELETE /api/categories/{id}`.
- On `204`, remove the category from management controls and book filter/form
  choices.
- On backend category-in-use failure, including the documented `409` response,
  keep the category visible and render the localized backend message. Do not
  attempt client-side reassignment or cascading deletion unless a future backend
  contract adds such an operation.
- Render localized `401`, `403`, and `404` failures directly.

## Error Handling

- API errors should flow through the shared `ApiRequestError` and
  `parseApiProblem` pattern.
- Prefer displaying `problem.message` when present, with a generic endpoint-aware
  fallback only when the response is not a contract ProblemDetail.
- Preserve the backend-resolved `language` only as metadata or test evidence; do
  not branch UI logic on English text.
- Keep form input values intact after validation, CSRF, authorization,
  category-in-use, and stale-version failures.
- Successful writes should clear stale error banners for the affected form/action
  without hiding unrelated errors from the other management area.

## CSRF And Session Rules

- Reuse the M7 helper behavior for unsafe writes.
- Only mirror CSRF when `session.authenticated === true`, CSRF is enabled, and the
  readable cookie named by session metadata is present.
- Use the configured `csrf.cookieName` and `csrf.headerName`; current names are an
  implementation detail of the imported contract, not literals for new code.
- If a write receives a CSRF-related backend error, render the localized message
  and allow retry after the session/cookie state changes.
- Refresh `GET /api/session` after login/logout events before issuing writes.

## Tests Required

Add focused coverage when implementing M8:

- API client tests for each write method:
  - uses generated request types and the documented `/api/**` paths
  - sends same-origin credentials
  - sends JSON headers for JSON bodies
  - mirrors configured CSRF metadata when the readable cookie is available
  - omits invented CSRF headers when the cookie is missing
  - parses localized `ApiProblemResponse` failures
- Book list/query tests preserving `page`, `size`, repeated `sort`, and repeated
  `category` behavior in the admin route.
- Book create success and localized validation failure UI tests.
- Book update success test asserting the submitted body includes `version`.
- Stale book version UI test using a localized backend error; assert the form
  stays open, the message is visible, and a reload/refetch path is available.
- Book delete confirmation, success refresh/removal, and localized failure tests.
- Category create, update, and delete success tests.
- Category-in-use delete test using the documented `409` ProblemDetail response;
  assert the category remains visible and the localized message is displayed.
- Anonymous access test proving mutation controls are not rendered and login
  choices come from `loginProviders[]`.
- Authenticated non-admin or backend `403` test proving localized authorization
  failures render without exposing unsupported flows.
- Missing-CSRF write test proving the frontend lets the backend respond and shows
  the localized error.

Run the current minimum validation for implementation changes: `npm run lint`,
`npm run typecheck`, `npm test`, `npm run build`, and `git diff --check`. Browser
or smoke coverage should be added for the routed admin page once implementation
exists and a same-origin backend session is available.

## Out Of Scope

- User/role management beyond checking stable session/account role data for
  client-side affordances.
- Localization message editing.
- Audit/operator views.
- Category reassignment, cascading deletes, or bulk operations.
- New backend endpoints, new auth headers, JWT flows, CORS-dependent behavior, or
  hard-coded OAuth/provider paths.
