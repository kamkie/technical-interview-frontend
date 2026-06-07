import { describe, expect, it, vi } from 'vitest'

import {
  ApiRequestError,
  SESSION_PATH,
  fetchCurrentSession,
  formatLoginProviderName,
  getAvailableLoginProviders,
  getCsrfHeaders,
  getLoginProviders,
  logoutCurrentSession,
  readCookie,
  type SessionResponse,
} from './session'

describe('fetchCurrentSession', () => {
  it('fetches the same-origin session bootstrap endpoint', async () => {
    const session = createSession()
    const fetchImplementation = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(session), {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 200,
      }),
    )

    await expect(fetchCurrentSession(fetchImplementation)).resolves.toEqual(
      session,
    )

    expect(fetchImplementation).toHaveBeenCalledWith(SESSION_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
  })

  it('raises a typed API error when the session request fails', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 503,
        statusText: 'Service Unavailable',
      }),
    )

    await expect(fetchCurrentSession(fetchImplementation)).rejects.toMatchObject(
      {
        name: 'ApiRequestError',
        path: SESSION_PATH,
        status: 503,
      } satisfies Partial<ApiRequestError>,
    )
  })
})

describe('logoutCurrentSession', () => {
  it('posts to the backend-provided logout path with configured CSRF metadata', async () => {
    const session = createSession({
      authenticated: true,
      logoutPath: '/api/session/logout',
    })
    const fetchImplementation = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 204,
      }),
    )

    await expect(
      logoutCurrentSession(
        session,
        fetchImplementation,
        'language=en; XSRF-TOKEN=token%201',
      ),
    ).resolves.toBeUndefined()

    expect(fetchImplementation).toHaveBeenCalledWith('/api/session/logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'X-XSRF-TOKEN': 'token 1',
      },
    })
  })

  it('does not invent a CSRF header when the readable cookie is missing', async () => {
    const session = createSession({
      authenticated: true,
      logoutPath: '/api/session/logout',
    })
    const fetchImplementation = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 204,
      }),
    )

    await logoutCurrentSession(session, fetchImplementation, 'language=en')

    expect(fetchImplementation).toHaveBeenCalledWith('/api/session/logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
  })

  it('does not send CSRF headers for anonymous idempotent logout', async () => {
    const session = createSession({
      authenticated: false,
      logoutPath: '/api/session/logout',
    })
    const fetchImplementation = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 204,
      }),
    )

    await logoutCurrentSession(session, fetchImplementation, 'XSRF-TOKEN=token')

    expect(fetchImplementation).toHaveBeenCalledWith('/api/session/logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
  })

  it('raises a typed API error with localized backend problem details', async () => {
    const session = createSession({
      authenticated: true,
      logoutPath: '/api/session/logout',
    })
    const fetchImplementation = vi.fn().mockResolvedValue(
      Response.json(
        {
          status: 403,
          messageKey: 'error.csrf.invalid',
          message: 'Token CSRF jest nieprawidlowy.',
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
      logoutCurrentSession(session, fetchImplementation, 'XSRF-TOKEN=stale'),
    ).rejects.toMatchObject({
      name: 'ApiRequestError',
      path: '/api/session/logout',
      status: 403,
      message: 'Token CSRF jest nieprawidlowy.',
    } satisfies Partial<ApiRequestError>)
  })
})

describe('session helpers', () => {
  it('returns backend-provided login providers without hard-coded paths', () => {
    const providers = [
      {
        registrationId: 'github',
        clientName: 'GitHub',
        authorizationPath: '/api/session/from-metadata/primary-provider',
      },
      {
        registrationId: 'smoke',
        clientName: 'Smoke Provider',
        authorizationPath: '/api/session/from-metadata/fake-provider',
      },
    ] satisfies SessionResponse['loginProviders']
    const session = createSession({
      loginProviders: providers,
    })

    expect(getLoginProviders(session)).toEqual(providers)
  })

  it('does not invent login providers when session metadata omits them', () => {
    const session = createSession()

    delete session.loginProviders

    expect(getLoginProviders(session)).toEqual([])
  })

  it('keeps UI login links on backend-provided same-origin API paths', () => {
    const session = createSession({
      loginProviders: [
        {
          registrationId: 'github',
          clientName: 'GitHub',
          authorizationPath: ' /api/session/from-metadata/primary-provider ',
        },
        {
          registrationId: 'external',
          clientName: 'External',
          authorizationPath: 'https://identity.example.test/login',
        },
        {
          registrationId: 'missing-path',
          clientName: 'Missing path',
        },
      ],
    })

    expect(getAvailableLoginProviders(session)).toEqual([
      {
        registrationId: 'github',
        clientName: 'GitHub',
        authorizationPath: '/api/session/from-metadata/primary-provider',
      },
    ])
  })

  it('formats login provider labels from display metadata first', () => {
    expect(
      formatLoginProviderName({
        registrationId: 'raw-provider-id',
        clientName: 'Team SSO',
      }),
    ).toBe('Team SSO')
    expect(formatLoginProviderName({ registrationId: 'github' })).toBe(
      'github',
    )
    expect(formatLoginProviderName({})).toBe('this provider')
  })

  it('mirrors the configured CSRF cookie into the configured header', () => {
    const session = createSession({
      authenticated: true,
      csrf: {
        enabled: true,
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      },
    })

    expect(getCsrfHeaders(session, 'language=en; XSRF-TOKEN=token%201')).toEqual(
      {
        'X-XSRF-TOKEN': 'token 1',
      },
    )
  })

  it('does not send CSRF headers without a real authenticated session', () => {
    const session = createSession({
      authenticated: false,
      csrf: {
        enabled: true,
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      },
    })

    expect(getCsrfHeaders(session, 'XSRF-TOKEN=token')).toEqual({})
  })

  it('reads encoded cookie values while preserving malformed values', () => {
    expect(readCookie('XSRF-TOKEN=abc%20123', 'XSRF-TOKEN')).toBe('abc 123')
    expect(readCookie('broken=%E0%A4%A', 'broken')).toBe('%E0%A4%A')
  })
})

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
