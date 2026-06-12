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
import {
  ADMIN_USERS_PATH,
  type AdminUserAccount,
} from './api/adminUsers'
import { ADMIN_CATALOG_ROUTE_PATH } from './admin/AdminCatalogPage'
import { ADMIN_LOCALIZATION_ROUTE_PATH } from './admin/AdminLocalizationPage'
import { ADMIN_USERS_ROUTE_PATH } from './admin/AdminUsersPage'
import {
  BOOKS_PATH,
  CATEGORIES_PATH,
  type BookPage,
  type Category,
} from './api/catalog'
import {
  LOCALIZATIONS_PATH,
  type LocalizationPage,
} from './api/localizations'
import {
  AUDIT_LOGS_PATH,
  OPERATOR_SURFACE_PATH,
  type AuditLogPage,
  type OperatorSurface,
} from './api/operator'
import { SESSION_PATH, type SessionResponse } from './api/session'
import { THEME_STORAGE_KEY } from './ui/theme'

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
    clearDocumentTheme()
    clearDocumentCookies()
  })

  it('uses the system dark preference on first visit without storing an explicit preference', async () => {
    mockColorScheme('dark')
    mockAppFetch({
      session: createSession(),
    })

    renderApp()

    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked()

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    })
    expect(document.documentElement).toHaveAttribute(
      'data-theme-preference',
      'system',
    )
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    expect(
      screen.getByRole('radiogroup', { name: /using dark mode/i }),
    ).toBeInTheDocument()
  })

  it('persists explicit theme selections and reapplies them on authenticated routes', async () => {
    mockColorScheme('light')
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    mockAppFetch({
      session: createSession({
        authenticated: true,
      }),
    })

    const view = renderApp('/account')

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked()
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    })
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Account settings' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Light' }))

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    })
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')

    view.unmount()
    renderApp('/operator')

    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked()
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    })
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Operations console' }),
    ).toBeInTheDocument()
  })

  it('persists anonymous language selection in the backend language cookie', async () => {
    mockAppFetch({
      session: createSession(),
    })

    renderApp()

    fireEvent.click(
      await screen.findByRole('button', { name: /language preference/i }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Polish' }))

    expect(document.cookie).toContain('language=pl')
  })

  it('bootstraps the browser session and keeps diagnostics in session details', async () => {
    const githubAuthorizationPath = '/api/session/from-metadata/primary-provider'
    const smokeAuthorizationPath = '/api/session/from-metadata/fake-provider'
    const fetchMock = mockAppFetch({
      session: createSession({
        loginProviders: [
          {
            registrationId: 'github',
            clientName: 'GitHub',
            authorizationPath: githubAuthorizationPath,
          },
          {
            registrationId: 'smoke',
            clientName: 'Smoke Provider',
            authorizationPath: smokeAuthorizationPath,
          },
        ],
      }),
    })

    renderApp()

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Book catalog',
      }),
    ).toBeInTheDocument()
    const primaryNavigation = screen.getByRole('navigation', {
      name: 'Primary navigation',
    })
    expect(
      within(primaryNavigation).getByRole('link', { name: 'Catalog' }),
    ).toHaveAttribute(
      'href',
      '/catalog',
    )
    expect(
      within(primaryNavigation).queryByText('Workspace'),
    ).not.toBeInTheDocument()
    expect(
      within(primaryNavigation).queryByRole('button', { name: 'Admin' }),
    ).not.toBeInTheDocument()
    expect(
      within(primaryNavigation).queryByRole('button', { name: 'Operations' }),
    ).not.toBeInTheDocument()

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
    const signInButton = await screen.findByRole('button', {
      name: 'Sign in',
    })
    expect(signInButton).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByText('Cookie XSRF-TOKEN; header X-XSRF-TOKEN'),
    ).not.toBeInTheDocument()
    expect(await screen.findByText('Clean Code')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Java' })).toBeInTheDocument()

    signInButton.focus()
    expect(signInButton).toHaveFocus()

    fireEvent.click(signInButton)

    expect(signInButton).toHaveAttribute('aria-expanded', 'true')

    const signInMenu = screen.getByRole('region', {
      name: 'Sign in options',
    })
    const loginLink = await within(signInMenu).findByRole('link', {
      name: 'Sign in with GitHub',
    })
    const smokeLoginLink = within(signInMenu).getByRole('link', {
      name: 'Sign in with Smoke Provider',
    })

    expect(
      within(signInMenu).getByText('Browsing as guest'),
    ).toBeInTheDocument()
    expect(
      within(signInMenu).getByText(
        'Cookie XSRF-TOKEN; header X-XSRF-TOKEN',
      ),
    ).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', githubAuthorizationPath)
    expect(smokeLoginLink).toHaveAttribute('href', smokeAuthorizationPath)
  })

  it('does not invent route-guard login actions without usable provider metadata', async () => {
    mockAppFetch({
      session: createSession({
        loginProviders: [
          {
            registrationId: 'github',
            clientName: 'GitHub',
          },
          {
            registrationId: 'external',
            clientName: 'External Provider',
            authorizationPath: 'https://identity.example.test/login',
          },
        ],
      }),
    })

    renderApp('/account')

    expect(
      await screen.findByRole('heading', { name: 'Sign in required' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Sign in with GitHub' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Sign in with External Provider' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText('No sign-in options are available for this session.'),
    ).toBeInTheDocument()
  })

  it('keeps header sign-in actions scoped to usable session metadata', async () => {
    mockAppFetch({
      session: createSession({
        loginProviders: [
          {
            registrationId: 'sso',
            clientName: 'Team SSO',
            authorizationPath: '/api/session/from-metadata/team-sso',
          },
          {
            registrationId: 'external',
            clientName: 'External Provider',
            authorizationPath: 'https://identity.example.test/login',
          },
          {
            registrationId: 'missing-path',
            clientName: 'Missing Path',
          },
        ],
      }),
    })

    renderApp('/catalog')

    fireEvent.click(await screen.findByRole('button', { name: 'Sign in' }))

    const signInMenu = screen.getByRole('region', {
      name: 'Sign in options',
    })

    expect(
      within(signInMenu).getByRole('link', { name: 'Sign in with Team SSO' }),
    ).toHaveAttribute('href', '/api/session/from-metadata/team-sso')
    expect(
      within(signInMenu).queryByRole('link', {
        name: 'Sign in with External Provider',
      }),
    ).not.toBeInTheDocument()
    expect(
      within(signInMenu).queryByRole('link', {
        name: 'Sign in with Missing Path',
      }),
    ).not.toBeInTheDocument()
  })

  it('renders localized session bootstrap failures and recovers through the retry action', async () => {
    let backendHealthy = false

    vi.stubGlobal('fetch', vi.fn().mockImplementation((input: RequestInfo | URL) => {
      if (String(input) === SESSION_PATH) {
        return Promise.resolve(
          backendHealthy
            ? Response.json(createSession())
            : new Response(null, {
                status: 503,
                statusText: 'Service Unavailable',
              }),
        )
      }

      return Promise.resolve(Response.json([]))
    }))

    renderApp()

    expect(await screen.findByText('Connection issue')).toBeInTheDocument()
    expect(
      screen.queryByText('GET /api/session failed with 503 Service Unavailable'),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Connection issue' }))

    const sessionDetails = screen.getByRole('region', {
      name: 'Connection menu',
    })

    expect(within(sessionDetails).getByRole('alert')).toHaveTextContent(
      'The service cannot be reached right now. Check your connection or try again shortly.',
    )

    backendHealthy = true
    fireEvent.click(
      within(sessionDetails).getByRole('button', { name: 'Try again' }),
    )

    expect(
      await screen.findByRole('button', { name: 'Sign in' }),
    ).toBeInTheDocument()
  })

  it('renders authenticated header state and the guarded account profile', async () => {
    const fetchMock = mockAppFetch({
      account: createAccount({
        roles: ['USER', 'ADMIN'],
      }),
      session: createSession({
        authenticated: true,
      }),
    })

    renderApp('/account')

    // The account trigger shows the signed-in user's name once loaded.
    const accountButton = await screen.findByRole('button', {
      name: 'Kamil Kiewisz',
    })
    fireEvent.click(accountButton)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Account settings' }),
    ).toBeInTheDocument()
    const primaryNavigation = screen.getByRole('navigation', {
      name: 'Primary navigation',
    })
    expect(
      within(primaryNavigation).queryByRole('link', { name: 'Account' }),
    ).not.toBeInTheDocument()
    const accountMenu = screen.getByRole('region', { name: 'Account menu' })
    expect(
      within(accountMenu).getByRole('link', { name: 'Account settings' }),
    ).toHaveAttribute(
      'href',
      '/account',
    )
    expect(
      screen.getByRole('heading', { name: 'Language preference' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Localizations' }),
    ).not.toBeInTheDocument()
    fireEvent.click(
      await within(primaryNavigation).findByRole('button', { name: 'Admin' }),
    )
    expect(
      within(primaryNavigation).getByRole('link', { name: 'Catalog admin' }),
    ).toHaveAttribute(
      'href',
      '/admin/catalog',
    )
    expect(
      within(primaryNavigation).getByRole('link', { name: 'Localizations' }),
    ).toHaveAttribute('href', '/admin/localizations')
    expect(
      within(primaryNavigation).getByRole('link', { name: 'Users' }),
    ).toHaveAttribute('href', '/admin/users')
    fireEvent.click(
      within(primaryNavigation).getByRole('button', { name: 'Operations' }),
    )
    expect(
      within(primaryNavigation).getByRole('link', { name: 'Operations console' }),
    ).toHaveAttribute('href', '/operator')
    expect(
      within(primaryNavigation).getByRole('link', { name: 'Diagnostics' }),
    ).toHaveAttribute('href', '/operator/diagnostics')
    expect((await screen.findAllByText('Kamil Kiewisz')).length).toBeGreaterThan(1)
    expect(screen.getByText('kamkie')).toBeInTheDocument()
    expect(screen.getByText('kamil@example.test')).toBeInTheDocument()
    expect(screen.getAllByText('Polish')[0]).toBeInTheDocument()
    expect(screen.getByLabelText('Language')).toHaveValue('pl')
    expect(screen.getByRole('button', { name: 'Save language' })).toBeDisabled()
    expect(screen.getByText('User')).toBeInTheDocument()
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

    const preferredLanguageField = screen.getAllByText('German')[0].closest('div')

    expect(preferredLanguageField).not.toBeNull()
    expect(
      within(preferredLanguageField as HTMLElement).getByText('German'),
    ).toBeInTheDocument()
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
      .getAllByText('No preference')[0]
      .closest('div')

    expect(preferredLanguageField).not.toBeNull()
    expect(
      within(preferredLanguageField as HTMLElement).getByText('No preference'),
    ).toBeInTheDocument()
  })

  it('updates the language preference from the topbar quick menu', async () => {
    document.cookie = 'XSRF-TOKEN=token'
    const fetchMock = mockAppFetch({
      languageResponse: createAccount({
        preferredLanguage: 'de',
        updatedAt: '2026-06-07T09:40:00Z',
      }),
      session: createSession({
        authenticated: true,
      }),
    })

    renderApp()

    const trigger = await screen.findByRole('button', {
      name: 'Language preference, currently Polish',
    })

    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('button', { name: 'German' }))

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
          preferredLanguage: 'de',
        }),
      })
    })
    expect(
      await screen.findByRole('button', {
        name: 'Language preference, currently German',
      }),
    ).toBeInTheDocument()
  })

  it('syncs the topbar quick language menu after an account page change', async () => {
    document.cookie = 'XSRF-TOKEN=token'
    mockAppFetch({
      languageResponse: createAccount({
        preferredLanguage: 'de',
        updatedAt: '2026-06-07T09:40:00Z',
      }),
      session: createSession({
        authenticated: true,
      }),
    })

    renderApp('/account')

    expect(
      await screen.findByRole('button', {
        name: 'Language preference, currently Polish',
      }),
    ).toBeInTheDocument()

    fireEvent.change(await screen.findByLabelText('Language'), {
      target: {
        value: 'de',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save language' }))

    expect(
      await screen.findByText('Language preference updated.'),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('button', {
        name: 'Language preference, currently German',
      }),
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

  it('resolves admin navigation from the account without showing admin links to non-admins', async () => {
    const fetchMock = mockAppFetch({
      session: createSession({
        authenticated: true,
      }),
    })

    renderApp('/catalog')

    expect(
      await screen.findByRole('button', { name: 'Kamil Kiewisz' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Clean Code')).toBeInTheDocument()
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input]) => String(input) === ACCOUNT_PATH),
      ).toBe(true)
    })
    expect(
      screen.queryByRole('button', { name: 'Admin' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Operations' }),
    ).not.toBeInTheDocument()
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

    fireEvent.click(await screen.findByRole('button', { name: 'Kamil Kiewisz' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

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

    fireEvent.click(await screen.findByRole('button', { name: 'Kamil Kiewisz' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

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
            authorizationPath: '/api/session/from-metadata/account-guard',
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
    ).toHaveAttribute('href', '/api/session/from-metadata/account-guard')
    expect(screen.queryByRole('button', { name: 'Account' })).not.toBeInTheDocument()
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
            authorizationPath: '/api/session/from-metadata/admin-catalog-guard',
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
    ).toHaveAttribute('href', '/api/session/from-metadata/admin-catalog-guard')
    expect(
      screen.queryByRole('button', { name: 'Create book' }),
    ).not.toBeInTheDocument()
  })

  it('guards the admin localization route for anonymous sessions', async () => {
    const fetchMock = mockAppFetch({
      session: createSession({
        loginProviders: [
          {
            registrationId: 'github',
            clientName: 'GitHub',
            authorizationPath:
              '/api/session/from-metadata/admin-localization-guard',
          },
        ],
      }),
    })

    renderApp(ADMIN_LOCALIZATION_ROUTE_PATH)

    expect(
      await screen.findByRole('heading', { name: 'Sign in required' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Sign in with GitHub' }),
    ).toHaveAttribute(
      'href',
      '/api/session/from-metadata/admin-localization-guard',
    )
    expect(
      screen.queryByRole('button', { name: 'Create localization' }),
    ).not.toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input).startsWith(LOCALIZATIONS_PATH),
      ),
    ).toBe(false)
  })

  it('guards the admin users route for anonymous sessions without calling admin user APIs', async () => {
    const fetchMock = mockAppFetch({
      session: createSession({
        loginProviders: [
          {
            registrationId: 'github',
            clientName: 'GitHub',
            authorizationPath: '/api/session/from-metadata/admin-users-guard',
          },
        ],
      }),
    })

    renderApp(ADMIN_USERS_ROUTE_PATH)

    expect(
      await screen.findByRole('heading', { name: 'Sign in required' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Sign in with GitHub' }),
    ).toHaveAttribute('href', '/api/session/from-metadata/admin-users-guard')
    expect(screen.queryByRole('button', { name: 'Admin' })).not.toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([input]) => String(input) === ADMIN_USERS_PATH),
    ).toBe(false)
  })

  it('guards the operator route for anonymous sessions without calling operator APIs', async () => {
    const fetchMock = mockAppFetch({
      session: createSession({
        loginProviders: [
          {
            registrationId: 'github',
            clientName: 'GitHub',
            authorizationPath: '/api/session/from-metadata/operator-guard',
          },
        ],
      }),
    })

    renderApp('/operator')

    expect(
      await screen.findByRole('heading', { name: 'Sign in required' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Sign in with GitHub' }),
    ).toHaveAttribute('href', '/api/session/from-metadata/operator-guard')
    expect(screen.queryByRole('link', { name: 'Operations' })).not.toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input).startsWith('/api/admin/'),
      ),
    ).toBe(false)
  })

  it('renders the admin localization route for admin users', async () => {
    const fetchMock = mockAppFetch({
      account: createAccount({
        roles: ['USER', 'ADMIN'],
      }),
      session: createSession({
        authenticated: true,
      }),
    })

    renderApp(ADMIN_LOCALIZATION_ROUTE_PATH)

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Localization administration',
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: 'Edit account.title en' }),
    ).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      `${LOCALIZATIONS_PATH}?page=0&size=20&sort=messageKey%2CASC&sort=language%2CASC`,
      expect.objectContaining({
        credentials: 'same-origin',
        method: 'GET',
      }),
    )
  })

  it('renders the admin users route for admin users', async () => {
    const fetchMock = mockAppFetch({
      account: createAccount({
        roles: ['USER', 'ADMIN'],
      }),
      session: createSession({
        authenticated: true,
      }),
    })

    renderApp(ADMIN_USERS_ROUTE_PATH)

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'User administration',
      }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Admin User')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(ADMIN_USERS_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
  })

  it('renders the operator route for authenticated users without account-role gating', async () => {
    const fetchMock = mockAppFetch({
      session: createSession({
        authenticated: true,
      }),
    })

    renderApp('/operator')

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Operations console',
      }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Created category Java.')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      `${AUDIT_LOGS_PATH}?page=0&size=20&sort=id%2CDESC`,
      expect.objectContaining({
        credentials: 'same-origin',
        method: 'GET',
      }),
    )
  })

  it('renders the operator diagnostics route for authenticated users', async () => {
    const fetchMock = mockAppFetch({
      session: createSession({
        authenticated: true,
      }),
    })

    renderApp('/operator/diagnostics')

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'System diagnostics',
      }),
    ).toBeInTheDocument()
    // Audit browsing lives on the operations console; the summary links there.
    expect(
      await screen.findByRole('link', { name: 'Browse audit rows' }),
    ).toHaveAttribute('href', '/operator')
    expect(fetchMock).toHaveBeenCalledWith(OPERATOR_SURFACE_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
  })

  it('reflects the active route in the document title', async () => {
    mockAppFetch({
      session: createSession({
        authenticated: true,
      }),
    })

    const view = renderApp()

    await screen.findByRole('heading', { level: 1, name: 'Book catalog' })
    expect(document.title).toBe('Book catalog · Library Console')

    view.unmount()
    renderApp('/account')

    await screen.findByRole('heading', { level: 1, name: 'Account settings' })
    expect(document.title).toBe('Account settings · Library Console')
  })

  it('exposes a skip link targeting the main workspace', async () => {
    mockAppFetch({
      session: createSession(),
    })

    renderApp()

    const skipLink = screen.getByRole('link', { name: 'Skip to main content' })

    expect(skipLink).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    await screen.findByRole('heading', { level: 1, name: 'Book catalog' })
  })

  it('moves focus to the page heading after in-app navigation but not on load', async () => {
    mockAppFetch({
      session: createSession({
        authenticated: true,
      }),
    })

    renderApp()

    await screen.findByRole('heading', { level: 1, name: 'Book catalog' })
    expect(
      screen.getByRole('heading', { level: 1, name: 'Book catalog' }),
    ).not.toHaveFocus()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Kamil Kiewisz' }),
    )
    fireEvent.click(screen.getByRole('link', { name: 'Account settings' }))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Account settings' }),
      ).toHaveFocus()
    })
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
  adminUsers = createAdminUsers(),
  books = createBookPage(),
  categories = [{ id: 1, name: 'Java' }],
  languageResponse = createAccount(),
  localizations = createLocalizationPage(),
  logoutResponse = new Response(null, { status: 204 }),
  operatorAuditLogs = createOperatorAuditLogPage(),
  operatorSurface = createOperatorSurface(),
  session,
}: {
  account?: UserAccount | Response | ((path: string) => UserAccount | Response | Promise<Response>)
  adminUsers?: AdminUserAccount[] | Response
  books?: BookPage
  categories?: Category[]
  languageResponse?:
    | UserAccount
    | Response
    | ((
        path: string,
        init: RequestInit | undefined,
      ) => UserAccount | Response | Promise<Response>)
  localizations?: LocalizationPage
  logoutResponse?: Response
  operatorAuditLogs?: AuditLogPage
  operatorSurface?: OperatorSurface
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

    if (path.startsWith(LOCALIZATIONS_PATH)) {
      return Promise.resolve(Response.json(localizations))
    }

    if (path === ADMIN_USERS_PATH) {
      return Promise.resolve(toAdminUsersResponse(adminUsers))
    }

    if (path === OPERATOR_SURFACE_PATH) {
      return Promise.resolve(Response.json(operatorSurface))
    }

    if (path.startsWith(AUDIT_LOGS_PATH)) {
      return Promise.resolve(Response.json(operatorAuditLogs))
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

function createLocalizationPage(): LocalizationPage {
  return {
    content: [
      {
        id: 1,
        messageKey: 'account.title',
        language: 'en',
        messageText: 'Account',
        description: 'Account title',
        createdAt: '2026-06-07T09:00:00Z',
        updatedAt: '2026-06-07T09:00:00Z',
      },
    ],
    first: true,
    last: true,
    number: 0,
    numberOfElements: 1,
    size: 20,
    totalElements: 1,
    totalPages: 1,
  }
}

function createAdminUsers(): AdminUserAccount[] {
  return [
    {
      id: 7,
      provider: 'github',
      login: 'admin-user',
      displayName: 'Admin User',
      email: 'admin@example.test',
      preferredLanguage: 'en',
      roles: ['USER', 'ADMIN'],
      roleGrants: [
        {
          role: 'USER',
          source: 'AUTHENTICATED_LOGIN',
          grantedAt: '2026-06-07T09:00:00Z',
        },
        {
          role: 'ADMIN',
          source: 'ADMIN_MANAGED',
          grantedAt: '2026-06-07T09:05:00Z',
          grantedByUserId: 42,
          grantedByLogin: 'owner-admin',
          reason: 'Initial administrator',
        },
      ],
      lastLoginAt: '2026-06-06T22:10:00Z',
      createdAt: '2026-05-11T12:00:00Z',
      updatedAt: '2026-06-06T22:10:00Z',
    },
  ]
}

function createOperatorSurface(): OperatorSurface {
  return {
    audit: {
      auditLogEndpoint: AUDIT_LOGS_PATH,
      totalEntries: 2,
      recentEntries: [
        {
          id: 1,
          targetType: 'BOOK',
          targetId: 10,
          action: 'UPDATE',
          actorLogin: 'admin-user',
          summary: 'Updated book title.',
          createdAt: '2026-06-07T08:30:00Z',
          details: {
            title: {
              before: 'Clean Code',
              after: 'Clean Code Updated',
            },
          },
        },
      ],
    },
    runtime: {
      technicalOverviewEndpoint: '/',
      technicalOverview: {
        build: {
          name: 'technical-interview-demo',
          version: '1.0.0',
        },
      },
    },
    operations: {
      actuatorHealthEndpoint: '/actuator/health',
      applicationHealthStatus: 'UP',
      livenessState: 'CORRECT',
      readinessState: 'ACCEPTING_TRAFFIC',
    },
  }
}

function createOperatorAuditLogPage(): AuditLogPage {
  return {
    content: [
      {
        id: 2,
        targetType: 'CATEGORY',
        targetId: 3,
        action: 'CREATE',
        actorLogin: 'admin-user',
        summary: 'Created category Java.',
        createdAt: '2026-06-07T08:35:00Z',
      },
    ],
    first: true,
    last: true,
    number: 0,
    numberOfElements: 1,
    size: 20,
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

function toAdminUsersResponse(value: AdminUserAccount[] | Response) {
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

function clearDocumentTheme() {
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-theme-preference')
  document.documentElement.style.colorScheme = ''
}

function mockColorScheme(theme: 'dark' | 'light') {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string): MediaQueryList => {
      return {
        matches:
          query === '(prefers-color-scheme: dark)' && theme === 'dark',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(() => true),
      }
    }),
  )
}
