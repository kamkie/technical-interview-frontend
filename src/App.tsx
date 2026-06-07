import { useCallback, useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'

import {
  fetchCurrentSession,
  getLoginProviders,
  logoutCurrentSession,
  type SessionLoginProvider,
  type SessionResponse,
} from './api/session'
import { AccountProfile } from './account/AccountProfile'
import {
  ADMIN_CATALOG_ROUTE_PATH,
  AdminCatalogPage,
} from './admin/AdminCatalogPage'
import {
  ADMIN_LOCALIZATION_ROUTE_PATH,
  AdminLocalizationPage,
} from './admin/AdminLocalizationPage'
import {
  RequireAuthenticated,
  type SessionState,
} from './auth/RequireAuthenticated'
import { CatalogPanel } from './catalog/CatalogPanel'
import { CATALOG_ROUTE_PATH } from './catalog/catalogQuery'
import { OPERATOR_ROUTE_PATH, OperatorPage } from './operator/OperatorPage'

const ACCOUNT_ROUTE_PATH = '/account'

type LogoutState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string }

export function App() {
  const { refreshSession, sessionState } = useSessionBootstrap()
  const [logoutState, setLogoutState] = useState<LogoutState>({
    status: 'idle',
  })

  async function handleLogout(session: SessionResponse) {
    setLogoutState({ status: 'submitting' })

    try {
      await logoutCurrentSession(session)
      await refreshSession()
      setLogoutState({ status: 'idle' })
    } catch (error: unknown) {
      setLogoutState({
        status: 'error',
        message: getDisplayMessage(error, 'Logout failed.'),
      })
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-primary">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">
              TI
            </span>
            <span className="brand-name">Technical Interview Frontend</span>
          </div>
          <nav className="topnav" aria-label="Primary navigation">
            <NavLink to={CATALOG_ROUTE_PATH}>Catalog</NavLink>
            {sessionState.status === 'ready' &&
              sessionState.session.authenticated === true && (
                <>
                  <NavLink to={ADMIN_CATALOG_ROUTE_PATH}>Admin catalog</NavLink>
                  <NavLink to={ADMIN_LOCALIZATION_ROUTE_PATH}>
                    Admin localizations
                  </NavLink>
                  <NavLink to={OPERATOR_ROUTE_PATH}>Operator</NavLink>
                  <NavLink to={ACCOUNT_ROUTE_PATH}>Account</NavLink>
                </>
              )}
          </nav>
        </div>
        <SessionHeader
          logoutState={logoutState}
          state={sessionState}
          onLogout={handleLogout}
        />
      </header>

      <main className="workspace">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">First-party browser UI</p>
          <h1 id="page-title">Technical Interview Frontend</h1>
          <p className="lede">
            Contract-first React app for the technical-interview-demo backend.
          </p>
        </section>

        <SessionBootstrapPanel state={sessionState} />
        <Routes>
          <Route index element={<Navigate to={CATALOG_ROUTE_PATH} replace />} />
          <Route path={CATALOG_ROUTE_PATH} element={<CatalogPanel />} />
          <Route
            path={ACCOUNT_ROUTE_PATH}
            element={
              <RequireAuthenticated state={sessionState}>
                {sessionState.status === 'ready' && (
                  <AccountProfile session={sessionState.session} />
                )}
              </RequireAuthenticated>
            }
          />
          <Route
            path={ADMIN_CATALOG_ROUTE_PATH}
            element={
              <RequireAuthenticated state={sessionState}>
                {sessionState.status === 'ready' && (
                  <AdminCatalogPage session={sessionState.session} />
                )}
              </RequireAuthenticated>
            }
          />
          <Route
            path={ADMIN_LOCALIZATION_ROUTE_PATH}
            element={
              <RequireAuthenticated state={sessionState}>
                {sessionState.status === 'ready' && (
                  <AdminLocalizationPage session={sessionState.session} />
                )}
              </RequireAuthenticated>
            }
          />
          <Route
            path={OPERATOR_ROUTE_PATH}
            element={
              <RequireAuthenticated state={sessionState}>
                {sessionState.status === 'ready' && (
                  <OperatorPage session={sessionState.session} />
                )}
              </RequireAuthenticated>
            }
          />
          <Route path="*" element={<Navigate to={CATALOG_ROUTE_PATH} replace />} />
        </Routes>
      </main>
    </div>
  )
}

function useSessionBootstrap() {
  const [sessionState, setSessionState] = useState<SessionState>({
    status: 'loading',
  })

  const refreshSession = useCallback(async () => {
    setSessionState({ status: 'loading' })

    try {
      const session = await fetchCurrentSession()
      setSessionState({ status: 'ready', session })
    } catch (error: unknown) {
      setSessionState({
        status: 'error',
        message: getDisplayMessage(error, 'Session bootstrap failed.'),
      })
    }
  }, [])

  useEffect(() => {
    let ignore = false

    fetchCurrentSession()
      .then((session) => {
        if (!ignore) {
          setSessionState({ status: 'ready', session })
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setSessionState({
            status: 'error',
            message: getDisplayMessage(error, 'Session bootstrap failed.'),
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  return { refreshSession, sessionState }
}

function SessionHeader({
  logoutState,
  onLogout,
  state,
}: {
  logoutState: LogoutState
  onLogout: (session: SessionResponse) => void
  state: SessionState
}) {
  if (state.status === 'loading') {
    return (
      <div className="header-session" aria-label="Session status">
        <span className="header-session-text" role="status">
          Checking session...
        </span>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="header-session" aria-label="Session status">
        <span className="header-session-text error">Session unavailable</span>
      </div>
    )
  }

  if (state.session.authenticated !== true) {
    return (
      <div className="header-session" aria-label="Session status">
        <span className="status-pill anonymous">Signed out</span>
      </div>
    )
  }

  const submitting = logoutState.status === 'submitting'

  return (
    <div className="header-session" aria-label="Session status">
      <span className="status-pill authenticated">Signed in</span>
      <button
        className="logout-button"
        type="button"
        disabled={submitting || !state.session.logoutPath}
        onClick={() => onLogout(state.session)}
      >
        {submitting ? 'Signing out...' : 'Sign out'}
      </button>
      {logoutState.status === 'error' && (
        <span className="header-session-text error" role="alert">
          {logoutState.message}
        </span>
      )}
    </div>
  )
}

function SessionBootstrapPanel({ state }: { state: SessionState }) {
  return (
    <section className="session-panel" aria-labelledby="session-title">
      <div className="section-heading">
        <p className="eyebrow">Browser session</p>
        <h2 id="session-title">Session</h2>
      </div>

      {state.status === 'loading' && (
        <p className="session-message" role="status">
          Loading session...
        </p>
      )}

      {state.status === 'error' && (
        <p className="session-message error" role="alert">
          {state.message}
        </p>
      )}

      {state.status === 'ready' && <SessionDetails session={state.session} />}
    </section>
  )
}

function SessionDetails({ session }: { session: SessionResponse }) {
  const loginProviders = getLoginProviders(session).filter(hasAuthorizationPath)
  const csrf = session.csrf
  const statusLabel =
    session.authenticated === true ? 'Signed in' : 'Signed out'
  const csrfLabel =
    csrf?.enabled === true
      ? `${csrf.cookieName ?? 'CSRF cookie'} -> ${csrf.headerName ?? 'CSRF header'}`
      : 'Disabled'

  return (
    <div className="session-details">
      <div className="session-summary">
        <span
          className={`status-pill ${
            session.authenticated === true ? 'authenticated' : 'anonymous'
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <dl className="session-metadata">
        <div>
          <dt>Account</dt>
          <dd>
            {session.authenticated === true
              ? session.accountPath ?? 'Unavailable'
              : 'None'}
          </dd>
        </div>
        <div>
          <dt>Logout</dt>
          <dd>{session.logoutPath ?? 'Unavailable'}</dd>
        </div>
        <div>
          <dt>Session cookie</dt>
          <dd>{session.sessionCookie?.name ?? 'Unavailable'}</dd>
        </div>
        <div>
          <dt>CSRF</dt>
          <dd>{csrfLabel}</dd>
        </div>
      </dl>

      {session.authenticated !== true && loginProviders.length > 0 && (
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
      )}

      {session.authenticated !== true && loginProviders.length === 0 && (
        <p className="session-message muted">No login providers available.</p>
      )}
    </div>
  )
}

function hasAuthorizationPath(
  provider: SessionLoginProvider,
): provider is SessionLoginProvider & { authorizationPath: string } {
  return Boolean(provider.authorizationPath)
}

function getDisplayMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default App
