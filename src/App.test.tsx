import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'
import { BOOKS_PATH, CATEGORIES_PATH, type BookPage, type Category } from './api/catalog'
import { SESSION_PATH, type SessionResponse } from './api/session'

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
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
    expect(screen.getByText('Signed out')).toBeInTheDocument()
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
  session,
}: {
  books?: BookPage
  categories?: Category[]
  session: SessionResponse
}) {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const path = String(input)

    if (path === SESSION_PATH) {
      return Promise.resolve(Response.json(session))
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
