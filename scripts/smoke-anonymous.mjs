#!/usr/bin/env node

const DEFAULT_FRONTEND_URL = 'http://127.0.0.1:5173/'
const DEFAULT_TIMEOUT_MS = 8000
const SESSION_PATH = '/api/session'
const CATEGORIES_PATH = '/api/categories'
const BOOKS_PATH = '/api/books'
const CATALOG_ROUTE_PATH = '/catalog'
const LOCALIZED_FAILURE_LANGUAGE = 'pl'

const defaultBookQuery = {
  page: 0,
  size: 10,
  sort: ['title,ASC'],
}

const routeBackedBookQuery = {
  title: '__anonymous_smoke__',
  author: '__anonymous_smoke__',
  isbn: '__anonymous_smoke__',
  category: ['Java', 'Architecture'],
  page: 2,
  size: 20,
  sort: ['publicationYear,DESC', 'title,ASC'],
}

const localizedFailureQuery = {
  year: 2000,
  yearFrom: 1990,
}

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

function skip(step, detail) {
  record('skip', step, detail)
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
  const expectedDefaultBooksPath = buildBookSearchPath(defaultBookQuery)
  const expectedRouteBooksPath = buildBookSearchPath(routeBackedBookQuery)
  const expectedRoutePath = buildCatalogRoutePath(routeBackedBookQuery)
  const expectedLocalizedFailurePath = buildBookSearchPath(localizedFailureQuery)

  console.log('Anonymous browser smoke')
  console.log(`Frontend URL: ${config.frontendUrl}`)
  console.log(`Timeout: ${config.timeoutMs}ms`)
  console.log('Backend path: same-origin /api/** through the frontend origin')

  const frontendProbe = await fetchText(config, '/')
  if (frontendProbe.error) {
    skip(
      'frontend availability',
      `cannot reach ${config.origin}/; start npm run dev or point FRONTEND_SMOKE_URL at a serving frontend origin (${frontendProbe.error.message})`,
    )
    printSummary()
    return
  }

  if (!isSuccessfulFrontendStatus(frontendProbe.status)) {
    skip(
      'frontend availability',
      `${config.origin}/ returned HTTP ${frontendProbe.status}; expected a running frontend dev, preview, or container origin`,
    )
    printSummary()
    return
  }
  pass('frontend availability', `${config.origin}/ returned HTTP ${frontendProbe.status}`)

  const sessionProbe = await fetchJson(config, SESSION_PATH)
  if (isUnavailableJsonResult(sessionProbe)) {
    skip(
      'backend availability',
      `${SESSION_PATH} was unavailable through ${config.origin}; start the sibling backend and keep frontend traffic on the frontend origin`,
    )
    printSummary()
    return
  }

  assertOkJson(sessionProbe, 'session bootstrap')
  assertAnonymousSession(sessionProbe.body, 'session bootstrap')
  pass('session bootstrap', `${SESSION_PATH} returned an anonymous session contract`)

  const categoriesProbe = await fetchJson(config, CATEGORIES_PATH)
  assertOkJson(categoriesProbe, 'public categories')
  assertCategories(categoriesProbe.body, 'public categories')
  pass('public categories', `${CATEGORIES_PATH} returned ${categoriesProbe.body.length} categories`)

  const booksProbe = await fetchJson(config, expectedDefaultBooksPath)
  assertOkJson(booksProbe, 'public books')
  assertBookPage(booksProbe.body, 'public books')
  pass(
    'public books',
    `${expectedDefaultBooksPath} returned ${describeBookPage(booksProbe.body)}`,
  )

  const queriedBooksProbe = await fetchJson(config, expectedRouteBooksPath)
  assertOkJson(queriedBooksProbe, 'public books query semantics')
  assertBookPage(queriedBooksProbe.body, 'public books query semantics')
  pass(
    'public books query semantics',
    `${expectedRouteBooksPath} preserved filters, pagination, and repeated category/sort values`,
  )

  await runLocalizedFailureProbe(config, expectedLocalizedFailurePath)
  await runBrowserCatalogSmoke(config, expectedRoutePath, expectedRouteBooksPath)

  printSummary()
}

function readConfig() {
  const frontendUrl = new URL(
    process.env.FRONTEND_SMOKE_URL ?? DEFAULT_FRONTEND_URL,
  )
  const timeoutMs = Number.parseInt(
    process.env.FRONTEND_SMOKE_TIMEOUT_MS ?? String(DEFAULT_TIMEOUT_MS),
    10,
  )

  return {
    frontendUrl: frontendUrl.toString(),
    origin: frontendUrl.origin,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
  }
}

async function runLocalizedFailureProbe(config, path) {
  const response = await fetchJson(config, path, {
    acceptLanguage: LOCALIZED_FAILURE_LANGUAGE,
  })

  if (response.error) {
    fail(
      'localized public-read failure',
      `${path} could not be requested through ${config.origin}: ${response.error.message}`,
    )
  }

  if (response.status === 200) {
    skip(
      'localized public-read failure',
      `${path} was accepted by the backend, so no reproducible localized public-read failure was available`,
    )
    return
  }

  if (response.status !== 400) {
    fail(
      'localized public-read failure',
      `${path} returned HTTP ${response.status}; expected 400 problem details or a 200 skip`,
    )
  }

  assertProblem(response.body, 'localized public-read failure')
  assertCondition(
    response.body.status === undefined || response.body.status === 400,
    'localized public-read failure',
    `problem status must be 400 when present; got ${formatValue(response.body.status)}`,
  )
  assertCondition(
    typeof response.body.language === 'string' &&
      response.body.language.toLowerCase().startsWith(LOCALIZED_FAILURE_LANGUAGE),
    'localized public-read failure',
    `problem language should resolve from Accept-Language ${LOCALIZED_FAILURE_LANGUAGE}; got ${formatValue(response.body.language)}`,
  )
  pass(
    'localized public-read failure',
    `${path} returned HTTP 400 with stable messageKey ${response.body.messageKey}`,
  )
}

async function runBrowserCatalogSmoke(config, routePath, expectedBooksPath) {
  let playwright
  try {
    playwright = await import('playwright')
  } catch (error) {
    skip(
      'browser automation',
      `Playwright is not installed or cannot be imported: ${error.message}`,
    )
    return
  }

  let browser
  try {
    browser = await playwright.chromium.launch({
      headless: process.env.FRONTEND_SMOKE_HEADLESS !== 'false',
    })
  } catch (error) {
    skip(
      'browser automation',
      `Chromium is unavailable for Playwright. Run npx playwright install chromium and retry. ${error.message}`,
    )
    return
  }

  try {
    const context = await browser.newContext({
      baseURL: config.origin,
      locale: 'pl-PL',
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

    const waitForSession = waitForApiResponse(page, config, SESSION_PATH)
    const waitForCategories = waitForApiResponse(page, config, CATEGORIES_PATH)
    const waitForBooks = waitForApiResponse(page, config, expectedBooksPath)

    await page.goto(new URL(routePath, config.origin).toString(), {
      waitUntil: 'domcontentloaded',
      timeout: config.timeoutMs,
    })

    const [sessionResponse, categoriesResponse, booksResponse] =
      await Promise.all([waitForSession, waitForCategories, waitForBooks])

    await assertPlaywrightJsonResponse(sessionResponse, 200, 'browser session request')
    await assertPlaywrightJsonResponse(categoriesResponse, 200, 'browser categories request')
    const browserBooksPage = await assertPlaywrightJsonResponse(
      booksResponse,
      200,
      'browser books request',
    )
    assertBookPage(browserBooksPage, 'browser books request')

    await page.getByRole('heading', { name: 'Books' }).waitFor({
      timeout: config.timeoutMs,
    })
    await page.getByRole('heading', { name: 'Session' }).waitFor({
      timeout: config.timeoutMs,
    })

    assertCondition(
      offOriginApiRequests.length === 0,
      'browser same-origin API',
      `all browser API requests must stay on ${config.origin}; saw ${offOriginApiRequests.join(', ')}`,
    )
    assertCondition(
      sameOriginApiRequests.includes(SESSION_PATH),
      'browser same-origin API',
      `${SESSION_PATH} was not observed from the browser`,
    )
    assertCondition(
      sameOriginApiRequests.includes(CATEGORIES_PATH),
      'browser same-origin API',
      `${CATEGORIES_PATH} was not observed from the browser`,
    )
    assertCondition(
      sameOriginApiRequests.includes(expectedBooksPath),
      'browser same-origin API',
      `${expectedBooksPath} was not observed from the browser`,
    )

    assertCatalogRouteUrl(page.url(), routePath, 'browser catalog route')
    pass(
      'browser catalog route',
      `${routePath} bootstrapped session, categories, and books through same-origin /api/**`,
    )

    await context.close()
  } finally {
    await browser.close()
  }
}

function waitForApiResponse(page, config, path) {
  return page.waitForResponse(
    (response) => sameOriginApiPath(response.url(), config.origin) === path,
    {
      timeout: config.timeoutMs,
    },
  )
}

async function assertPlaywrightJsonResponse(response, expectedStatus, step) {
  const status = response.status()
  assertCondition(
    status === expectedStatus,
    step,
    `${response.url()} returned HTTP ${status}; expected ${expectedStatus}`,
  )

  try {
    return await response.json()
  } catch (error) {
    fail(step, `${response.url()} did not return JSON: ${error.message}`)
  }
}

function assertCatalogRouteUrl(currentUrl, expectedPath, step) {
  const current = new URL(currentUrl)
  const expected = new URL(expectedPath, current.origin)

  assertCondition(
    current.pathname === expected.pathname,
    step,
    `expected browser path ${expected.pathname}; got ${current.pathname}`,
  )
  assertArrayEquals(
    current.searchParams.getAll('category'),
    expected.searchParams.getAll('category'),
    step,
    'category query values',
  )
  assertArrayEquals(
    current.searchParams.getAll('sort'),
    expected.searchParams.getAll('sort'),
    step,
    'sort query values',
  )

  for (const name of ['title', 'author', 'isbn', 'page', 'size']) {
    assertCondition(
      current.searchParams.get(name) === expected.searchParams.get(name),
      step,
      `expected ${name}=${expected.searchParams.get(name)}; got ${current.searchParams.get(name)}`,
    )
  }
}

async function fetchText(config, path) {
  const url = new URL(path, config.origin)
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'manual',
      timeoutMs: config.timeoutMs,
    })

    return {
      status: response.status,
      statusText: response.statusText,
      text: await response.text(),
    }
  } catch (error) {
    return { error }
  }
}

async function fetchJson(config, path, options = {}) {
  const url = new URL(path, config.origin)
  const headers = {
    Accept: 'application/json',
  }

  if (options.acceptLanguage) {
    headers['Accept-Language'] = options.acceptLanguage
  }

  try {
    const response = await fetchWithTimeout(url, {
      credentials: 'same-origin',
      headers,
      timeoutMs: config.timeoutMs,
    })
    const contentType = response.headers.get('Content-Type') ?? ''
    const text = await response.text()
    const body = parseJsonText(text)

    return {
      body,
      contentType,
      status: response.status,
      statusText: response.statusText,
      url: url.toString(),
    }
  } catch (error) {
    return { error, url: url.toString() }
  }
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

function assertOkJson(result, step) {
  if (result.error) {
    fail(step, `${result.url} could not be requested: ${result.error.message}`)
  }

  if (result.status !== 200) {
    fail(step, `${result.url} returned HTTP ${result.status}; expected 200`)
  }

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
    `anonymous smoke expected authenticated=false; got ${formatValue(session.authenticated)}`,
  )

  if (session.accountPath !== undefined) {
    assertRelativeApiPath(session.accountPath, step, 'accountPath')
  }
  if (session.logoutPath !== undefined) {
    assertRelativeApiPath(session.logoutPath, step, 'logoutPath')
  }

  if (session.loginProviders !== undefined) {
    assertCondition(
      Array.isArray(session.loginProviders),
      step,
      'loginProviders must be an array when present',
    )

    for (const provider of session.loginProviders) {
      assertPlainObject(provider, step, 'login provider')
      if (provider.authorizationPath !== undefined) {
        assertRelativeApiPath(provider.authorizationPath, step, 'provider authorizationPath')
      }
    }
  }

  assertPlainObject(session.sessionCookie, step, 'sessionCookie')
  assertCondition(
    typeof session.sessionCookie.name === 'string' && session.sessionCookie.name.length > 0,
    step,
    'sessionCookie.name must be present',
  )
  assertPlainObject(session.csrf, step, 'csrf')
  if (session.csrf.enabled === true) {
    assertCondition(
      typeof session.csrf.cookieName === 'string' && session.csrf.cookieName.length > 0,
      step,
      'csrf.cookieName must be present when CSRF is enabled',
    )
    assertCondition(
      typeof session.csrf.headerName === 'string' && session.csrf.headerName.length > 0,
      step,
      'csrf.headerName must be present when CSRF is enabled',
    )
  }
}

function assertCategories(categories, step) {
  assertCondition(Array.isArray(categories), step, 'categories response must be an array')

  for (const category of categories) {
    assertPlainObject(category, step, 'category')
    if (category.id !== undefined) {
      assertCondition(Number.isFinite(category.id), step, 'category.id must be numeric')
    }
    if (category.name !== undefined) {
      assertCondition(typeof category.name === 'string', step, 'category.name must be a string')
    }
  }
}

function assertBookPage(page, step) {
  assertPlainObject(page, step, 'book page')
  assertCondition(Array.isArray(page.content), step, 'book page content must be an array')

  for (const book of page.content) {
    assertPlainObject(book, step, 'book')
    if (book.categories !== undefined) {
      assertCondition(Array.isArray(book.categories), step, 'book.categories must be an array')
    }
  }

  for (const name of ['number', 'size', 'totalElements', 'totalPages']) {
    if (page[name] !== undefined) {
      assertCondition(Number.isFinite(page[name]), step, `book page ${name} must be numeric`)
    }
  }
}

function assertProblem(problem, step) {
  assertPlainObject(problem, step, 'problem response')
  assertCondition(
    typeof problem.messageKey === 'string' && problem.messageKey.length > 0,
    step,
    'problem response must include messageKey',
  )
  assertCondition(
    typeof problem.message === 'string' && problem.message.length > 0,
    step,
    'problem response must include localized message display content',
  )
  assertCondition(
    typeof problem.language === 'string' && problem.language.length > 0,
    step,
    'problem response must include resolved language',
  )
}

function assertPlainObject(value, step, label) {
  assertCondition(
    value !== null && typeof value === 'object' && !Array.isArray(value),
    step,
    `${label} must be an object`,
  )
}

function assertRelativeApiPath(path, step, label) {
  assertCondition(typeof path === 'string', step, `${label} must be a string`)
  assertCondition(path.startsWith('/api/'), step, `${label} must stay under /api/**; got ${path}`)
  assertCondition(
    !path.startsWith('//') && !/^https?:\/\//i.test(path),
    step,
    `${label} must be a relative path; got ${path}`,
  )
}

function assertArrayEquals(actual, expected, step, label) {
  assertCondition(
    actual.length === expected.length && actual.every((value, index) => value === expected[index]),
    step,
    `${label} expected ${expected.join(', ')}; got ${actual.join(', ')}`,
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

function buildCatalogRoutePath(params) {
  const query = buildBookSearchQuery(params)

  return query ? `${CATALOG_ROUTE_PATH}?${query}` : CATALOG_ROUTE_PATH
}

function buildBookSearchPath(params) {
  const query = buildBookSearchQuery(params)

  return query ? `${BOOKS_PATH}?${query}` : BOOKS_PATH
}

function buildBookSearchQuery(params) {
  const search = new URLSearchParams()

  appendString(search, 'title', params.title)
  appendString(search, 'author', params.author)
  appendString(search, 'isbn', params.isbn)
  appendNumber(search, 'year', params.year)
  appendNumber(search, 'yearFrom', params.yearFrom)
  appendNumber(search, 'yearTo', params.yearTo)
  appendStringList(search, 'category', params.category)
  appendNumber(search, 'page', params.page)
  appendNumber(search, 'size', params.size)
  appendStringList(search, 'sort', params.sort)

  return search.toString()
}

function appendString(search, name, value) {
  const trimmed = typeof value === 'string' ? value.trim() : ''

  if (trimmed) {
    search.set(name, trimmed)
  }
}

function appendStringList(search, name, values) {
  for (const value of values ?? []) {
    const trimmed = typeof value === 'string' ? value.trim() : ''

    if (trimmed) {
      search.append(name, trimmed)
    }
  }
}

function appendNumber(search, name, value) {
  if (value !== undefined && Number.isFinite(value)) {
    search.set(name, String(value))
  }
}

function parseJsonText(text) {
  if (!text) {
    return undefined
  }

  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function isUnavailableJsonResult(result) {
  if (result.error) {
    return true
  }

  if (result.status === 502 || result.status === 503 || result.status === 504) {
    return true
  }

  return result.status >= 500 && !result.contentType.includes('json')
}

function isSuccessfulFrontendStatus(status) {
  return status >= 200 && status < 400
}

function describeBookPage(page) {
  return `${page.content.length} visible rows, page ${formatValue(page.number)}, size ${formatValue(page.size)}`
}

function formatValue(value) {
  return value === undefined ? 'undefined' : JSON.stringify(value)
}

function printSummary() {
  const counts = {
    pass: results.filter((result) => result.status === 'pass').length,
    fail: results.filter((result) => result.status === 'fail').length,
    skip: results.filter((result) => result.status === 'skip').length,
  }
  const overall =
    counts.fail > 0 ? 'FAILED' : counts.pass > 0 && counts.skip === 0 ? 'PASSED' : 'SKIPPED'

  console.log('')
  console.log(
    `Anonymous smoke summary: ${overall} (${counts.pass} passed, ${counts.skip} skipped, ${counts.fail} failed)`,
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
