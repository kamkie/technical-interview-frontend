import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  ACCOUNT_LANGUAGE_PATH,
  ACCOUNT_PATH,
  type UserAccount,
} from '../api/account'
import type { SessionResponse } from '../api/session'
import { formatTimestamp } from '../ui/format'
import { AccountProfile } from './AccountProfile'

describe('AccountProfile', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    clearDocumentCookies()
  })

  it('renders account route context and structured loading state', async () => {
    const fetchMock = vi
      .fn()
      .mockReturnValue(new Promise<Response>(() => undefined))

    vi.stubGlobal('fetch', fetchMock)

    render(<AccountProfile session={createSession()} />)

    expect(
      screen.getByRole('region', { name: 'Account profile' }),
    ).toBeInTheDocument()

    const loadingBlock = screen.getByText('Loading account profile').parentElement
    expect(loadingBlock).not.toBeNull()
    expect(loadingBlock).toHaveAttribute('data-state', 'loading')
    expect(within(loadingBlock as HTMLElement).getByRole('status')).toHaveTextContent(
      'Loading account...',
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(ACCOUNT_PATH, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
        },
      })
    })
  })

  it('renders profile details and updates language through CSRF metadata', async () => {
    document.cookie = 'XSRF-TOKEN=token%201'
    const fetchMock = mockAccountFetch({
      languageResponse: createAccount({
        preferredLanguage: 'de',
        updatedAt: '2026-06-07T10:15:00Z',
      }),
    })

    render(<AccountProfile session={createSession()} />)

    expect(await screen.findByText('Kamil Kiewisz')).toBeInTheDocument()
    expect(screen.getByText('kamil@example.test')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
    // Timestamps render through the shared formatter, never as raw ISO text.
    expect(
      screen.getByText(formatTimestamp('2026-05-11T12:00:00Z')),
    ).toBeInTheDocument()
    expect(screen.queryByText('2026-05-11T12:00:00Z')).not.toBeInTheDocument()
    expect(screen.getAllByText('Polish')[0]).toBeInTheDocument()
    expect(
      screen.getByText(
        'Choose the language used for account and workflow messages.',
      ),
    ).toBeInTheDocument()
    const languageForm = screen.getByRole('form', {
      name: 'Language preference',
    })
    expect(within(languageForm).getByLabelText('Language')).toBeInTheDocument()
    expect(
      within(languageForm).getByRole('button', { name: 'Save language' }),
    ).toBeInTheDocument()
    expect(
      within(languageForm).getByRole('button', { name: 'Clear preference' }),
    ).toBeInTheDocument()

    // All profile fields render without a disclosure step.
    expect(screen.getByText('Login name')).toBeInTheDocument()
    expect(screen.getByText('kamkie')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Language'), {
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
    ).toHaveAttribute('data-state', 'success')
    expect(screen.getByLabelText('Language')).toHaveValue('de')
  })

  it('lists the same option labels and ordering as the topbar language menu', async () => {
    mockAccountFetch()

    render(<AccountProfile session={createSession()} />)

    const select = await screen.findByLabelText('Language')
    const optionLabels = within(select)
      .getAllByRole('option')
      .map((option) => option.textContent)

    // Translated names without code suffixes, in the shared
    // LANGUAGE_OPTIONS order, behind the form-only no-preference entry.
    expect(optionLabels).toEqual([
      'No preference',
      'English',
      'Spanish',
      'German',
      'French',
      'Polish',
      'Ukrainian',
      'Norwegian',
    ])
  })

  it('shows the resolved-language hint only while no preference is set', async () => {
    mockAccountFetch({
      account: createAccount({ preferredLanguage: undefined }),
      languageResponse: createAccount({ preferredLanguage: 'de' }),
    })

    render(<AccountProfile session={createSession()} />)

    // Without a stored preference the form names the language the UI
    // actually resolved (English here, from the test environment defaults).
    expect(
      await screen.findByText(
        'No preference — currently following your browser: English',
      ),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Language'), {
      target: {
        value: 'de',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save language' }))

    await waitFor(() => {
      expect(
        screen.queryByText(
          'No preference — currently following your browser: English',
        ),
      ).not.toBeInTheDocument()
    })
    expect(
      await screen.findByText('Language preference updated.'),
    ).toHaveAttribute('data-state', 'success')
  })

  it('renders localized backend account failures inside the error state', async () => {
    mockAccountFetch({
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
    })

    render(<AccountProfile session={createSession()} />)

    const errorTitle = await screen.findByText('Account profile unavailable')
    const errorBlock = errorTitle.parentElement
    expect(errorBlock).not.toBeNull()
    expect(errorBlock).toHaveAttribute('data-state', 'error')
    expect(within(errorBlock as HTMLElement).getByRole('alert')).toHaveTextContent(
      'Profil konta jest niedostepny.',
    )
  })
})

function mockAccountFetch({
  account = createAccount(),
  languageResponse = createAccount(),
}: {
  account?: UserAccount | Response
  languageResponse?: UserAccount | Response
} = {}) {
  const fetchMock = vi.fn().mockImplementation((
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    const path = String(input)

    if (path === ACCOUNT_LANGUAGE_PATH && init?.method === 'PUT') {
      return Promise.resolve(toResponse(languageResponse))
    }

    if (path === ACCOUNT_PATH) {
      return Promise.resolve(toResponse(account))
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

function toResponse(value: UserAccount | Response) {
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
