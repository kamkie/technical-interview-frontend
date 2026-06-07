import type { ReactNode } from 'react'

import {
  getLoginProviders,
  type SessionLoginProvider,
  type SessionResponse,
} from '../api/session'

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
        <LoginProviderActions session={state.session} />
      </section>
    )
  }

  return <>{children}</>
}

function LoginProviderActions({ session }: { session: SessionResponse }) {
  const loginProviders = getLoginProviders(session).filter(hasAuthorizationPath)

  if (loginProviders.length === 0) {
    return (
      <p className="session-message muted">No login providers available.</p>
    )
  }

  return (
    <nav className="login-actions" aria-label="Login providers">
      {loginProviders.map((provider) => (
        <a
          className="login-link"
          href={provider.authorizationPath}
          key={provider.registrationId ?? provider.authorizationPath}
        >
          Sign in with {provider.clientName ?? provider.registrationId}
        </a>
      ))}
    </nav>
  )
}

function hasAuthorizationPath(
  provider: SessionLoginProvider,
): provider is SessionLoginProvider & { authorizationPath: string } {
  return Boolean(provider.authorizationPath)
}
