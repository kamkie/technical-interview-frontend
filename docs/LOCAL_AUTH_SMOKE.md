# Local Auth Smoke

Use this workflow to verify the local same-origin browser auth contract against the sibling backend checkout at `..\technical-interview-demo`.

The canonical automated authenticated smoke command is `npm run smoke:authenticated`; it starts this repository's contract-backed mock API and does not require the sibling backend. The canonical live-backend authenticated smoke path uses the backend fake-OAuth provider. It does not require external identity-provider credentials and it must still discover login, account, logout, and CSRF behavior from `GET /api/session`.

## Contract Under Test

- Open the frontend at `http://127.0.0.1:5173`.
- Browser API traffic uses relative `/api/**` requests. Vite proxies those requests to the backend at `http://localhost:8080`.
- The Vite proxy preserves the frontend host for proxied requests so OAuth redirects can be registered for and return to the frontend origin during local smoke.
- The UI discovers auth behavior from `GET /api/session`: `loginProviders[]`, `accountPath`, `logoutPath`, `sessionCookie`, and `csrf` metadata.
- For fake-OAuth smoke, find the `smoke` provider in `loginProviders[]` and start login through its relative `authorizationPath`.
- Do not hard-code `/login`, provider authorization paths, backend fake-provider support paths, logout paths, CSRF cookie names, or CSRF header names in app behavior or smoke automation.
- Do not add CORS, JWT, bearer-token, direct provider-token, or equivalent provider-token behavior to the frontend smoke path.

## Canonical Fake-OAuth Readiness

Use the sibling backend profile `local,oauth,fake-oauth` for the repeatable local authenticated smoke path.

Canonical backend inputs:

- `SPRING_PROFILES_ACTIVE=local,oauth,fake-oauth`
- `APP_BOOTSTRAP_INITIAL_ADMIN_IDENTITIES=smoke:smoke-user`
- login provider discovered from `GET /api/session` where `registrationId === "smoke"`
- default fake login `smoke-user`

Default fake identity values from the backend are:

- provider: `smoke`
- login: `smoke-user`
- display name: `Smoke Test User`
- email: `smoke-user@example.test`

Optional backend-only overrides:

- Use `FAKE_OAUTH_LOGIN`, `FAKE_OAUTH_DISPLAY_NAME`, and `FAKE_OAUTH_EMAIL` only when the smoke scenario needs different account data.
- If `FAKE_OAUTH_LOGIN` changes and admin smoke is in scope, update `APP_BOOTSTRAP_INITIAL_ADMIN_IDENTITIES` to `smoke:<that-login>` so the first-admin bootstrap identity still matches the fake account.
- If the backend is not reachable at its default local address, use the backend runbook's `FAKE_OAUTH_TOKEN_URI` and `FAKE_OAUTH_USER_INFO_URI` guidance for backend-owned provider configuration. The frontend still discovers only `authorizationPath` from `/api/session`.
- Do not commit fake provider secrets or make `FAKE_OAUTH_*` values frontend assumptions. Other fake-provider knobs remain backend-owned.

## Prerequisites

- The default sibling checkout layout:

  ```text
  D:\Projects\demo\
  |-- technical-interview-demo\
  `-- technical-interview-frontend\
  ```

- Frontend dependencies installed with `npm install` when needed.
- Backend local prerequisites from `..\technical-interview-demo\SETUP.md`.
- A local backend data state where first-admin bootstrap can grant the `smoke:smoke-user` identity when admin checks are required. The backend grants the first persisted admin role only while no admin grant already exists.

If another admin grant already exists in local data, `smoke:smoke-user` will not be promoted by the bootstrap setting. Reset local data or use a matching seeded admin identity before treating admin-only access as canonical smoke evidence.

## Start The Backend

From a PowerShell shell in the sibling backend repository:

```powershell
cd ..\technical-interview-demo

$env:SPRING_PROFILES_ACTIVE = 'local,oauth,fake-oauth'
$env:APP_BOOTSTRAP_INITIAL_ADMIN_IDENTITIES = 'smoke:smoke-user'

docker-compose up -d
./build.ps1 bootRun
```

Optional fake identity overrides, when the scenario explicitly needs them:

```powershell
$env:FAKE_OAUTH_LOGIN = 'custom-smoke-user'
$env:FAKE_OAUTH_DISPLAY_NAME = 'Custom Smoke User'
$env:FAKE_OAUTH_EMAIL = 'custom-smoke-user@example.test'
$env:APP_BOOTSTRAP_INITIAL_ADMIN_IDENTITIES = 'smoke:custom-smoke-user'
```

Do not activate `fake-oauth` with the backend `prod` profile.

Wait for the backend to become ready:

```powershell
Invoke-WebRequest http://127.0.0.1:8080/actuator/health/readiness
```

## Start The Frontend

From this repository:

```powershell
cd ..\technical-interview-frontend
npm run dev
```

Open `http://127.0.0.1:5173`. Keep the browser on this origin for the full smoke so the session and CSRF cookies belong to the frontend origin served by Vite.

## Manual Fake-OAuth Smoke Steps

1. Verify anonymous bootstrap.

   Open the app or request `http://127.0.0.1:5173/api/session`. Expect `HTTP 200`, `authenticated: false`, session-cookie metadata, CSRF metadata, and `loginProviders[]` containing a provider whose `registrationId` is `smoke` and whose `authorizationPath` is a relative path. The response should also issue or refresh the readable CSRF cookie.

   If the backend is unavailable, record the authenticated smoke as skipped with the backend-unavailable reason. If `/api/session` is reachable but the `smoke` provider is absent, record the authenticated fake-OAuth smoke as skipped because the backend is not running the canonical fake-OAuth profile; do not substitute a hard-coded provider path.

2. Verify metadata-driven fake login.

   Start login from the UI provider choice for the discovered `smoke` provider. If the UI control is not available for the current task, read the discovered `loginProviders[].authorizationPath` from `GET /api/session` and navigate to that relative path on `http://127.0.0.1:5173`.

   The default fake provider should complete the browser login as `smoke-user` without external provider credentials. Smoke tooling should not know or navigate to backend fake-provider support endpoints directly.

3. Verify authenticated session refresh.

   After the provider redirects back, call `GET /api/session` again through the frontend origin. Expect `authenticated: true`, a usable `accountPath`, a `logoutPath`, and current CSRF metadata. Missing `accountPath`, missing `logoutPath`, or missing enabled CSRF metadata after successful login is a failed authenticated smoke.

4. Verify account access.

   Request the returned `accountPath` through the same frontend origin. Expect `HTTP 200` with the persisted current-account profile for the fake identity. With the default fake identity, the account login should be `smoke-user`; if `FAKE_OAUTH_LOGIN` was overridden, expect that configured login instead.

   If this returns unauthorized after login, confirm the login flow started from `http://127.0.0.1:5173` and used the discovered `authorizationPath`.

5. Verify admin access when the first-admin seed is part of the smoke.

   With an eligible local backend data state and `APP_BOOTSTRAP_INITIAL_ADMIN_IDENTITIES=smoke:smoke-user`, verify an approved admin-only surface such as `GET /api/admin/users` through the frontend origin or the implemented `/admin/users` route. Expect admin access to succeed for the seeded fake identity.

   A `401` or `403` from the admin-only check is a failed canonical admin smoke when the backend was started from clean data with the selected bootstrap identity. If local data already contained another admin grant before startup, record the admin check as skipped due non-canonical local data and reset or reseed before using it as readiness evidence.

6. Verify CSRF-backed logout.

   When a real authenticated session exists, logout is an unsafe request and must include the configured CSRF header. This browser-console snippet uses only `GET /api/session` metadata:

   ```js
   const session = await fetch('/api/session', { credentials: 'same-origin' }).then(
     (response) => response.json(),
   )
   const csrfCookieName = session.csrf?.cookieName
   const csrfHeaderName = session.csrf?.headerName
   const csrfCookiePrefix = `${csrfCookieName}=`
   const csrfToken = document.cookie
     .split('; ')
     .find((cookie) => cookie.startsWith(csrfCookiePrefix))
     ?.slice(csrfCookiePrefix.length)

   if (!session.logoutPath || !csrfCookieName || !csrfHeaderName || !csrfToken) {
     throw new Error('Missing logout or CSRF metadata from /api/session')
   }

   const logoutResponse = await fetch(session.logoutPath, {
     method: 'POST',
     credentials: 'same-origin',
     headers: {
       [csrfHeaderName]: decodeURIComponent(csrfToken),
     },
   })

   if (logoutResponse.status !== 204) {
     throw new Error(`Expected logout HTTP 204, got ${logoutResponse.status}`)
   }

   await fetch('/api/session', { credentials: 'same-origin' }).then((response) =>
     response.json(),
   )
   ```

   Expect logout to return `HTTP 204`. A following `GET /api/session` should show `authenticated: false`, and the next `GET` to the account path should be unauthorized.

## Skip And Fail Behavior

Use explicit skip reasons for environment prerequisites that are outside frontend control:

- backend readiness endpoint is unavailable
- `GET /api/session` cannot be reached through the frontend origin because the backend is not running
- the `smoke` provider is absent from `loginProviders[]`, meaning the backend is not running the canonical fake-OAuth profile
- admin-only verification is requested but local data already contains a different first-admin grant
- optional external-provider smoke is requested without local provider credentials

Treat these as failures:

- frontend code or smoke automation hard-codes provider authorization paths, backend fake-provider support paths, logout paths, CSRF names, bearer tokens, JWTs, or CORS assumptions
- `GET /api/session` succeeds but omits metadata required by the current step
- fake login succeeds but `GET /api/session` does not become authenticated
- account access through the returned `accountPath` fails after login
- admin access fails for a clean local backend started with `APP_BOOTSTRAP_INITIAL_ADMIN_IDENTITIES=smoke:smoke-user`
- logout omits the configured CSRF header for an authenticated session or does not return `HTTP 204`
- smoke assertions branch on localized English response `message` text instead of stable fields such as status, `messageKey`, and endpoint context

## Optional External Provider Smoke

GitHub and OIDC checks are optional manual smoke paths. They are not the canonical local authenticated automation path because they require external provider credentials.

Provider expectations from the backend operations guide:

- GitHub uses `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
- OIDC uses `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, and `OIDC_ISSUER_URI`.
- For Vite same-origin smoke, register provider callbacks for the frontend origin that starts the browser flow. With the default dev server, use:
  - GitHub: `http://127.0.0.1:5173/api/session/login/oauth2/code/github`
  - OIDC: `http://127.0.0.1:5173/api/session/login/oauth2/code/oidc`
- These callback URLs are external-provider registration values, not frontend login bootstrap assumptions. The frontend still starts login from the provider `authorizationPath` discovered in `GET /api/session`.
- If you smoke the backend directly without the frontend proxy, use the backend origin callback documented by the backend runbook instead.

Admin identity seeding for external providers uses `APP_BOOTSTRAP_INITIAL_ADMIN_IDENTITIES`, for example `github:your-login` or `oidc:your-login`. It only grants the first persisted admin role while no admin grant already exists.

## CSRF Rules For Future Authenticated Writes

- Always call `GET /api/session` after login and again after logout before the next unsafe write.
- For authenticated `POST`, `PUT`, and `DELETE` requests, read `csrf.cookieName` from the browser cookie jar and mirror its value into `csrf.headerName`.
- Branch on stable response fields, HTTP status, `messageKey`, and endpoint context. Treat localized `message` values as display content only.
- Missing or invalid CSRF on unsafe authenticated `/api/**` writes should be treated as a failed smoke, not as a reason to relax the frontend contract.

## Automation Policy

- Anonymous browser automation may run without provider secrets. The canonical command is `npm run smoke:anonymous` from the frontend repository. It covers `GET /api/session`, public catalog reads, unauthenticated rendering, URL-backed public catalog filters, pagination, sorting, repeated category/sort query semantics, and reproducible localized public-read failures when the backend exposes them. Backend/frontend/browser prerequisite failures are reported as skips with explicit reasons.
- Authenticated mock browser automation may run without the sibling backend or provider secrets. The canonical command is `npm run smoke:authenticated` from the frontend repository. It starts Vite in mock mode and covers anonymous session bootstrap, metadata-driven login, account access, admin access, CSRF-backed logout, post-logout session state, and same-origin `/api/**` request shape.
- Live-backend authenticated automation, if added beyond this manual workflow, should target the backend `local,oauth,fake-oauth` profile and the discovered `smoke` provider.
- Authenticated browser automation must not require committed provider secrets, provider access tokens, bearer tokens, or hard-coded provider paths.
- Authenticated automation must start login from the discovered `loginProviders[].authorizationPath` and must use `accountPath`, `logoutPath`, `csrf.cookieName`, and `csrf.headerName` from `GET /api/session`.
- Unsafe-write automation must re-bootstrap the session after login/logout and mirror the readable CSRF cookie into the configured request header.
- This document remains the manual source of truth for live sibling-backend auth verification and the shared auth-smoke constraints.
