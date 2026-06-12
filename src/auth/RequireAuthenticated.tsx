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
        <h2 id="auth-guard-title">{t('ui.session.guard-checking-title')}</h2>
        <p className="session-message" role="status">
          {t('ui.session.loading')}
        </p>
      </section>
    )
  }

  if (state.status === 'error') {
    return (
      <section className="auth-guard" aria-labelledby="auth-guard-title">
        <h2 id="auth-guard-title">{t('ui.session.guard-unavailable-title')}</h2>
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
        <h2 id="auth-guard-title">{t('ui.session.guard-sign-in-title')}</h2>
        <p className="session-message">{t('ui.session.guard-sign-in-hint')}</p>
        <LoginProviderActions session={state.session} />
      </section>
    )
  }

  return <>{children}</>
}

function LoginProviderActions({ session }: { session: SessionResponse }) {
  const { t } = useI18n()
  const loginProviders = getAvailableLoginProviders(session)

  if (loginProviders.length === 0) {
    return (
      <p className="session-message muted">{t('ui.session.no-providers')}</p>
    )
  }

  return (
    <nav className="login-actions" aria-label={t('ui.session.login-providers-label')}>
      {loginProviders.map((provider, index) => (
        <a
          className="login-link"
          href={provider.authorizationPath}
          key={`${provider.authorizationPath}-${index}`}
        >
          {t('ui.session.sign-in-with', {
            provider: formatLoginProviderName(provider),
          })}
        </a>
      ))}
    </nav>
  )
}
