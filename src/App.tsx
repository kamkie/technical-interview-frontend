import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'

import {
  fetchCurrentSession,
  getLoginProviders,
  type SessionLoginProvider,
  type SessionResponse,
} from './api/session'
import { CatalogPanel } from './catalog/CatalogPanel'
import { CATALOG_ROUTE_PATH } from './catalog/catalogQuery'

type SessionState =
  | { status: 'loading' }
  | { status: 'ready'; session: SessionResponse }
  | { status: 'error'; message: string }

export function App() {
  const sessionState = useSessionBootstrap()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            TI
          </span>
          <span className="brand-name">Technical Interview Frontend</span>
        </div>
        <nav className="topnav" aria-label="Primary navigation">
          <NavLink to={CATALOG_ROUTE_PATH}>Catalog</NavLink>
        </nav>
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
          <Route path="*" element={<Navigate to={CATALOG_ROUTE_PATH} replace />} />
        </Routes>
      </main>
    </div>
  )
}

function useSessionBootstrap(): SessionState {
  const [state, setState] = useState<SessionState>({ status: 'loading' })

  useEffect(() => {
    let ignore = false

    fetchCurrentSession()
      .then((session) => {
        if (!ignore) {
          setState({ status: 'ready', session })
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setState({
            status: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Session bootstrap failed',
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  return state
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
  const statusLabel = session.authenticated ? 'Signed in' : 'Signed out'
  const csrfLabel =
    csrf?.enabled === true
      ? `${csrf.cookieName ?? 'CSRF cookie'} -> ${csrf.headerName ?? 'CSRF header'}`
      : 'Disabled'

  return (
    <div className="session-details">
      <div className="session-summary">
        <span
          className={`status-pill ${
            session.authenticated ? 'authenticated' : 'anonymous'
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <dl className="session-metadata">
        <div>
          <dt>Account</dt>
          <dd>{session.authenticated ? session.accountPath ?? 'Unavailable' : 'None'}</dd>
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

      {!session.authenticated && loginProviders.length > 0 && (
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

      {!session.authenticated && loginProviders.length === 0 && (
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

export default App
