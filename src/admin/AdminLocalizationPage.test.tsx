import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  ACCOUNT_PATH,
  type UserAccount,
} from '../api/account'
import {
  LOCALIZATIONS_PATH,
  SUPPORTED_LOCALIZATION_LANGUAGES,
  getLocalizationPath,
  type LocalizationPage,
  type LocalizationResponse,
} from '../api/localizations'
import type { SessionResponse } from '../api/session'
import {
  ADMIN_LOCALIZATION_ROUTE_PATH,
  AdminLocalizationPage,
} from './AdminLocalizationPage'

describe('AdminLocalizationPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    clearDocumentCookies()
  })

  it('loads admin localizations with URL filters and repeated sort values', async () => {
    const fetchMock = mockAdminLocalizationFetch()

    renderAdminLocalization(
      `${ADMIN_LOCALIZATION_ROUTE_PATH}?messageKey=account.title&language=pl&page=2&size=50&sort=language,ASC&sort=messageKey,ASC`,
    )

    expect(await screen.findByText('Konto')).toBeInTheDocument()
    const statusSummary = screen.getByLabelText('Localization status summary')
    expect(
      within(statusSummary).getByText('Maintain localized messages'),
    ).toBeInTheDocument()
    expect(
      within(statusSummary).getByText('Create, edit, delete'),
    ).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(ACCOUNT_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
    expect(fetchMock).toHaveBeenCalledWith(
      `${LOCALIZATIONS_PATH}?messageKey=account.title&language=pl&page=2&size=50&sort=language%2CASC&sort=messageKey%2CASC`,
      expect.objectContaining({
        credentials: 'same-origin',
        method: 'GET',
      }),
    )

    const coverageTable = screen.getByRole('table', {
      name: 'Localization coverage',
    })

    for (const language of SUPPORTED_LOCALIZATION_LANGUAGES) {
      expect(
        within(coverageTable).getByRole('columnheader', { name: language }),
      ).toBeInTheDocument()
    }
    expect(within(coverageTable).getByText('partial')).toBeInTheDocument()
    expect(screen.getAllByLabelText('Rows per page')[0]).toHaveValue('50')
  })

  it('keeps authenticated non-admin users away from localization controls', async () => {
    const fetchMock = mockAdminLocalizationFetch({
      account: createAccount({
        roles: ['USER'],
      }),
    })

    renderAdminLocalization()

    expect(await screen.findByText('Admin role required')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Admin access is required for localization management.',
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

  it('creates a missing locale row and refreshes visible coverage', async () => {
    document.cookie = 'XSRF-TOKEN=token%201'
    let localizationReads = 0
    const fetchMock = mockAdminLocalizationFetch({
      createLocalizationResponse: createLocalizationRow({
        id: 3,
        language: 'de',
        messageText: 'Konto',
      }),
      localizations: () => {
        localizationReads += 1

        return createLocalizationPage({
          content:
            localizationReads === 1
              ? [
                  createLocalizationRow({
                    id: 1,
                    language: 'en',
                    messageText: 'Account',
                  }),
                ]
              : [
                  createLocalizationRow({
                    id: 1,
                    language: 'en',
                    messageText: 'Account',
                  }),
                  createLocalizationRow({
                    id: 3,
                    language: 'de',
                    messageText: 'Konto',
                  }),
                ],
        })
      },
    })

    renderAdminLocalization(`${ADMIN_LOCALIZATION_ROUTE_PATH}?messageKey=account.title`)

    fireEvent.click(await screen.findByRole('button', { name: 'Add account.title de' }))

    const form = screen.getByRole('form', { name: 'Create localization' })
    expect(within(form).getByLabelText('Message key')).toHaveValue('account.title')
    expect(within(form).getByLabelText('Language')).toHaveValue('de')
    fireEvent.change(within(form).getByLabelText('Message text'), {
      target: { value: 'Konto' },
    })
    fireEvent.submit(form)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(LOCALIZATIONS_PATH, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': 'token 1',
        },
        body: JSON.stringify({
          messageKey: 'account.title',
          language: 'de',
          messageText: 'Konto',
        }),
      })
    })
    expect(await screen.findByText('Localization created.')).toBeInTheDocument()
    expect(await screen.findByText('Konto')).toBeInTheDocument()
    expect(localizationReads).toBeGreaterThanOrEqual(2)
  })

  it('updates existing rows through a fresh row read and list refresh', async () => {
    document.cookie = 'XSRF-TOKEN=token'
    let localizationReads = 0
    const fetchMock = mockAdminLocalizationFetch({
      localizationById: createLocalizationRow({
        id: 1,
        language: 'en',
        messageText: 'Account',
      }),
      updateLocalizationResponse: createLocalizationRow({
        id: 1,
        language: 'en',
        messageText: 'Account settings',
      }),
      localizations: () => {
        localizationReads += 1

        return createLocalizationPage({
          content: [
            createLocalizationRow({
              id: 1,
              language: 'en',
              messageText:
                localizationReads === 1 ? 'Account' : 'Account settings',
            }),
            createLocalizationRow({
              id: 2,
              language: 'pl',
              messageText: 'Konto',
            }),
          ],
        })
      },
    })

    renderAdminLocalization()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit account.title en' }),
    )

    const form = await screen.findByRole('form', { name: 'Edit localization' })
    fireEvent.change(within(form).getByLabelText('Message text'), {
      target: { value: 'Account settings' },
    })
    fireEvent.click(within(form).getByRole('button', { name: 'Save localization' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(getLocalizationPath(1), {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': 'token',
        },
        body: JSON.stringify({
          messageKey: 'account.title',
          language: 'en',
          messageText: 'Account settings',
          description: 'Account title',
        }),
      })
    })
    expect(screen.getByText('Localization updated.')).toBeInTheDocument()
    expect(await screen.findAllByText('Account settings')).not.toHaveLength(0)
    expect(localizationReads).toBeGreaterThanOrEqual(2)
  })

  it('confirms, deletes, and refreshes rows from the current results', async () => {
    document.cookie = 'XSRF-TOKEN=token'
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    let localizationReads = 0
    const fetchMock = mockAdminLocalizationFetch({
      localizations: () => {
        localizationReads += 1

        return createLocalizationPage({
          content:
            localizationReads === 1
              ? [
                  createLocalizationRow({
                    id: 1,
                    language: 'en',
                    messageText: 'Account',
                  }),
                  createLocalizationRow({
                    id: 2,
                    language: 'pl',
                    messageText: 'Konto',
                  }),
                ]
              : [
                  createLocalizationRow({
                    id: 2,
                    language: 'pl',
                    messageText: 'Konto',
                  }),
                ],
        })
      },
    })

    renderAdminLocalization()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete account.title en' }),
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(getLocalizationPath(1), {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'X-XSRF-TOKEN': 'token',
        },
        body: undefined,
      })
    })
    expect(confirmSpy).toHaveBeenCalledWith('Delete account.title en?')
    expect(screen.getByText('Localization deleted.')).toBeInTheDocument()
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Delete account.title en' }),
      ).not.toBeInTheDocument()
    })
    expect(localizationReads).toBeGreaterThanOrEqual(2)
  })

  it('lets the backend report missing CSRF write failures', async () => {
    const fetchMock = mockAdminLocalizationFetch({
      createLocalizationResponse: Response.json(
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
    })

    renderAdminLocalization(`${ADMIN_LOCALIZATION_ROUTE_PATH}?messageKey=account.title`)

    fireEvent.click(await screen.findByRole('button', { name: 'Add account.title de' }))
    const form = screen.getByRole('form', { name: 'Create localization' })
    fireEvent.change(within(form).getByLabelText('Message text'), {
      target: { value: 'Konto' },
    })
    fireEvent.submit(form)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(LOCALIZATIONS_PATH, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageKey: 'account.title',
          language: 'de',
          messageText: 'Konto',
        }),
      })
    })
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Token CSRF jest wymagany.',
    )
  })

  it('displays localized backend access failures', async () => {
    mockAdminLocalizationFetch({
      localizations: Response.json(
        {
          status: 403,
          messageKey: 'error.localization.access_denied',
          message: 'Nie masz dostepu do tlumaczen.',
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
    })

    const { container } = renderAdminLocalization()

    expect(
      await screen.findByText('Localization rows could not be loaded'),
    ).toBeInTheDocument()
    expect(container.querySelector('.state-block[data-state="error"]')).not.toBeNull()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Nie masz dostepu do tlumaczen.',
    )
    expect(screen.getAllByText('unknown').length).toBeGreaterThan(0)
  })
})

function renderAdminLocalization(
  initialEntry: string = ADMIN_LOCALIZATION_ROUTE_PATH,
  session = createSession(),
) {
  const router = createMemoryRouter(
    [
      {
        path: ADMIN_LOCALIZATION_ROUTE_PATH,
        element: <AdminLocalizationPage session={session} />,
      },
    ],
    {
      initialEntries: [initialEntry],
    },
  )

  return {
    router,
    ...render(<RouterProvider router={router} />),
  }
}

function mockAdminLocalizationFetch({
  account = createAccount(),
  createLocalizationResponse = createLocalizationRow({
    id: 4,
    language: 'de',
    messageText: 'Konto',
  }),
  deleteLocalizationResponse = new Response(null, { status: 204 }),
  localizationById = createLocalizationRow(),
  localizations = createLocalizationPage(),
  updateLocalizationResponse = createLocalizationRow({
    messageText: 'Updated message',
  }),
}: {
  account?: UserAccount | Response
  createLocalizationResponse?: LocalizationResponse | Response
  deleteLocalizationResponse?: Response
  localizationById?:
    | LocalizationResponse
    | Response
    | ((id: number) => LocalizationResponse | Response)
  localizations?: LocalizationPage | Response | ((path: string) => LocalizationPage | Response)
  updateLocalizationResponse?: LocalizationResponse | Response
} = {}) {
  const fetchMock = vi.fn().mockImplementation((
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    const path = String(input)
    const method = init?.method ?? 'GET'

    if (path === ACCOUNT_PATH) {
      return Promise.resolve(toResponse(account))
    }

    if (path === LOCALIZATIONS_PATH && method === 'POST') {
      return Promise.resolve(toResponse(createLocalizationResponse))
    }

    if (path.startsWith(`${LOCALIZATIONS_PATH}/`) && method === 'GET') {
      const id = Number(path.slice(`${LOCALIZATIONS_PATH}/`.length))

      return Promise.resolve(toResponse(resolveValue(localizationById, id)))
    }

    if (path.startsWith(`${LOCALIZATIONS_PATH}/`) && method === 'PUT') {
      return Promise.resolve(toResponse(updateLocalizationResponse))
    }

    if (path.startsWith(`${LOCALIZATIONS_PATH}/`) && method === 'DELETE') {
      return Promise.resolve(deleteLocalizationResponse)
    }

    if (path.startsWith(LOCALIZATIONS_PATH) && method === 'GET') {
      return Promise.resolve(toResponse(resolveValue(localizations, path)))
    }

    return Promise.resolve(new Response(null, { status: 404 }))
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

function createLocalizationPage(
  overrides: LocalizationPage = {},
): LocalizationPage {
  return {
    content: [
      createLocalizationRow({
        id: 1,
        language: 'en',
        messageText: 'Account',
      }),
      createLocalizationRow({
        id: 2,
        language: 'pl',
        messageText: 'Konto',
      }),
    ],
    first: true,
    last: true,
    number: 0,
    numberOfElements: 2,
    size: 20,
    totalElements: 2,
    totalPages: 1,
    ...overrides,
  }
}

function createLocalizationRow(
  overrides: LocalizationResponse = {},
): LocalizationResponse {
  return {
    id: 1,
    messageKey: 'account.title',
    language: 'en',
    messageText: 'Account',
    description: 'Account title',
    createdAt: '2026-06-07T09:00:00Z',
    updatedAt: '2026-06-07T09:00:00Z',
    ...overrides,
  }
}

function createAccount(overrides: UserAccount = {}): UserAccount {
  return {
    id: 42,
    provider: 'github',
    login: 'admin-user',
    displayName: 'Admin User',
    email: 'admin@example.test',
    preferredLanguage: 'en',
    roles: ['USER', 'ADMIN'],
    lastLoginAt: '2026-06-06T22:10:00Z',
    createdAt: '2026-05-11T12:00:00Z',
    updatedAt: '2026-06-06T22:10:00Z',
    ...overrides,
  }
}

function createSession(overrides: SessionResponse = {}): SessionResponse {
  return {
    authenticated: true,
    accountPath: ACCOUNT_PATH,
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

function toResponse(
  value: LocalizationPage | LocalizationResponse | Response | UserAccount,
) {
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
