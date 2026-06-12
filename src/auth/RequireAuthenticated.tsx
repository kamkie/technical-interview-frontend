import type { ReactNode } from 'react'

import {
  formatLoginProviderName,
  getAvailableLoginProviders,
  type SessionResponse,
} from '../api/session'
import { useI18n } from '../i18n/useI18n'
import {
  getLoadErrorMessage,
  requestConnectionRecovery,
  usePageConnectionSurface,
} from '../ui/asyncState'

export type SessionState =
  | { status: 'loading' }
  | { status: 'ready'; session: SessionResponse }
  | { status: 'error'; message: string; unreachable?: boolean }

export function RequireAuthenticated({
  children,
  state,
}: {
  children: ReactNode
  state: SessionState
}) {
  const { t } = useI18n()

  // While this guard shows the session error it is the page's connection
  // surface, so the topbar suppresses its duplicate "Connection issue" menu.
  usePageConnectionSurface(state.status === 'error')

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
          {getLoadErrorMessage(t, state) || t('ui.session.bootstrap-failed')}
        </p>
        <button
          className="secondary-button"
          type="button"
          onClick={requestConnectionRecovery}
        >
          {t('ui.common.retry')}
        </button>
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
  const loginProviders = getAvailableLoginProviders(session)

  if (loginProviders.length === 0) {
    return (
      <p className="session-message muted">
        No sign-in options are available for this session.
      </p>
    )
  }

  return (
    <nav className="login-actions" aria-label="Login providers">
      {loginProviders.map((provider, index) => (
        <a
          className="login-link"
          href={provider.authorizationPath}
          key={`${provider.authorizationPath}-${index}`}
        >
          Sign in with {formatLoginProviderName(provider)}
        </a>
      ))}
    </nav>
  )
}
