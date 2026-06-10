#!/usr/bin/env node

import { withViteServer } from './with-vite.mjs'

const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = 5173
const DEFAULT_TIMEOUT_MS = 10000
const BACKEND_PROFILE = 'internal contract-backed mock API'
const SELECTED_FLOW =
  'mock browser accessibility scan for anonymous catalog/home, authenticated account, and authenticated admin users routes'
const FAILING_IMPACTS = new Set(['critical', 'serious'])
const ADVISORY_IMPACTS = new Set(['moderate', 'minor'])
const SESSION_PATH = '/api/session'
const ACCOUNT_ROUTE_PATH = '/account'
const ADMIN_USERS_ROUTE_PATH = '/admin/users'

const results = []

class A11yFailure extends Error {
  constructor(step, message) {
    super(message)
    this.name = 'A11yFailure'
    this.step = step
  }
}

class A11yPrerequisiteUnavailable extends Error {
  constructor(step, message) {
    super(message)
    this.name = 'A11yPrerequisiteUnavailable'
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
  throw new A11yFailure(step, detail)
}

function advisory(step, detail) {
  record('advisory', step, detail)
}

function skipPrerequisite(step, detail) {
  record('skip', step, `prerequisite unavailable: ${detail}`)
  throw new A11yPrerequisiteUnavailable(step, detail)
}

function assertCondition(condition, step, detail) {
  if (!condition) {
    fail(step, detail)
  }
}

async function main() {
  const config = readConfig()

  console.log('Accessibility automation')
  console.log(`Validation date: ${config.validationDate}`)
  console.log(`Backend profile: ${BACKEND_PROFILE}`)
  console.log(`Selected flow: ${SELECTED_FLOW}`)
  console.log(
    `Route coverage: anonymous catalog/home, authenticated ${ACCOUNT_ROUTE_PATH}, and authenticated ${ADMIN_USERS_ROUTE_PATH}`,
  )
  console.log(
    'Result semantics: serious or critical axe violations fail; moderate and minor violations are advisory; prerequisite skips exit nonzero',
  )
  console.log(`Timeout: ${config.timeoutMs}ms`)

  await runWithMockServer(config)

  printSummary()
}

function readConfig() {
  const port = Number.parseInt(
    process.env.FRONTEND_A11Y_PORT ?? String(DEFAULT_PORT),
    10,
  )
  const timeoutMs = Number.parseInt(
    process.env.FRONTEND_A11Y_TIMEOUT_MS ?? String(DEFAULT_TIMEOUT_MS),
    10,
  )

  return {
    headless: process.env.FRONTEND_A11Y_HEADLESS !== 'false',
    host: process.env.FRONTEND_A11Y_HOST ?? DEFAULT_HOST,
    port: Number.isFinite(port) && port > 0 ? port : DEFAULT_PORT,
    strictPort: process.env.FRONTEND_A11Y_STRICT_PORT === 'true',
    timeoutMs:
      Number.isFinite(timeoutMs) && timeoutMs > 0
        ? timeoutMs
        : DEFAULT_TIMEOUT_MS,
    validationDate: new Date().toISOString(),
  }
}

async function runWithMockServer(config) {
  process.env.FRONTEND_MOCK_SESSION = 'anonymous'
  process.env.FRONTEND_MOCK_API_SCENARIO = 'success'
  delete process.env.FRONTEND_MOCK_API_DELAY_MS

  try {
    await withViteServer(
      {
        host: config.host,
        mode: 'mock',
        port: config.port,
        strictPort: config.strictPort,
      },
      async (mockServer) => {
        pass('mock frontend server', `${mockServer.origin}/ is serving Vite mock mode`)
        console.log(`Frontend URL: ${mockServer.origin}/`)
        await runBrowserA11y({ ...config, origin: mockServer.origin })
      },
    )
  } catch (error) {
    if (
      error instanceof A11yFailure ||
      error instanceof A11yPrerequisiteUnavailable
    ) {
      throw error
    }

    skipPrerequisite(
      'mock frontend server',
      `could not start or stop Vite mock server: ${error.message}`,
    )
  }
}

async function runBrowserA11y(config) {
  const playwright = await importPlaywright()
  const AxeBuilder = await importAxeBuilder()
  let browser

  try {
    browser = await playwright.chromium.launch({
      headless: config.headless,
    })
  } catch (error) {
    skipPrerequisite(
      'browser automation',
      `Chromium is unavailable for Playwright. Run npx playwright install chromium and retry. ${error.message}`,
    )
  }

  try {
    const context = await browser.newContext({
      baseURL: config.origin,
      colorScheme: 'light',
    })
    const page = await context.newPage()

    await scanAnonymousCatalog(page, AxeBuilder, config)
    await signInAsMockAdmin(page, config)
    await scanAuthenticatedRoute(
      page,
      AxeBuilder,
      config,
      ACCOUNT_ROUTE_PATH,
      [{ role: 'heading', name: 'Language preference' }],
      'authenticated account route',
    )
    await scanAuthenticatedRoute(
      page,
      AxeBuilder,
      config,
      ADMIN_USERS_ROUTE_PATH,
      [
        { role: 'heading', name: 'Application users' },
        { role: 'table', name: 'Admin users' },
      ],
      'authenticated admin users route',
    )

    await context.close()
  } finally {
    await browser.close()
  }
}

async function importPlaywright() {
  try {
    return await import('playwright')
  } catch (error) {
    skipPrerequisite(
      'browser automation',
      `Playwright is not installed or cannot be imported: ${error.message}`,
    )
  }
}

async function importAxeBuilder() {
  try {
    const module = await import('@axe-core/playwright')

    return module.default
  } catch (error) {
    skipPrerequisite(
      'accessibility engine',
      `@axe-core/playwright is not installed or cannot be imported: ${error.message}`,
    )
  }
}

async function scanAnonymousCatalog(page, AxeBuilder, config) {
  await page.goto(new URL('/', config.origin).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: config.timeoutMs,
  })
  await page.getByRole('heading', { name: 'Book catalog' }).waitFor({
    timeout: config.timeoutMs,
  })
  await page.getByRole('button', { name: 'Sign in' }).waitFor({
    timeout: config.timeoutMs,
  })

  await scanPage(page, AxeBuilder, 'anonymous catalog/home state')
}

async function signInAsMockAdmin(page, config) {
  await page.getByRole('button', { name: 'Sign in' }).click()

  const session = await fetchJsonFromPage(page, SESSION_PATH)
  assertCondition(
    session.status === 200,
    'mock admin sign-in',
    `${SESSION_PATH} returned HTTP ${session.status}; expected 200`,
  )
  const provider = session.body?.loginProviders?.find(
    (item) => typeof item.authorizationPath === 'string',
  )
  assertCondition(
    provider !== undefined,
    'mock admin sign-in',
    'anonymous mock session did not expose a login provider',
  )

  const linkName = `Sign in with ${provider.clientName ?? provider.registrationId}`
  await page.getByRole('link', { name: linkName }).click()
  await page.waitForLoadState('domcontentloaded', {
    timeout: config.timeoutMs,
  })
  // The trigger's accessible name is the signed-in user's display name, so
  // target the stable element id instead of a fixed label.
  await page.locator('#account-menu-trigger').waitFor({
    timeout: config.timeoutMs,
  })

  pass(
    'mock admin sign-in',
    `authenticated through discovered ${provider.authorizationPath}`,
  )
}

async function scanAuthenticatedRoute(
  page,
  AxeBuilder,
  config,
  path,
  readyContent,
  label,
) {
  await page.goto(new URL(path, config.origin).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: config.timeoutMs,
  })

  // The shell h1 renders before the auth gate resolves, so wait for elements
  // that only mount with the loaded page content before running axe.
  for (const { name, role } of readyContent) {
    await page.getByRole(role, { name }).waitFor({
      timeout: config.timeoutMs,
    })
  }

  await scanPage(page, AxeBuilder, label)
}

async function scanPage(page, AxeBuilder, label) {
  const url = new URL(page.url())
  const axeResults = await new AxeBuilder({ page }).analyze()
  const failing = axeResults.violations.filter((violation) =>
    FAILING_IMPACTS.has(violation.impact),
  )
  const advisoryFindings = axeResults.violations.filter(
    (violation) =>
      ADVISORY_IMPACTS.has(violation.impact) ||
      violation.impact === null ||
      violation.impact === undefined,
  )

  if (advisoryFindings.length > 0) {
    advisory(
      label,
      `${advisoryFindings.length} moderate/minor automated finding(s) on ${url.pathname}`,
    )
    printViolations(advisoryFindings, 'advisory')
  }

  if (failing.length > 0) {
    printViolations(failing, 'fail')
    fail(
      label,
      `${failing.length} serious/critical automated accessibility violation(s) on ${url.pathname}`,
    )
  }

  pass(
    label,
    `0 serious/critical automated accessibility violations on ${url.pathname}; ${advisoryFindings.length} advisory finding(s)`,
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
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    }
  }, requestPath)
}

function printViolations(violations, status) {
  for (const violation of violations) {
    const impact = violation.impact ?? 'unknown'
    const targetSummary = violation.nodes
      .slice(0, 3)
      .map((node) => node.target.join(' '))
      .join('; ')
    const extraNodes =
      violation.nodes.length > 3 ? `; +${violation.nodes.length - 3} more` : ''

    console.log(
      `[${status}] ${impact} ${violation.id}: ${violation.help} (${targetSummary}${extraNodes})`,
    )
  }
}

function printSummary() {
  const counts = {
    advisory: results.filter((result) => result.status === 'advisory').length,
    fail: results.filter((result) => result.status === 'fail').length,
    pass: results.filter((result) => result.status === 'pass').length,
    skip: results.filter((result) => result.status === 'skip').length,
  }
  const overall =
    counts.fail > 0
      ? 'FAILED'
      : counts.skip > 0
        ? 'PREREQUISITE SKIPPED'
        : 'PASSED'
  const skipped = results.filter((result) => result.status === 'skip')

  console.log('')
  console.log(
    `Accessibility summary: ${overall} (${counts.pass} passed, ${counts.advisory} advisory, ${counts.skip} skipped, ${counts.fail} failed)`,
  )

  if (skipped.length > 0) {
    console.log('Skipped accessibility steps:')
    for (const result of skipped) {
      console.log(`- ${result.step}: ${result.detail}`)
    }
  } else {
    console.log('Skipped accessibility steps: none')
  }
}

try {
  await main()
} catch (error) {
  if (
    !(error instanceof A11yFailure) &&
    !(error instanceof A11yPrerequisiteUnavailable)
  ) {
    record('fail', 'unexpected error', error.stack ?? error.message ?? String(error))
  }

  printSummary()
  process.exitCode = 1
}
