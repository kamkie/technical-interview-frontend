import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'
import {
  BOOKS_PATH,
  CATEGORIES_PATH,
  type BookPage,
  type Category,
} from './api/catalog'
import { SESSION_PATH, type SessionResponse } from './api/session'

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    clearDocumentCookies()
  })

  it('bootstraps the browser session and renders login providers', async () => {
    const fetchMock = mockAppFetch({
      session: createSession({
        loginProviders: [
          {
            registrationId: 'github',
            clientName: 'GitHub',
            authorizationPath: '/api/session/oauth2/authorization/github',
          },
        ],
      }),
    })

    renderApp()

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Technical Interview Frontend',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Books' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Catalog' })).toHaveAttribute(
      'href',
      '/catalog',
    )

    const loginLink = await screen.findByRole('link', {
      name: 'Sign in with GitHub',
    })

    expect(fetchMock).toHaveBeenCalledWith(SESSION_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
    expect(fetchMock).toHaveBeenCalledWith(CATEGORIES_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Accept-Language': expect.stringContaining('en'),
      },
    })
    expect(fetchMock).toHaveBeenCalledWith(
      `${BOOKS_PATH}?page=0&size=10&sort=title%2CASC`,
      {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Accept-Language': expect.stringContaining('en'),
        },
      },
    )
    expect(screen.getAllByText('Signed out')).toHaveLength(2)
    expect(screen.getByText('XSRF-TOKEN -> X-XSRF-TOKEN')).toBeInTheDocument()
    expect(await screen.findByText('Clean Code')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Java' })).toBeInTheDocument()
    expect(loginLink).toHaveAttribute(
      'href',
      '/api/session/oauth2/authorization/github',
    )
  })

  it('renders session bootstrap failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((input: RequestInfo | URL) => {
      if (String(input) === SESSION_PATH) {
        return Promise.resolve(
          new Response(null, {
            status: 503,
            statusText: 'Service Unavailable',
          }),
        )
      }

      return Promise.resolve(Response.json([]))
    }))

    renderApp()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'GET /api/session failed with 503 Service Unavailable',
    )
  })

  it('renders authenticated header state and the guarded account placeholder', async () => {
    mockAppFetch({
      session: createSession({
        authenticated: true,
      }),
    })

    renderApp('/account')

    expect(
      await screen.findByRole('button', { name: 'Sign out' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute(
      'href',
      '/account',
    )
    expect(
      screen.getByRole('heading', { name: 'Account' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Authenticated session established.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Sign in with/ }),
    ).not.toBeInTheDocument()
  })

  it('posts metadata-driven logout with the configured CSRF header and refreshes session', async () => {
    document.cookie = 'XSRF-TOKEN=token%201'
    const fetchMock = mockAppFetch({
      session: [
        createSession({
          authenticated: true,
        }),
        createSession({
          authenticated: false,
        }),
      ],
    })

    renderApp('/account')

    fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/session/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'X-XSRF-TOKEN': 'token 1',
        },
      })
    })
    expect(
      await screen.findByRole('heading', { name: 'Sign in required' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument()
  })

  it('does not block logout when the configured CSRF cookie is missing', async () => {
    const fetchMock = mockAppFetch({
      session: [
        createSession({
          authenticated: true,
        }),
        createSession({
          authenticated: false,
        }),
      ],
    })

    renderApp('/account')

    fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/session/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
        },
      })
    })
    expect(
      await screen.findByRole('heading', { name: 'Sign in required' }),
    ).toBeInTheDocument()
  })

  it('keeps authenticated-only routes guarded for anonymous sessions', async () => {
    mockAppFetch({
      session: createSession({
        loginProviders: [
          {
            registrationId: 'oidc',
            clientName: 'Company SSO',
            authorizationPath: '/api/session/oauth2/authorization/oidc',
          },
        ],
      }),
    })

    renderApp('/account')

    expect(
      await screen.findByRole('heading', { name: 'Sign in required' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Sign in with Company SSO' }),
    ).toHaveAttribute('href', '/api/session/oauth2/authorization/oidc')
    expect(screen.queryByRole('link', { name: 'Account' })).not.toBeInTheDocument()
  })
})

function renderApp(initialEntry = '/catalog') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  )
}

function mockAppFetch({
  books = createBookPage(),
  categories = [{ id: 1, name: 'Java' }],
  logoutResponse = new Response(null, { status: 204 }),
  session,
}: {
  books?: BookPage
  categories?: Category[]
  logoutResponse?: Response
  session: SessionResponse | SessionResponse[]
}) {
  const sessionResponses = Array.isArray(session) ? [...session] : [session]
  let currentSession = sessionResponses[0] ?? createSession()
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const path = String(input)

    if (path === SESSION_PATH) {
      currentSession = sessionResponses.shift() ?? currentSession

      return Promise.resolve(Response.json(currentSession))
    }

    if (path === '/api/session/logout') {
      return Promise.resolve(logoutResponse)
    }

    if (path === CATEGORIES_PATH) {
      return Promise.resolve(Response.json(categories))
    }

    if (path.startsWith(BOOKS_PATH)) {
      return Promise.resolve(Response.json(books))
    }

    return Promise.resolve(new Response(null, { status: 404 }))
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

function createBookPage(): BookPage {
  return {
    content: [
      {
        id: 10,
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publicationYear: 2008,
        categories: [{ id: 1, name: 'Java' }],
      },
    ],
    first: true,
    last: true,
    number: 0,
    numberOfElements: 1,
    size: 10,
    totalElements: 1,
    totalPages: 1,
  }
}

function createSession(overrides: SessionResponse = {}): SessionResponse {
  return {
    authenticated: false,
    accountPath: '/api/account',
    loginProviders: [],
    logoutPath: '/api/session/logout',
    sessionCookie: {
      name: 'technical-interview-demo-session',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    },
    csrf: {
      enabled: true,
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN',
    },
    ...overrides,
  }
}

function clearDocumentCookies() {
  document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0]?.trim())
    .filter(Boolean)
    .forEach((cookieName) => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    })
}
