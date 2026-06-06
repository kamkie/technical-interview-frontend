import { describe, expect, it, vi } from 'vitest'

import {
  ACCOUNT_LANGUAGE_PATH,
  ACCOUNT_PATH,
  fetchCurrentAccount,
  getAccountPath,
  updateAccountLanguage,
  type UserAccount,
} from './account'
import type { SessionResponse } from './session'

describe('fetchCurrentAccount', () => {
  it('fetches the session-provided same-origin account endpoint', async () => {
    const account = createAccount()
    const fetchImplementation = vi.fn().mockResolvedValue(Response.json(account))
    const session = createSession({
      authenticated: true,
      accountPath: ACCOUNT_PATH,
    })

    await expect(
      fetchCurrentAccount(session, fetchImplementation),
    ).resolves.toEqual(account)

    expect(fetchImplementation).toHaveBeenCalledWith(ACCOUNT_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
  })

  it('falls back to the imported OpenAPI account path when metadata is absent', async () => {
    const account = createAccount()
    const fetchImplementation = vi.fn().mockResolvedValue(Response.json(account))

    await fetchCurrentAccount(
      createSession({
        authenticated: true,
        accountPath: undefined,
      }),
      fetchImplementation,
    )

    expect(fetchImplementation).toHaveBeenCalledWith(
      ACCOUNT_PATH,
      expect.objectContaining({
        credentials: 'same-origin',
        method: 'GET',
      }),
    )
  })

  it('does not fetch account data for anonymous sessions', async () => {
    const fetchImplementation = vi.fn()

    await expect(
      fetchCurrentAccount(createSession(), fetchImplementation),
    ).rejects.toThrow('Account profile requires an authenticated session.')
    expect(fetchImplementation).not.toHaveBeenCalled()
  })

  it('rejects non-api account metadata paths', () => {
    expect(() =>
      getAccountPath(
        createSession({
          authenticated: true,
          accountPath: '/account',
        }),
      ),
    ).toThrow('Account profile endpoint is unavailable.')
  })

  it('surfaces localized backend account errors', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      Response.json(
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
    )

    await expect(
      fetchCurrentAccount(
        createSession({
          authenticated: true,
        }),
        fetchImplementation,
      ),
    ).rejects.toThrow('Profil konta jest niedostepny.')
  })
})

describe('updateAccountLanguage', () => {
  it('puts the preferred language with configured CSRF metadata', async () => {
    const account = createAccount({
      preferredLanguage: 'de',
    })
    const fetchImplementation = vi.fn().mockResolvedValue(Response.json(account))
    const session = createSession({
      authenticated: true,
    })

    await expect(
      updateAccountLanguage(
        session,
        'de',
        fetchImplementation,
        'language=en; XSRF-TOKEN=token%201',
      ),
    ).resolves.toEqual(account)

    expect(fetchImplementation).toHaveBeenCalledWith(ACCOUNT_LANGUAGE_PATH, {
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

  it('uses a blank preferred language body when clearing the preference', async () => {
    const account = createAccount({
      preferredLanguage: undefined,
    })
    const fetchImplementation = vi.fn().mockResolvedValue(Response.json(account))

    await expect(
      updateAccountLanguage(
        createSession({
          authenticated: true,
        }),
        '',
        fetchImplementation,
        'XSRF-TOKEN=token',
      ),
    ).resolves.toEqual(account)

    expect(fetchImplementation).toHaveBeenCalledWith(
      ACCOUNT_LANGUAGE_PATH,
      expect.objectContaining({
        body: JSON.stringify({
          preferredLanguage: '',
        }),
      }),
    )
  })

  it('does not fetch account language updates for anonymous sessions', async () => {
    const fetchImplementation = vi.fn()

    await expect(
      updateAccountLanguage(createSession(), 'pl', fetchImplementation),
    ).rejects.toThrow(
      'Account language preference requires an authenticated session.',
    )
    expect(fetchImplementation).not.toHaveBeenCalled()
  })

  it('does not invent a CSRF header when the readable cookie is missing', async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(Response.json(createAccount()))

    await updateAccountLanguage(
      createSession({
        authenticated: true,
      }),
      'fr',
      fetchImplementation,
      'language=en',
    )

    expect(fetchImplementation).toHaveBeenCalledWith(ACCOUNT_LANGUAGE_PATH, {
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

  it('surfaces localized backend language validation errors', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      Response.json(
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
    )

    await expect(
      updateAccountLanguage(
        createSession({
          authenticated: true,
        }),
        'zz',
        fetchImplementation,
        'XSRF-TOKEN=token',
      ),
    ).rejects.toThrow('Kod jezyka jest nieprawidlowy.')
  })
})

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
    authenticated: false,
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
