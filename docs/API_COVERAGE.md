# API Coverage Audit

## Purpose

This document owns the M16 contract coverage audit for the frontend. It maps the
approved backend OpenAPI operations to generated types, API clients, route/UI
coverage, tests, and specs.

The audit is documentation-only. It does not introduce endpoint clients, routes,
request fields, authentication headers, CORS behavior, JWT or bearer-token
assumptions, provider-path constants, or alternate transports.

## Audit Inputs

- Contract source: `docs/backend/approved-openapi.json`
- Frontend integration rules: `docs/backend/FRONTEND_AI_CONTRACT.md`
- Backend import notes: `docs/backend/README.md`
- Generated TypeScript contract map: `src/api/generated/openapi.ts`
- Client layer: `src/api/`
- Route, component, and API tests: `src/**/*.test.*`
- Behavior specs: `docs/specs/`
- Public project and roadmap context: `README.md`, `ROADMAP.md`

The operation inventory was parsed from `docs/backend/approved-openapi.json`
with `JSON.parse` in Node.js, then cross-checked against the generated path map
in `src/api/generated/openapi.ts:757`. The parser found 14 approved path
templates and 22 approved operations, matching the imported frontend contract
summary.

## Classification Counts

| Classification | Count | Meaning |
| --- | ---: | --- |
| Implemented | 22 | The operation has generated type coverage, a frontend client, and test, route, or spec evidence. |
| Deferred | 0 | No approved operation is intentionally left out of the current frontend surface. |
| Needs follow-up | 0 | No approved operation is missing enough coverage to require M22 surface selection before use. |

## Contract Invariants Checked

- Browser API clients use same-origin `/api/**` paths and `credentials:
  'same-origin'` rather than CORS, JWT, bearer-token, or alternate transport
  assumptions. Examples: `src/api/session.ts:14`, `src/api/catalog.ts:47`,
  `src/api/operator.ts:38`.
- Session bootstrap uses `GET /api/session`; login providers are exposed through
  `getLoginProviders(session)` and rendered from `provider.authorizationPath`.
  Evidence: `src/api/session.ts:14`, `src/api/session.ts:69`,
  `src/App.tsx:184`, `src/App.tsx:352`.
- Logout and unsafe writes mirror CSRF only from the current session metadata and
  readable cookie. Evidence: `src/api/session.ts:38`,
  `src/api/session.ts:75`, `src/api/catalog.ts:242`,
  `src/api/localizations.ts:264`, `src/api/adminUsers.ts:77`,
  `src/api/account.ts:68`.
- Spring pagination and repeated `sort` values are preserved for pageable reads.
  Evidence: `src/api/catalog.ts:142`, `src/api/localizations.ts:125`,
  `src/api/operator.ts:51`, `src/api/catalog.test.ts:25`,
  `src/api/localizations.test.ts:20`, `src/api/operator.test.ts:59`.
- Repeated book `category` filters are preserved. Evidence:
  `src/api/catalog.ts:142`, `src/api/catalog.test.ts:25`,
  `src/catalog/CatalogPanel.test.tsx:83`.
- Book updates include the backend `version` value loaded from the current book.
  Evidence: `src/api/catalog.test.ts:157`,
  `src/admin/AdminCatalogPage.tsx:343`,
  `src/admin/AdminCatalogPage.tsx:401`,
  `src/admin/AdminCatalogPage.test.tsx:205`.

## Operation Coverage

| Operation | Classification | Evidence |
| --- | --- | --- |
| `GET /api/session` (`currentSession`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:660`, `src/api/generated/openapi.ts:792`. Client: `src/api/session.ts:14`. App bootstrap: `src/App.tsx:184`. Tests: `src/api/session.test.ts:15`, `src/App.test.tsx:48`. |
| `POST /api/session/logout` (`logout`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:528`, `src/api/generated/openapi.ts:777`. Client uses session-provided `logoutPath`: `src/api/session.ts:38`. UI action: `src/App.tsx:51`. Tests cover CSRF metadata, missing cookie, anonymous idempotence, and localized errors: `src/api/session.test.ts:58`, `src/api/session.test.ts:87`, `src/api/session.test.ts:109`, `src/api/session.test.ts:131`, `src/App.test.tsx:427`. |
| `GET /api/account` (`currentUser`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:743`, `src/api/generated/openapi.ts:804`. Client uses session `accountPath` when safe: `src/api/account.ts:19`, `src/api/account.ts:86`. UI: `src/account/AccountProfile.tsx:19`. Tests: `src/api/account.test.ts:14`, `src/App.test.tsx:136`, `src/App.test.tsx:398`. |
| `PUT /api/account/language` (`updatePreferredLanguage`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:509`, `src/api/generated/openapi.ts:774`. Client: `src/api/account.ts:49`. UI: `src/account/AccountProfile.tsx:166`. Tests cover CSRF metadata, blank clearing, missing cookie, and localized validation errors: `src/api/account.test.ts:107`, `src/api/account.test.ts:139`, `src/api/account.test.ts:177`, `src/api/account.test.ts:204`, `src/App.test.tsx:189`. |
| `GET /api/books` (`findAll_2`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:617`, `src/api/generated/openapi.ts:788`. Client and query builder: `src/api/catalog.ts:47`, `src/api/catalog.ts:142`. Public and admin UI: `src/catalog/CatalogPanel.tsx:81`, `src/admin/AdminCatalogPage.tsx:198`. Tests: `src/api/catalog.test.ts:25`, `src/api/catalog.test.ts:40`, `src/catalog/CatalogPanel.test.tsx:33`, `src/admin/AdminCatalogPage.test.tsx:36`. |
| `POST /api/books` (`create_2`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:641`, `src/api/generated/openapi.ts:790`. Client: `src/api/catalog.ts:69`. Admin UI: `src/admin/AdminCatalogPage.tsx:370`. Spec: `docs/specs/SPEC_admin_catalog_management.md:106`. Tests: `src/api/catalog.test.ts:120`, `src/admin/AdminCatalogPage.test.tsx:106`, `src/admin/AdminCatalogPage.test.tsx:160`. |
| `GET /api/books/{id}` (`findById_1`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:416`, `src/api/generated/openapi.ts:766`. Client: `src/api/catalog.ts:62`. Admin edit and reload flows: `src/admin/AdminCatalogPage.tsx:401`, `src/admin/AdminCatalogPage.tsx:426`. Spec: `docs/specs/SPEC_admin_catalog_management.md:49`. Route tests cover edit loading, stale-version reload behavior, and version-gated editing: `src/admin/AdminCatalogPage.test.tsx:205`, `src/admin/AdminCatalogPage.test.tsx:254`, `src/admin/AdminCatalogPage.test.tsx:278`. |
| `PUT /api/books/{id}` (`update_2`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:431`, `src/api/generated/openapi.ts:768`. Client: `src/api/catalog.ts:77`. Admin UI: `src/admin/AdminCatalogPage.tsx:343`. Spec requires current `version`: `docs/specs/SPEC_admin_catalog_management.md:122`. Tests: `src/api/catalog.test.ts:157`, `src/admin/AdminCatalogPage.test.tsx:205`, `src/admin/AdminCatalogPage.test.tsx:278`. |
| `DELETE /api/books/{id}` (`delete_2`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:453`, `src/api/generated/openapi.ts:769`. Client: `src/api/catalog.ts:92`. Admin UI: `src/admin/AdminCatalogPage.tsx:461`. Spec: `docs/specs/SPEC_admin_catalog_management.md:135`. Tests: `src/api/catalog.test.ts:190`, `src/admin/AdminCatalogPage.test.tsx:321`, `src/admin/AdminCatalogPage.test.tsx:348`. |
| `GET /api/categories` (`findAll_1`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:577`, `src/api/generated/openapi.ts:784`. Client: `src/api/catalog.ts:56`. Public and admin UI: `src/catalog/CatalogPanel.tsx:58`, `src/admin/AdminCatalogPage.tsx:172`. Spec: `docs/specs/SPEC_admin_catalog_management.md:148`. Tests: `src/api/catalog.test.ts:77`, `src/catalog/CatalogPanel.test.tsx:33`, `src/catalog/CatalogPanel.test.tsx:196`. |
| `POST /api/categories` (`create_1`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:588`, `src/api/generated/openapi.ts:786`. Client: `src/api/catalog.ts:100`. Admin UI: `src/admin/AdminCatalogPage.tsx:504`. Spec: `docs/specs/SPEC_admin_catalog_management.md:157`. Tests: `src/api/catalog.test.ts:211`, `src/admin/AdminCatalogPage.test.tsx:381`. |
| `PUT /api/categories/{id}` (`update_1`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:345`, `src/api/generated/openapi.ts:763`. Client: `src/api/catalog.ts:114`. Admin UI: `src/admin/AdminCatalogPage.tsx:539`. Spec: `docs/specs/SPEC_admin_catalog_management.md:164`. Tests: `src/api/catalog.test.ts:211`, `src/admin/AdminCatalogPage.test.tsx:381`. |
| `DELETE /api/categories/{id}` (`delete_1`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:382`, `src/api/generated/openapi.ts:764`. Client: `src/api/catalog.ts:129`. Admin UI: `src/admin/AdminCatalogPage.tsx:580`. Spec: `docs/specs/SPEC_admin_catalog_management.md:170`. Tests cover success, category-in-use, and missing CSRF behavior: `src/api/catalog.test.ts:254`, `src/admin/AdminCatalogPage.test.tsx:381`, `src/admin/AdminCatalogPage.test.tsx:423`, `src/admin/AdminCatalogPage.test.tsx:454`. |
| `GET /api/localizations` (`findAll`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:539`, `src/api/generated/openapi.ts:780`. Client and query builder: `src/api/localizations.ts:68`, `src/api/localizations.ts:125`. Admin UI: `src/admin/AdminLocalizationPage.tsx:190`. Spec: `docs/specs/SPEC_admin_localization_management.md:23`. Tests: `src/api/localizations.test.ts:20`, `src/api/localizations.test.ts:34`, `src/admin/AdminLocalizationPage.test.tsx:35`. |
| `POST /api/localizations` (`create`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:558`, `src/api/generated/openapi.ts:782`. Client: `src/api/localizations.ts:88`. Admin UI: `src/admin/AdminLocalizationPage.tsx:357`. Spec: `docs/specs/SPEC_admin_localization_management.md:63`. Tests: `src/api/localizations.test.ts:93`, `src/admin/AdminLocalizationPage.test.tsx:93`, `src/admin/AdminLocalizationPage.test.tsx:294`. |
| `GET /api/localizations/{id}` (`findById`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:294`, `src/api/generated/openapi.ts:757`. Client: `src/api/localizations.ts:77`. Admin edit flow: `src/admin/AdminLocalizationPage.tsx:323`. Spec: `docs/specs/SPEC_admin_localization_management.md:26`. Tests: `src/api/localizations.test.ts:72`, `src/admin/AdminLocalizationPage.test.tsx:164`. |
| `PUT /api/localizations/{id}` (`update`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:309`, `src/api/generated/openapi.ts:759`. Client: `src/api/localizations.ts:102`. Admin UI: `src/admin/AdminLocalizationPage.tsx:344`. Spec: `docs/specs/SPEC_admin_localization_management.md:64`. Tests: `src/api/localizations.test.ts:131`, `src/admin/AdminLocalizationPage.test.tsx:164`. |
| `DELETE /api/localizations/{id}` (`delete`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:331`, `src/api/generated/openapi.ts:760`. Client: `src/api/localizations.ts:117`. Admin UI: `src/admin/AdminLocalizationPage.tsx:393`. Spec: `docs/specs/SPEC_admin_localization_management.md:65`. Tests: `src/api/localizations.test.ts:163`, `src/admin/AdminLocalizationPage.test.tsx:233`. |
| `GET /api/admin/users` (`listUsers`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:671`, `src/api/generated/openapi.ts:795`. Client: `src/api/adminUsers.ts:29`. Admin UI: `src/admin/AdminUsersPage.tsx:128`. Spec: `docs/specs/SPEC_admin_user_management.md:30`. Tests: `src/api/adminUsers.test.ts:14`, `src/admin/AdminUsersPage.test.tsx:33`, `src/admin/AdminUsersPage.test.tsx:81`, `src/admin/AdminUsersPage.test.tsx:93`. |
| `PUT /api/admin/users/{id}/roles` (`replaceRoles`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:467`, `src/api/generated/openapi.ts:772`. Client and path builder: `src/api/adminUsers.ts:56`, `src/api/adminUsers.ts:95`. Admin UI: `src/admin/AdminUsersPage.tsx:194`. Spec: `docs/specs/SPEC_admin_user_management.md:34`. Tests: `src/api/adminUsers.test.ts:47`, `src/api/adminUsers.test.ts:93`, `src/admin/AdminUsersPage.test.tsx:176`, `src/admin/AdminUsersPage.test.tsx:227`. |
| `GET /api/admin/operator-surface` (`getSurface`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:692`, `src/api/generated/openapi.ts:798`. Client: `src/api/operator.ts:38`. Operator UI: `src/operator/OperatorPage.tsx:131`. Spec: `docs/specs/SPEC_operator_audit_surface.md:10`. Tests: `src/api/operator.test.ts:15`, `src/api/operator.test.ts:131`, `src/operator/OperatorPage.test.tsx:26`, `src/operator/OperatorPage.test.tsx:135`. |
| `GET /api/admin/audit-logs` (`findAll_3`) | Implemented | Generated operation and path map: `src/api/generated/openapi.ts:713`, `src/api/generated/openapi.ts:801`. Client and query builder: `src/api/operator.ts:44`, `src/api/operator.ts:51`. Operator UI: `src/operator/OperatorPage.tsx:161`. Spec: `docs/specs/SPEC_operator_audit_surface.md:11`. Tests: `src/api/operator.test.ts:32`, `src/api/operator.test.ts:59`, `src/operator/OperatorPage.test.tsx:26`, `src/operator/OperatorPage.test.tsx:93`. |

## Audit Findings

- All 22 approved operations are already represented by generated OpenAPI types and
  frontend clients.
- All approved operations have at least API-client, route/component, or focused
  spec evidence. No operation requires a new endpoint client, route, or app
  behavior in M16.
- `GET /api/books/{id}` is exercised through the admin catalog edit and reload
  route tests rather than a standalone API-client unit test. This is not an
  operation gap because the client exists and the route uses the approved path.
- No stale-contract signal was found in this audit: the parsed operation count
  matches `docs/backend/FRONTEND_AI_CONTRACT.md`, and every approved path template
  is present in `src/api/generated/openapi.ts`.

## M16-Time Recommendation

Recommended next promotion after the M16 audit:

1. Promote M17, anonymous browser smoke automation. Since no approved API surface
   is missing, the highest-value dependent follow-up is live same-origin coverage
   for anonymous session bootstrap, public categories/books, filters, pagination,
   repeated sort, and localized public-read failures.
2. Promote M21 in parallel or immediately after M17. Session and logout operations
   are implemented, but the planned metadata guardrail should still audit source,
   tests, docs, and specs for provider path constants outside backend-contract
   examples and fixtures.

At M16 audit time, M22 was not promoted for backend surface expansion because
there were no uncovered approved operations to select. M17 and M21 later shipped,
M19 and M23 were later selected and completed from explicit UI scope, and M22
remains unnecessary unless a future backend contract refresh introduces an
approved operation gap.
