import { describe, expect, it } from 'vitest'
import approvedOpenApi from '../../docs/backend/approved-openapi.json'
import type { components } from '../api/generated/openapi'
import {
  MOCK_LOGIN_PATH,
  MOCK_OPENAPI_PATHS,
  createMockApiHandler,
} from './handler'

type ApiProblem = components['schemas']['ApiProblemResponse']
type Book = components['schemas']['Book']
type BookPage = components['schemas']['PageBook']
type Session = components['schemas']['SessionResponse']

const CSRF_COOKIE = 'XSRF-TOKEN=mock-csrf-token'
const SESSION_COOKIE = 'technical-interview-demo-session=mock-admin'
const CSRF_HEADERS = {
  Cookie: `${SESSION_COOKIE}; ${CSRF_COOKIE}`,
  'X-XSRF-TOKEN': 'mock-csrf-token',
}

describe('mock API handler', () => {
  it('tracks every OpenAPI-covered path in the imported backend contract', () => {
    expect([...MOCK_OPENAPI_PATHS].sort()).toEqual(
      Object.keys(approvedOpenApi.paths).sort(),
    )
  })

  it('returns session metadata with the advertised mock login path and CSRF cookies', async () => {
    const handler = createMockApiHandler({ session: 'anonymous' })
    const response = await handler(request('/api/session'))
    const session = await jsonBody<Session>(response)

    expect(session.authenticated).toBe(false)
    expect(session.loginProviders).toEqual([
      {
        registrationId: 'mock-admin',
        clientName: 'Mock administrator',
        authorizationPath: MOCK_LOGIN_PATH,
      },
    ])
    expect(session.logoutPath).toBe('/api/session/logout')
    expect(session.sessionCookie?.name).toBe('technical-interview-demo-session')
    expect(session.csrf).toEqual({
      enabled: true,
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN',
    })

    const loginResponse = await handler(request(MOCK_LOGIN_PATH))
    expect(loginResponse?.status).toBe(302)
    expect(loginResponse?.headers.get('Location')).toBe('/')
    expect(getSetCookie(loginResponse)).toContain('technical-interview-demo-session=')
    expect(getSetCookie(loginResponse)).toContain('XSRF-TOKEN=mock-csrf-token')

    const authenticatedHandler = createMockApiHandler({ session: 'admin' })
    const unadvertisedLoginResponse = await authenticatedHandler(request(MOCK_LOGIN_PATH))
    const unadvertisedProblem = await jsonBody<ApiProblem>(unadvertisedLoginResponse)

    expect(unadvertisedLoginResponse?.status).toBe(404)
    expect(unadvertisedProblem.messageKey).toBe('error.notFound')
  })

  it('preserves repeated category filters, Spring pagination, and repeated sort', async () => {
    const handler = createMockApiHandler()
    const response = await handler(
      request('/api/books?category=Architecture&category=Frontend&page=0&size=1&sort=title,DESC&sort=id,ASC'),
    )
    const page = await jsonBody<BookPage>(response)

    expect(page.totalElements).toBe(1)
    expect(page.size).toBe(1)
    expect(page.number).toBe(0)
    expect(page.first).toBe(true)
    expect(page.last).toBe(true)
    expect(page.sort?.sorted).toBe(true)
    expect(page.content?.map((book) => book.title)).toEqual([
      'Testing Same-Origin Apps',
    ])
  })

  it('enforces CSRF on unsafe authenticated writes and increments book versions', async () => {
    const handler = createMockApiHandler()
    const updateBody = {
      title: 'Updated Contract Book',
      author: 'Mock Author',
      publicationYear: 2026,
      categories: ['Java'],
      version: 1,
    } satisfies components['schemas']['BookUpdateRequest']

    const failedResponse = await handler(
      request('/api/books/1', {
        body: JSON.stringify(updateBody),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
      }),
    )
    const failedProblem = await jsonBody<ApiProblem>(failedResponse)

    expect(failedResponse?.status).toBe(403)
    expect(failedProblem).toMatchObject({
      status: 403,
      messageKey: 'error.csrf.invalid',
      language: 'en',
    })

    const updatedResponse = await handler(
      request('/api/books/1', {
        body: JSON.stringify(updateBody),
        headers: {
          'Content-Type': 'application/json',
          ...CSRF_HEADERS,
        },
        method: 'PUT',
      }),
    )
    const updated = await jsonBody<Book>(updatedResponse)

    expect(updatedResponse?.status).toBe(200)
    expect(updated.version).toBe(2)
    expect(updated.categories?.map((category) => category.name)).toEqual(['Java'])
  })

  it('keeps account/session available but returns empty page data in the empty scenario', async () => {
    const handler = createMockApiHandler({ scenario: 'empty' })
    const session = await jsonBody<Session>(await handler(request('/api/session')))
    const account = await jsonBody<components['schemas']['UserAccountResponse']>(
      await handler(request('/api/account')),
    )
    const books = await jsonBody<BookPage>(await handler(request('/api/books')))

    expect(session.authenticated).toBe(true)
    expect(account.login).toBe('admin-user')
    expect(books).toMatchObject({
      content: [],
      empty: true,
      totalElements: 0,
      totalPages: 0,
    })
  })

  it('keeps session available but returns localized problem details in the error scenario', async () => {
    const handler = createMockApiHandler({ scenario: 'error' })
    const sessionResponse = await handler(request('/api/session'))
    const errorResponse = await handler(
      request('/api/admin/operator-surface', {
        headers: {
          'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
        },
      }),
    )
    const problem = await jsonBody<ApiProblem>(errorResponse)

    expect(sessionResponse?.status).toBe(200)
    expect(errorResponse?.status).toBe(503)
    expect(problem).toMatchObject({
      status: 503,
      messageKey: 'error.mock.read',
      language: 'pl',
    })
  })

  it('forbids admin and operator endpoints for authenticated non-admin sessions', async () => {
    const handler = createMockApiHandler({ session: 'user' })
    const account = await jsonBody<components['schemas']['UserAccountResponse']>(
      await handler(request('/api/account')),
    )
    const adminResponse = await handler(request('/api/admin/users'))
    const operatorResponse = await handler(request('/api/admin/operator-surface'))
    const adminProblem = await jsonBody<ApiProblem>(adminResponse)
    const operatorProblem = await jsonBody<ApiProblem>(operatorResponse)

    expect(account.roles).toEqual(['USER'])
    expect(adminResponse?.status).toBe(403)
    expect(operatorResponse?.status).toBe(403)
    expect(adminProblem.messageKey).toBe('error.accessDenied')
    expect(operatorProblem.messageKey).toBe('error.accessDenied')
  })

  it('validates admin role replacement reasons', async () => {
    const handler = createMockApiHandler()
    const response = await handler(
      request('/api/admin/users/2/roles', {
        body: JSON.stringify({ roles: ['USER'], reason: '   ' }),
        headers: {
          'Content-Type': 'application/json',
          ...CSRF_HEADERS,
        },
        method: 'PUT',
      }),
    )
    const problem = await jsonBody<ApiProblem>(response)

    expect(response?.status).toBe(400)
    expect(problem.messageKey).toBe('error.adminUser.reasonRequired')
  })

  it('moves through anonymous login, CSRF-backed logout, and anonymous session state', async () => {
    const handler = createMockApiHandler({ session: 'anonymous' })
    const anonymous = await jsonBody<Session>(await handler(request('/api/session')))

    expect(anonymous.authenticated).toBe(false)
    expect(anonymous.loginProviders?.[0]?.authorizationPath).toBe(MOCK_LOGIN_PATH)

    await handler(request(MOCK_LOGIN_PATH))

    const authenticated = await jsonBody<Session>(await handler(request('/api/session')))
    const account = await jsonBody<components['schemas']['UserAccountResponse']>(
      await handler(request('/api/account')),
    )

    expect(authenticated.authenticated).toBe(true)
    expect(authenticated.accountPath).toBe('/api/account')
    expect(account.roles).toContain('ADMIN')

    const logoutResponse = await handler(
      request('/api/session/logout', {
        headers: CSRF_HEADERS,
        method: 'POST',
      }),
    )
    const loggedOut = await jsonBody<Session>(await handler(request('/api/session')))

    expect(logoutResponse?.status).toBe(204)
    expect(loggedOut.authenticated).toBe(false)
    expect(loggedOut.loginProviders?.[0]?.authorizationPath).toBe(MOCK_LOGIN_PATH)
  })
})

function request(path: string, init: RequestInit = {}) {
  return new Request(new URL(path, 'http://mock.local'), init)
}

async function jsonBody<T>(response: Response | undefined): Promise<T> {
  expect(response).toBeDefined()

  return (await response?.json()) as T
}

function getSetCookie(response: Response | undefined) {
  expect(response).toBeDefined()

  const headers = response?.headers as Headers & { getSetCookie?: () => string[] }
  const cookies = headers.getSetCookie?.() ?? [response?.headers.get('Set-Cookie') ?? '']

  return cookies.join('\n')
}
