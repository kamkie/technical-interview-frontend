#!/usr/bin/env node

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = 5173
const DEFAULT_TIMEOUT_MS = 10000
const SESSION_PATH = '/api/session'
const ACCOUNT_ROUTE_PATH = '/account'
const ADMIN_USERS_PATH = '/api/admin/users'
const ADMIN_USERS_ROUTE_PATH = '/admin/users'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const results = []

class SmokeFailure extends Error {
  constructor(step, message) {
    super(message)
    this.name = 'SmokeFailure'
    this.step = step
  }
}

function record(status, step, detail) {
  results.push({ status, step, detail })
  console.log(`[${status}] ${step}: ${detail}`)
}

function pass(step, detail) {
  record('pass', step, detail)
}

function fail(step, detail) {
  record('fail', step, detail)
  throw new SmokeFailure(step, detail)
}

function assertCondition(condition, step, detail) {
  if (!condition) {
    fail(step, detail)
  }
}

async function main() {
  const config = readConfig()

  console.log('Authenticated mock browser smoke')
  console.log('Backend profile: internal contract-backed mock API')
  console.log(`Timeout: ${config.timeoutMs}ms`)

  const mockServer = await startMockServer(config)

  try {
    await runBrowserSmoke({ ...config, origin: mockServer.origin })
  } finally {
    await mockServer.close()
  }

  printSummary()
}

function readConfig() {
  const port = Number.parseInt(
    process.env.FRONTEND_AUTH_SMOKE_PORT ?? String(DEFAULT_PORT),
    10,
  )
  const timeoutMs = Number.parseInt(
    process.env.FRONTEND_SMOKE_TIMEOUT_MS ?? String(DEFAULT_TIMEOUT_MS),
    10,
  )

  return {
    host: process.env.FRONTEND_AUTH_SMOKE_HOST ?? DEFAULT_HOST,
    port: Number.isFinite(port) && port > 0 ? port : DEFAULT_PORT,
    strictPort: process.env.FRONTEND_AUTH_SMOKE_STRICT_PORT === 'true',
    timeoutMs:
      Number.isFinite(timeoutMs) && timeoutMs > 0
        ? timeoutMs
        : DEFAULT_TIMEOUT_MS,
  }
}

async function startMockServer(config) {
  process.env.FRONTEND_MOCK_SESSION = 'anonymous'
  process.env.FRONTEND_MOCK_API_SCENARIO = 'success'
  delete process.env.FRONTEND_MOCK_API_DELAY_MS

  const viteServer = await createServer({
    configFile: path.join(repoRoot, 'vite.config.ts'),
    logLevel: 'error',
    mode: 'mock',
    server: {
      host: config.host,
      port: config.port,
      strictPort: config.strictPort,
    },
  })

  try {
    await viteServer.listen()
  } catch (error) {
    await viteServer.close()
    fail(
      'mock frontend server',
      `could not start Vite mock server: ${error.message}`,
    )
  }

  const address = viteServer.httpServer?.address()
  const port =
    typeof address === 'object' && address !== null ? address.port : config.port
  const origin = `http://${config.host}:${port}`

  pass('mock frontend server', `${origin}/ is serving Vite mock mode`)

  return {
    close: () => viteServer.close(),
    origin,
  }
}

async function runBrowserSmoke(config) {
  let playwright

  try {
    playwright = await import('playwright')
  } catch (error) {
    fail(
      'browser automation',
      `Playwright is not installed or cannot be imported: ${error.message}`,
    )
  }

  let browser

  try {
    browser = await playwright.chromium.launch({
      headless: process.env.FRONTEND_SMOKE_HEADLESS !== 'false',
    })
  } catch (error) {
    fail(
      'browser automation',
      `Chromium is unavailable for Playwright. Run npx playwright install chromium and retry. ${error.message}`,
    )
  }

  try {
    const context = await browser.newContext({
      baseURL: config.origin,
    })
    const page = await context.newPage()
    const sameOriginApiRequests = []
    const offOriginApiRequests = []

    page.on('request', (request) => {
      const requestUrl = request.url()

      if (!requestUrl.includes('/api/')) {
        return
      }

      const apiPath = sameOriginApiPath(requestUrl, config.origin)

      if (apiPath) {
        sameOriginApiRequests.push(apiPath)
      } else {
        offOriginApiRequests.push(requestUrl)
      }
    })

    await page.goto(new URL('/catalog', config.origin).toString(), {
      waitUntil: 'domcontentloaded',
      timeout: config.timeoutMs,
    })
    await page.getByRole('button', { name: 'Sign in' }).waitFor({
      timeout: config.timeoutMs,
    })

    const anonymousSession = await fetchJsonFromPage(page, SESSION_PATH)
    assertOkJson(anonymousSession, 'anonymous session')
    assertAnonymousSession(anonymousSession.body, 'anonymous session')
    const loginProvider = findLoginProvider(anonymousSession.body, 'anonymous session')

    pass(
      'anonymous session',
      `${SESSION_PATH} returned metadata for ${loginProvider.registrationId}`,
    )

    await runMetadataDrivenLogin(page, config, loginProvider)

    const authenticatedSession = await fetchJsonFromPage(page, SESSION_PATH)
    assertOkJson(authenticatedSession, 'authenticated session')
    assertAuthenticatedSession(
      authenticatedSession.body,
      'authenticated session',
    )
    pass(
      'authenticated session',
      `${SESSION_PATH} returned account, logout, and CSRF metadata`,
    )

    const account = await verifyAccountAccess(
      page,
      config,
      authenticatedSession.body,
    )
    await verifyAdminAccess(page, config, account)
    await verifyCsrfLogout(page, context, config, authenticatedSession.body)

    assertSameOriginApiRequests(
      sameOriginApiRequests,
      offOriginApiRequests,
      config.origin,
      [
        SESSION_PATH,
        loginProvider.authorizationPath,
        authenticatedSession.body.accountPath,
        ADMIN_USERS_PATH,
        authenticatedSession.body.logoutPath,
      ],
    )

    await context.close()
  } finally {
    await browser.close()
  }
}

async function runMetadataDrivenLogin(page, config, provider) {
  await page.getByRole('button', { name: 'Sign in' }).click()

  const linkName = `Sign in with ${provider.clientName ?? provider.registrationId}`
  const loginLink = page.getByRole('link', { name: linkName })
  const href = await loginLink.getAttribute('href')

  assertCondition(
    href === provider.authorizationPath,
    'metadata-driven login',
    `login link must use discovered authorizationPath ${provider.authorizationPath}; got ${formatValue(href)}`,
  )

  const loginResponsePromise = waitForApiResponse(
    page,
    config,
    provider.authorizationPath,
  )

  await loginLink.click()

  const loginResponse = await loginResponsePromise
  assertCondition(
    loginResponse.status() === 302,
    'metadata-driven login',
    `${provider.authorizationPath} returned HTTP ${loginResponse.status()}; expected 302`,
  )

  await page.waitForLoadState('domcontentloaded', {
    timeout: config.timeoutMs,
  })
  await page.getByRole('button', { name: 'Account' }).waitFor({
    timeout: config.timeoutMs,
  })

  pass(
    'metadata-driven login',
    `browser login started from discovered ${provider.authorizationPath}`,
  )
}

async function verifyAccountAccess(page, config, session) {
  const accountResponse = await fetchJsonFromPage(page, session.accountPath)

  assertOkJson(accountResponse, 'account access')
  const account = accountResponse.body

  assertPlainObject(account, 'account access', 'account response')
  assertCondition(
    account.login === 'admin-user',
    'account access',
    `expected mock admin login admin-user; got ${formatValue(account.login)}`,
  )
  assertCondition(
    Array.isArray(account.roles) && account.roles.includes('ADMIN'),
    'account access',
    `expected ADMIN role; got ${formatValue(account.roles)}`,
  )

  await page.goto(new URL(ACCOUNT_ROUTE_PATH, config.origin).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: config.timeoutMs,
  })
  await page.getByRole('heading', { name: 'Account' }).waitFor({
    timeout: config.timeoutMs,
  })
  await page.getByText('admin-user').waitFor({
    timeout: config.timeoutMs,
  })

  pass(
    'account access',
    `${session.accountPath} returned ${account.login} and the account route rendered it`,
  )

  return account
}

async function verifyAdminAccess(page, config, account) {
  const usersResponse = await fetchJsonFromPage(page, ADMIN_USERS_PATH)

  assertOkJson(usersResponse, 'admin access')
  assertCondition(
    Array.isArray(usersResponse.body),
    'admin access',
    `${ADMIN_USERS_PATH} must return an array`,
  )
  assertCondition(
    usersResponse.body.some((user) => user.login === account.login),
    'admin access',
    `${ADMIN_USERS_PATH} did not include ${account.login}`,
  )

  await page.goto(new URL(ADMIN_USERS_ROUTE_PATH, config.origin).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: config.timeoutMs,
  })
  await page.getByRole('heading', { name: 'User management' }).waitFor({
    timeout: config.timeoutMs,
  })
  await page.getByRole('button', { name: 'View Mock Admin' }).waitFor({
    timeout: config.timeoutMs,
  })

  pass(
    'admin access',
    `${ADMIN_USERS_PATH} returned admin users and the admin route rendered`,
  )
}

async function verifyCsrfLogout(page, context, config, session) {
  const csrf = session.csrf
  const csrfCookie = await findContextCookie(context, config.origin, csrf.cookieName)

  assertCondition(
    csrfCookie !== undefined,
    'csrf-backed logout',
    `browser cookie jar must include ${csrf.cookieName}`,
  )

  const accountButton = page.getByRole('button', { name: 'Account' })

  if ((await accountButton.getAttribute('aria-expanded')) !== 'true') {
    await accountButton.click()
  }

  const logoutResponsePromise = page.waitForResponse(
    (response) =>
      sameOriginApiPath(response.url(), config.origin) === session.logoutPath &&
      response.request().method() === 'POST',
    {
      timeout: config.timeoutMs,
    },
  )

  await page.getByRole('button', { name: 'Sign out' }).click()

  const logoutResponse = await logoutResponsePromise
  const logoutRequestHeaders = await logoutResponse.request().allHeaders()
  const csrfHeaderValue = logoutRequestHeaders[csrf.headerName.toLowerCase()]

  assertCondition(
    csrfHeaderValue === csrfCookie.value,
    'csrf-backed logout',
    `logout must mirror ${csrf.cookieName} into ${csrf.headerName}`,
  )
  assertCondition(
    logoutResponse.status() === 204,
    'csrf-backed logout',
    `${session.logoutPath} returned HTTP ${logoutResponse.status()}; expected 204`,
  )

  await page.getByRole('button', { name: 'Sign in' }).waitFor({
    timeout: config.timeoutMs,
  })

  const loggedOutSession = await fetchJsonFromPage(page, SESSION_PATH)
  assertOkJson(loggedOutSession, 'post-logout session')
  assertAnonymousSession(loggedOutSession.body, 'post-logout session')

  const accountAfterLogout = await fetchJsonFromPage(page, session.accountPath)
  assertCondition(
    accountAfterLogout.status === 401,
    'post-logout account guard',
    `${session.accountPath} returned HTTP ${accountAfterLogout.status}; expected 401`,
  )

  pass(
    'csrf-backed logout',
    `${session.logoutPath} returned 204 and the browser returned to anonymous session state`,
  )
}

function waitForApiResponse(page, config, path) {
  return page.waitForResponse(
    (response) => sameOriginApiPath(response.url(), config.origin) === path,
    {
      timeout: config.timeoutMs,
    },
  )
}

async function fetchJsonFromPage(page, requestPath) {
  return await page.evaluate(async (pathToFetch) => {
    const response = await fetch(pathToFetch, {
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
    const text = await response.text()
    let body

    try {
      body = text ? JSON.parse(text) : undefined
    } catch {
      body = undefined
    }

    return {
      body,
      contentType: response.headers.get('Content-Type') ?? '',
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    }
  }, requestPath)
}

async function findContextCookie(context, origin, name) {
  const cookies = await context.cookies(origin)

  return cookies.find((cookie) => cookie.name === name)
}

function assertOkJson(result, step) {
  assertCondition(
    result.status === 200,
    step,
    `${result.url} returned HTTP ${result.status}; expected 200`,
  )
  assertCondition(
    result.body !== undefined,
    step,
    `${result.url} did not return a JSON body`,
  )
}

function assertAnonymousSession(session, step) {
  assertPlainObject(session, step, 'session response')
  assertCondition(
    session.authenticated === false,
    step,
    `expected authenticated=false; got ${formatValue(session.authenticated)}`,
  )
  assertSessionMetadata(session, step)
}

function assertAuthenticatedSession(session, step) {
  assertPlainObject(session, step, 'session response')
  assertCondition(
    session.authenticated === true,
    step,
    `expected authenticated=true; got ${formatValue(session.authenticated)}`,
  )
  assertRelativeApiPath(session.accountPath, step, 'accountPath')
  assertRelativeApiPath(session.logoutPath, step, 'logoutPath')
  assertSessionMetadata(session, step)
  assertCondition(
    session.csrf?.enabled === true,
    step,
    'CSRF must be enabled for authenticated smoke',
  )
  assertCondition(
    typeof session.csrf.cookieName === 'string' &&
      session.csrf.cookieName.length > 0,
    step,
    'csrf.cookieName must be present',
  )
  assertCondition(
    typeof session.csrf.headerName === 'string' &&
      session.csrf.headerName.length > 0,
    step,
    'csrf.headerName must be present',
  )
}

function assertSessionMetadata(session, step) {
  assertPlainObject(session.sessionCookie, step, 'sessionCookie')
  assertCondition(
    typeof session.sessionCookie.name === 'string' &&
      session.sessionCookie.name.length > 0,
    step,
    'sessionCookie.name must be present',
  )
  assertPlainObject(session.csrf, step, 'csrf')

  if (session.logoutPath !== undefined) {
    assertRelativeApiPath(session.logoutPath, step, 'logoutPath')
  }
}

function findLoginProvider(session, step) {
  assertCondition(
    Array.isArray(session.loginProviders),
    step,
    'loginProviders must be an array before login',
  )

  const provider = session.loginProviders.find(
    (item) => typeof item.authorizationPath === 'string',
  )

  assertCondition(
    provider !== undefined,
    step,
    'expected a login provider with authorizationPath',
  )
  assertRelativeApiPath(provider.authorizationPath, step, 'provider authorizationPath')

  return provider
}

function assertPlainObject(value, step, label) {
  assertCondition(
    value !== null && typeof value === 'object' && !Array.isArray(value),
    step,
    `${label} must be an object`,
  )
}

function assertRelativeApiPath(value, step, label) {
  assertCondition(typeof value === 'string', step, `${label} must be a string`)
  assertCondition(
    value.startsWith('/api/'),
    step,
    `${label} must stay under /api/**; got ${value}`,
  )
  assertCondition(
    !value.startsWith('//') && !/^https?:\/\//i.test(value),
    step,
    `${label} must be a relative path; got ${value}`,
  )
}

function assertSameOriginApiRequests(
  sameOriginApiRequests,
  offOriginApiRequests,
  origin,
  expectedPaths,
) {
  assertCondition(
    offOriginApiRequests.length === 0,
    'browser same-origin API',
    `all browser API requests must stay on ${origin}; saw ${offOriginApiRequests.join(', ')}`,
  )

  for (const path of expectedPaths) {
    assertCondition(
      sameOriginApiRequests.includes(path),
      'browser same-origin API',
      `${path} was not observed from the browser`,
    )
  }

  pass(
    'browser same-origin API',
    `observed ${sameOriginApiRequests.length} same-origin /api/** browser requests`,
  )
}

function sameOriginApiPath(url, origin) {
  try {
    const parsed = new URL(url)

    if (parsed.origin !== origin || !parsed.pathname.startsWith('/api/')) {
      return undefined
    }

    return `${parsed.pathname}${parsed.search}`
  } catch {
    return undefined
  }
}

function formatValue(value) {
  return value === undefined ? 'undefined' : JSON.stringify(value)
}

function printSummary() {
  const counts = {
    fail: results.filter((result) => result.status === 'fail').length,
    pass: results.filter((result) => result.status === 'pass').length,
  }
  const overall = counts.fail > 0 ? 'FAILED' : 'PASSED'

  console.log('')
  console.log(
    `Authenticated mock smoke summary: ${overall} (${counts.pass} passed, ${counts.fail} failed)`,
  )
}

try {
  await main()
} catch (error) {
  if (!(error instanceof SmokeFailure)) {
    record('fail', 'unexpected error', error.stack ?? error.message ?? String(error))
  }

  printSummary()
  process.exitCode = 1
}
