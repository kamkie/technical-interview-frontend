import { describe, expect, it, vi } from 'vitest'

import {
  ApiRequestError,
  SESSION_PATH,
  fetchCurrentSession,
  getCsrfHeaders,
  getLoginProviders,
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

describe('session helpers', () => {
  it('returns backend-provided login providers without hard-coded paths', () => {
    const session = createSession({
      loginProviders: [
        {
          registrationId: 'github',
          clientName: 'GitHub',
          authorizationPath: '/api/session/oauth2/authorization/github',
        },
      ],
    })

    expect(getLoginProviders(session)).toEqual(session.loginProviders)
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
