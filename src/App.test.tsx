import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'
import { SESSION_PATH, type SessionResponse } from './api/session'

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('bootstraps the browser session and renders login providers', async () => {
    const fetchMock = mockSessionFetch(
      createSession({
        loginProviders: [
          {
            registrationId: 'github',
            clientName: 'GitHub',
            authorizationPath: '/api/session/oauth2/authorization/github',
          },
        ],
      }),
    )

    render(<App />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Technical Interview Frontend',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Vite + React + TypeScript')).toBeInTheDocument()

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
    expect(screen.getByText('Signed out')).toBeInTheDocument()
    expect(screen.getByText('XSRF-TOKEN -> X-XSRF-TOKEN')).toBeInTheDocument()
    expect(loginLink).toHaveAttribute(
      'href',
      '/api/session/oauth2/authorization/github',
    )
  })

  it('renders session bootstrap failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 503,
          statusText: 'Service Unavailable',
        }),
      ),
    )

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'GET /api/session failed with 503 Service Unavailable',
    )
  })
})

function mockSessionFetch(session: SessionResponse) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(session), {
      headers: {
        'Content-Type': 'application/json',
      },
      status: 200,
    }),
  )

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
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
