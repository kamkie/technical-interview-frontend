import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'
import {
  ACCOUNT_LANGUAGE_PATH,
  ACCOUNT_PATH,
  type UserAccount,
} from './api/account'
import { ADMIN_CATALOG_ROUTE_PATH } from './admin/AdminCatalogPage'
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

  it('renders authenticated header state and the guarded account profile', async () => {
    const fetchMock = mockAppFetch({
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
    expect(await screen.findByText('Kamil Kiewisz')).toBeInTheDocument()
    expect(screen.getByText('kamkie')).toBeInTheDocument()
    expect(screen.getByText('kamil@example.test')).toBeInTheDocument()
    expect(screen.getByText('pl')).toBeInTheDocument()
    expect(screen.getByLabelText('Language')).toHaveValue('pl')
    expect(screen.getByRole('button', { name: 'Save language' })).toBeDisabled()
    expect(screen.getByText('USER')).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([input]) => String(input) === ACCOUNT_PATH),
    ).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(ACCOUNT_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
    expect(
      screen.queryByRole('link', { name: /Sign in with/ }),
    ).not.toBeInTheDocument()
  })

  it('updates the account language preference and visible profile', async () => {
    document.cookie = 'XSRF-TOKEN=token%201'
    const fetchMock = mockAppFetch({
      languageResponse: createAccount({
        preferredLanguage: 'de',
        updatedAt: '2026-06-07T09:30:00Z',
      }),
      session: createSession({
        authenticated: true,
      }),
    })

    renderApp('/account')

    fireEvent.change(await screen.findByLabelText('Language'), {
      target: {
        value: 'de',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save language' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(ACCOUNT_LANGUAGE_PATH, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': 'token 1',
        },
        body: JSON.stringify({
          preferredLanguage: 'de',
        }),
      })
    })
    expect(
      await screen.findByText('Language preference updated.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Language')).toHaveValue('de')

    const preferredLanguageField = screen
      .getByText('Preferred language')
      .closest('div')

    expect(preferredLanguageField).not.toBeNull()
    expect(within(preferredLanguageField as HTMLElement).getByText('de')).toBeInTheDocument()
  })

  it('clears the account language preference with a blank contract body', async () => {
    document.cookie = 'XSRF-TOKEN=token'
    const fetchMock = mockAppFetch({
      languageResponse: createAccount({
        preferredLanguage: undefined,
        updatedAt: '2026-06-07T09:35:00Z',
      }),
      session: createSession({
        authenticated: true,
      }),
    })

    renderApp('/account')

    fireEvent.click(await screen.findByRole('button', { name: 'Clear preference' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(ACCOUNT_LANGUAGE_PATH, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': 'token',
        },
        body: JSON.stringify({
          preferredLanguage: '',
        }),
      })
    })
    expect(
      await screen.findByText('Language preference cleared.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Language')).toHaveValue('')

    const preferredLanguageField = screen
      .getByText('Preferred language')
      .closest('div')

    expect(preferredLanguageField).not.toBeNull()
    expect(
      within(preferredLanguageField as HTMLElement).getByText('No preference'),
    ).toBeInTheDocument()
  })

  it('renders localized backend language validation errors', async () => {
    document.cookie = 'XSRF-TOKEN=token'
    mockAppFetch({
      languageResponse: Response.json(
        {
          status: 400,
          messageKey: 'error.account.language.invalid',
          message: 'Kod jezyka jest nieprawidlowy.',
          language: 'pl',
        },
        {
          status: 400,
          statusText: 'Bad Request',
          headers: {
            'Content-Type': 'application/problem+json',
          },
        },
      ),
      session: createSession({
        authenticated: true,
      }),
    })

    renderApp('/account')

    fireEvent.change(await screen.findByLabelText('Language'), {
      target: {
        value: 'de',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save language' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Kod jezyka jest nieprawidlowy.',
    )
    expect(screen.getByLabelText('Language')).toHaveValue('de')
  })

  it('lets the backend handle missing CSRF for language updates', async () => {
    const fetchMock = mockAppFetch({
      languageResponse: Response.json(
        {
          status: 403,
          messageKey: 'error.csrf.invalid',
          message: 'Token CSRF jest wymagany.',
          language: 'pl',
        },
        {
          status: 403,
          statusText: 'Forbidden',
          headers: {
            'Content-Type': 'application/problem+json',
          },
        },
      ),
      session: createSession({
        authenticated: true,
      }),
    })

    renderApp('/account')

    fireEvent.change(await screen.findByLabelText('Language'), {
      target: {
        value: 'fr',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save language' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(ACCOUNT_LANGUAGE_PATH, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferredLanguage: 'fr',
        }),
      })
    })
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Token CSRF jest wymagany.',
    )
  })

  it('does not fetch the account profile when an authenticated user stays on catalog', async () => {
    const fetchMock = mockAppFetch({
      session: createSession({
        authenticated: true,
      }),
    })

    renderApp('/catalog')

    expect(await screen.findByRole('button', { name: 'Sign out' })).toBeInTheDocument()
    expect(await screen.findByText('Clean Code')).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([input]) => String(input) === ACCOUNT_PATH),
    ).toBe(false)
  })

  it('renders account loading state after authenticated session bootstrap', async () => {
    mockAppFetch({
      account: () => new Promise<Response>(() => undefined),
      session: createSession({
        authenticated: true,
      }),
    })

    renderApp('/account')

    expect(await screen.findByText('Loading account...')).toBeInTheDocument()
  })

  it('renders localized backend account errors', async () => {
    mockAppFetch({
      account: Response.json(
        {
          status: 403,
          messageKey: 'error.account.access_denied',
          message: 'Profil konta jest niedostepny.',
          language: 'pl',
        },
        {
          status: 403,
          statusText: 'Forbidden',
          headers: {
            'Content-Type': 'application/problem+json',
          },
        },
      ),
      session: createSession({
        authenticated: true,
      }),
    })

    renderApp('/account')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Profil konta jest niedostepny.',
    )
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
    const fetchMock = mockAppFetch({
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
    expect(
      fetchMock.mock.calls.some(([input]) => String(input) === ACCOUNT_PATH),
    ).toBe(false)
  })

  it('guards the admin catalog route for anonymous sessions', async () => {
    mockAppFetch({
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

    renderApp(ADMIN_CATALOG_ROUTE_PATH)

    expect(
      await screen.findByRole('heading', { name: 'Sign in required' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Sign in with GitHub' }),
    ).toHaveAttribute('href', '/api/session/oauth2/authorization/github')
    expect(
      screen.queryByRole('button', { name: 'Create book' }),
    ).not.toBeInTheDocument()
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
  account = createAccount(),
  books = createBookPage(),
  categories = [{ id: 1, name: 'Java' }],
  languageResponse = createAccount(),
  logoutResponse = new Response(null, { status: 204 }),
  session,
}: {
  account?: UserAccount | Response | ((path: string) => UserAccount | Response | Promise<Response>)
  books?: BookPage
  categories?: Category[]
  languageResponse?:
    | UserAccount
    | Response
    | ((
        path: string,
        init: RequestInit | undefined,
      ) => UserAccount | Response | Promise<Response>)
  logoutResponse?: Response
  session: SessionResponse | SessionResponse[]
}) {
  const sessionResponses = Array.isArray(session) ? [...session] : [session]
  let currentSession = sessionResponses[0] ?? createSession()
  const fetchMock = vi.fn().mockImplementation((
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    const path = String(input)

    if (path === SESSION_PATH) {
      currentSession = sessionResponses.shift() ?? currentSession

      return Promise.resolve(Response.json(currentSession))
    }

    if (path === '/api/session/logout') {
      return Promise.resolve(logoutResponse)
    }

    if (path === ACCOUNT_LANGUAGE_PATH) {
      const accountResponse = resolveValue(languageResponse, path, init)

      return accountResponse instanceof Promise
        ? accountResponse
        : Promise.resolve(toAccountResponse(accountResponse))
    }

    if (path === (currentSession.accountPath ?? ACCOUNT_PATH)) {
      const accountResponse = resolveValue(account, path)

      return accountResponse instanceof Promise
        ? accountResponse
        : Promise.resolve(toAccountResponse(accountResponse))
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

function createAccount(overrides: UserAccount = {}): UserAccount {
  return {
    id: 42,
    provider: 'github',
    login: 'kamkie',
    displayName: 'Kamil Kiewisz',
    email: 'kamil@example.test',
    preferredLanguage: 'pl',
    roles: ['USER'],
    lastLoginAt: '2026-06-06T22:10:00Z',
    createdAt: '2026-05-11T12:00:00Z',
    updatedAt: '2026-06-06T22:10:00Z',
    ...overrides,
  }
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

function resolveValue<T, TArgs extends unknown[]>(
  value: T | ((...args: TArgs) => T),
  ...args: TArgs
) {
  return typeof value === 'function'
    ? (value as (...args: TArgs) => T)(...args)
    : value
}

function toAccountResponse(value: UserAccount | Response) {
  return value instanceof Response ? value : Response.json(value)
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
