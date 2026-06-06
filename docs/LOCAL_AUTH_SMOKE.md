# Local Auth Smoke

Use this workflow to verify the local same-origin browser auth contract against the
sibling backend checkout at `..\technical-interview-demo`.

## Contract Under Test

- Open the frontend at `http://127.0.0.1:5173`.
- Browser API traffic uses relative `/api/**` requests. Vite proxies those requests to
  the backend at `http://localhost:8080`.
- The Vite proxy preserves the frontend host for proxied requests so OAuth redirects
  can be registered for and return to the frontend origin during local smoke.
- The UI discovers auth behavior from `GET /api/session`: `loginProviders[]`,
  `accountPath`, `logoutPath`, `sessionCookie`, and `csrf` metadata.
- Do not hard-code `/login`, provider authorization paths, logout paths, CSRF cookie
  names, or CSRF header names in app behavior.
- Do not add CORS, JWT, bearer-token, or direct provider-token behavior to the
  frontend smoke path.

## Prerequisites

- The default sibling checkout layout:

  ```text
  D:\Projects\demo\
  |-- technical-interview-demo\
  `-- technical-interview-frontend\
  ```

- Frontend dependencies installed with `npm install` when needed.
- Backend local prerequisites from `..\technical-interview-demo\SETUP.md`.
- At least one OAuth provider configured for the backend `oauth` profile.

Provider expectations from the backend operations guide:

- GitHub uses `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
- OIDC uses `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, and `OIDC_ISSUER_URI`.
- For this Vite same-origin smoke, register provider callbacks for the frontend
  origin that starts the browser flow. With the default dev server, use:
  - GitHub: `http://127.0.0.1:5173/api/session/login/oauth2/code/github`
  - OIDC: `http://127.0.0.1:5173/api/session/login/oauth2/code/oidc`
- If you smoke the backend directly without the frontend proxy, use the backend
  origin callback documented by the backend runbook instead.

Admin identity seeding is optional for the session/account/logout smoke, but needed
before admin-only API checks. The backend supports first-admin bootstrap through
`APP_BOOTSTRAP_INITIAL_ADMIN_IDENTITIES`, for example `github:your-login` or
`oidc:your-login`. It only grants the first persisted admin role while no admin grant
already exists.

## Start The Backend

From a PowerShell shell in the sibling backend repository:

```powershell
cd ..\technical-interview-demo

$env:SPRING_PROFILES_ACTIVE = 'local,oauth'
$env:GITHUB_CLIENT_ID = 'your-github-client-id'
$env:GITHUB_CLIENT_SECRET = 'your-github-client-secret'
$env:APP_BOOTSTRAP_INITIAL_ADMIN_IDENTITIES = 'github:your-login'

docker-compose up -d
./build.ps1 bootRun
```

For OIDC, set the `OIDC_*` variables instead of the `GITHUB_*` variables and use an
`oidc:<login>` admin identity if admin bootstrap is needed.

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

Open `http://127.0.0.1:5173`. Keep the browser on this origin for the full smoke so
the session and CSRF cookies belong to the frontend origin served by Vite.

## Manual Smoke Steps

1. Verify anonymous bootstrap.

   Open the app or request `http://127.0.0.1:5173/api/session`. Expect `HTTP 200`,
   `authenticated: false`, session-cookie metadata, CSRF metadata, and
   `loginProviders[]` when the backend has active OAuth provider credentials. The
   response should also issue or refresh the readable CSRF cookie.

2. Verify metadata-driven login.

   Start login from the UI provider choice. If the UI control is not available for the
   current task, read `loginProviders[].authorizationPath` from `GET /api/session` and
   navigate to that relative path on `http://127.0.0.1:5173`. Complete the provider
   login in the browser.

3. Verify authenticated session refresh.

   After the provider redirects back, call `GET /api/session` again through the
   frontend origin. Expect `authenticated: true`, a usable `accountPath`, a
   `logoutPath`, and current CSRF metadata.

4. Verify account access.

   Request the returned `accountPath` through the same frontend origin, for example
   `/api/account` only if that is the path returned by the session response. Expect
   `HTTP 200` with the persisted current-account profile. If this returns unauthorized
   after login, confirm the login flow started from `http://127.0.0.1:5173` and the
   provider callback is registered for that same origin.

5. Verify CSRF-backed logout.

   When a real authenticated session exists, logout is an unsafe request and must
   include the configured CSRF header. This browser-console snippet uses only
   `GET /api/session` metadata:

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

   await fetch(session.logoutPath, {
     method: 'POST',
     credentials: 'same-origin',
     headers: {
       [csrfHeaderName]: decodeURIComponent(csrfToken),
     },
   })

   await fetch('/api/session', { credentials: 'same-origin' }).then((response) =>
     response.json(),
   )
   ```

   Expect logout to return `HTTP 204`. A following `GET /api/session` should show
   `authenticated: false`, and the next `GET` to the account path should be
   unauthorized.

## CSRF Rules For Future Authenticated Writes

- Always call `GET /api/session` after login and again after logout before the next
  unsafe write.
- For authenticated `POST`, `PUT`, and `DELETE` requests, read
  `csrf.cookieName` from the browser cookie jar and mirror its value into
  `csrf.headerName`.
- Branch on stable response fields, HTTP status, `messageKey`, and endpoint context.
  Treat localized `message` values as display content only.
- Missing or invalid CSRF on unsafe authenticated `/api/**` writes should be treated as
  a failed smoke, not as a reason to relax the frontend contract.

## Automation Policy

- Anonymous browser automation may run without provider secrets. It can cover
  `GET /api/session`, public catalog reads, unauthenticated rendering, and the absence
  or presence of `loginProviders[]` based on backend profile setup.
- Authenticated browser automation is opt-in local or secret-backed CI only. It must
  not require committed provider secrets, provider access tokens, bearer tokens, or
  hard-coded provider paths.
- Authenticated automation must start login from `loginProviders[].authorizationPath`
  and must use `accountPath`, `logoutPath`, `csrf.cookieName`, and `csrf.headerName`
  from `GET /api/session`.
- Unsafe-write automation must re-bootstrap the session after login/logout and mirror
  the readable CSRF cookie into the configured request header.
- Until a canonical authenticated browser smoke command exists, this document is the
  manual source of truth for local auth verification.
