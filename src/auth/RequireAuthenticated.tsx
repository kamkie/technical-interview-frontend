import type { ReactNode } from 'react'

import type { SessionResponse } from '../api/session'

export type SessionState =
  | { status: 'loading' }
  | { status: 'ready'; session: SessionResponse }
  | { status: 'error'; message: string }

export function RequireAuthenticated({
  children,
  state,
}: {
  children: ReactNode
  state: SessionState
}) {
  if (state.status === 'loading') {
    return (
      <section className="auth-guard" aria-labelledby="auth-guard-title">
        <h2 id="auth-guard-title">Checking authentication</h2>
        <p className="session-message" role="status">
          Loading session...
        </p>
      </section>
    )
  }

  if (state.status === 'error') {
    return (
      <section className="auth-guard" aria-labelledby="auth-guard-title">
        <h2 id="auth-guard-title">Session unavailable</h2>
        <p className="session-message error" role="alert">
          {state.message}
        </p>
      </section>
    )
  }

  if (state.session.authenticated !== true) {
    return (
      <section className="auth-guard" aria-labelledby="auth-guard-title">
        <h2 id="auth-guard-title">Sign in required</h2>
        <p className="session-message">
          Use an available login provider to access this area.
        </p>
      </section>
    )
  }

  return <>{children}</>
}
