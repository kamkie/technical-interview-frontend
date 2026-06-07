import { useCallback, useEffect, useState } from 'react'
import {
  matchPath,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'

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
  ADMIN_USER_DETAIL_ROUTE_PATH,
  ADMIN_USERS_ROUTE_PATH,
  AdminUsersPage,
} from './admin/AdminUsersPage'
import {
  RequireAuthenticated,
  type SessionState,
} from './auth/RequireAuthenticated'
import { CatalogPanel } from './catalog/CatalogPanel'
import { CATALOG_ROUTE_PATH } from './catalog/catalogQuery'
import { OPERATOR_ROUTE_PATH, OperatorPage } from './operator/OperatorPage'
import { getDisplayMessage } from './ui/asyncState'
import {
  THEME_PREFERENCES,
  useThemePreference,
  type ThemePreference,
} from './ui/theme'

const ACCOUNT_ROUTE_PATH = '/account'

type RouteContext = {
  area: string
  description: string
  path: string
  title: string
}

const CATALOG_ROUTE_CONTEXT: RouteContext = {
  area: 'Public catalog',
  description:
    'Search the approved collection and review catalog availability.',
  path: CATALOG_ROUTE_PATH,
  title: 'Book catalog',
}

const ROUTE_CONTEXTS: readonly RouteContext[] = [
  CATALOG_ROUTE_CONTEXT,
  {
    area: 'Account',
    description:
      'Review the current profile and manage account preferences for this session.',
    path: ACCOUNT_ROUTE_PATH,
    title: 'Account settings',
  },
  {
    area: 'Admin',
    description:
      'Manage book records and categories through backend-authorized catalog tools.',
    path: ADMIN_CATALOG_ROUTE_PATH,
    title: 'Catalog administration',
  },
  {
    area: 'Admin',
    description:
      'Maintain localized messages without treating translated text as program logic.',
    path: ADMIN_LOCALIZATION_ROUTE_PATH,
    title: 'Localization administration',
  },
  {
    area: 'Admin',
    description:
      'Review application users and role-grant provenance through admin workflows.',
    path: ADMIN_USERS_ROUTE_PATH,
    title: 'User administration',
  },
  {
    area: 'Admin',
    description:
      'Review application users and role-grant provenance through admin workflows.',
    path: ADMIN_USER_DETAIL_ROUTE_PATH,
    title: 'User administration',
  },
  {
    area: 'Operations',
    description:
      'Inspect operator-facing health and audit evidence without making diagnostics the primary workflow.',
    path: OPERATOR_ROUTE_PATH,
    title: 'Operations console',
  },
]

const THEME_LABELS: Record<ThemePreference, string> = {
  dark: 'Dark',
  light: 'Light',
  system: 'System',
}

type LogoutState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string }

export function App() {
  const { refreshSession, sessionState } = useSessionBootstrap()
  const routeContext = useRouteContext()
  const { preference, resolvedTheme, setPreference } = useThemePreference()
  const [logoutState, setLogoutState] = useState<LogoutState>({
    status: 'idle',
  })
  const authenticated =
    sessionState.status === 'ready' &&
    sessionState.session.authenticated === true

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
              LC
            </span>
            <span className="brand-name">Library Console</span>
          </div>
          <ShellNavigation authenticated={authenticated} />
        </div>
        <div className="topbar-actions">
          <ThemePreferenceControl
            preference={preference}
            resolvedTheme={resolvedTheme}
            onPreferenceChange={setPreference}
          />
          <SessionAccountMenu
            logoutState={logoutState}
            state={sessionState}
            onLogout={handleLogout}
          />
        </div>
      </header>

      <main className="workspace">
        <RouteContextHeader context={routeContext} />

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
            path={ADMIN_USERS_ROUTE_PATH}
            element={
              <RequireAuthenticated state={sessionState}>
                {sessionState.status === 'ready' && (
                  <AdminUsersPage session={sessionState.session} />
                )}
              </RequireAuthenticated>
            }
          />
          <Route
            path={ADMIN_USER_DETAIL_ROUTE_PATH}
            element={
              <RequireAuthenticated state={sessionState}>
                {sessionState.status === 'ready' && (
                  <AdminUsersPage session={sessionState.session} />
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

function ShellNavigation({ authenticated }: { authenticated: boolean }) {
  return (
    <nav className="shell-navigation" aria-label="Primary navigation">
      <div className="nav-section" aria-label="Catalog workflow">
        <span className="nav-section-label">Catalog</span>
        <NavLink to={CATALOG_ROUTE_PATH}>Catalog</NavLink>
      </div>
      {authenticated && (
        <div className="nav-section" aria-label="Account and operations workflows">
          <span className="nav-section-label">Workspace</span>
          <NavLink to={ACCOUNT_ROUTE_PATH}>Account</NavLink>
          <NavLink to={OPERATOR_ROUTE_PATH}>Operations</NavLink>
        </div>
      )}
      {authenticated && <AdminMenu />}
    </nav>
  )
}

function AdminMenu() {
  const [open, setOpen] = useState(false)
  const panelId = 'admin-menu-panel'

  return (
    <div className="nav-section nav-section-admin" aria-label="Admin workflows">
      <span className="nav-section-label">Admin</span>
      <div className="nav-menu">
        <button
          aria-controls={panelId}
          aria-expanded={open}
          className="nav-menu-button"
          id="admin-menu-trigger"
          type="button"
          onClick={() => setOpen((current) => !current)}
        >
          Admin
        </button>
        {open && (
          <nav
            aria-labelledby="admin-menu-trigger"
            className="nav-menu-panel"
            id={panelId}
          >
            <NavLink to={ADMIN_CATALOG_ROUTE_PATH}>Catalog admin</NavLink>
            <NavLink to={ADMIN_LOCALIZATION_ROUTE_PATH}>Localizations</NavLink>
            <NavLink to={ADMIN_USERS_ROUTE_PATH}>Users</NavLink>
          </nav>
        )}
      </div>
    </div>
  )
}

function RouteContextHeader({ context }: { context: RouteContext }) {
  return (
    <section className="route-context intro" aria-labelledby="page-title">
      <p className="eyebrow">{context.area}</p>
      <h1 id="page-title">{context.title}</h1>
      <p className="lede">{context.description}</p>
    </section>
  )
}

function ThemePreferenceControl({
  onPreferenceChange,
  preference,
  resolvedTheme,
}: {
  onPreferenceChange: (preference: ThemePreference) => void
  preference: ThemePreference
  resolvedTheme: 'dark' | 'light'
}) {
  return (
    <div
      className="theme-control"
      role="radiogroup"
      aria-label={`Theme preference, currently ${THEME_LABELS[preference]} using ${resolvedTheme} mode`}
    >
      {THEME_PREFERENCES.map((option) => (
        <label className="theme-option" key={option}>
          <input
            type="radio"
            name="theme-preference"
            value={option}
            checked={preference === option}
            onChange={() => onPreferenceChange(option)}
          />
          <span>{THEME_LABELS[option]}</span>
        </label>
      ))}
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

function SessionAccountMenu({
  logoutState,
  onLogout,
  state,
}: {
  logoutState: LogoutState
  onLogout: (session: SessionResponse) => void
  state: SessionState
}) {
  const [open, setOpen] = useState(false)
  const panelId = 'account-menu-panel'
  const detailsId = 'connection-details-panel'
  const [showDetails, setShowDetails] = useState(false)

  if (state.status === 'loading') {
    return (
      <div className="header-session" aria-label="Session status">
        <span className="header-session-text" role="status">
          Checking sign-in...
        </span>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="account-menu">
        <button
          aria-controls={panelId}
          aria-expanded={open}
          className="account-menu-button"
          id="account-menu-trigger"
          type="button"
          onClick={() => setOpen((current) => !current)}
        >
          Connection issue
        </button>
        {open && (
          <div
            aria-label="Connection menu"
            className="account-menu-panel"
            id={panelId}
            role="region"
          >
            <SessionBootstrapPanel state={state} />
          </div>
        )}
      </div>
    )
  }

  if (state.session.authenticated !== true) {
    return (
      <div className="account-menu">
        <button
          aria-controls={panelId}
          aria-expanded={open}
          className="account-menu-button"
          id="account-menu-trigger"
          type="button"
          onClick={() => setOpen((current) => !current)}
        >
          Sign in
        </button>
        {open && (
          <div
            aria-label="Sign in options"
            className="account-menu-panel"
            id={panelId}
            role="region"
          >
            <SessionLoginActions session={state.session} />
            <SessionStatusSummary session={state.session} />
            <button
              aria-controls={detailsId}
              aria-expanded={showDetails}
              className="connection-details-button"
              type="button"
              onClick={() => setShowDetails((current) => !current)}
            >
              Connection details
            </button>
            {showDetails && (
              <div id={detailsId}>
                <SessionDetails session={state.session} showStatus={false} />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const submitting = logoutState.status === 'submitting'

  return (
    <div className="account-menu">
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="account-menu-button signed-in"
        id="account-menu-trigger"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        Account
      </button>
      {open && (
        <div
          aria-label="Account menu"
          className="account-menu-panel"
          id={panelId}
          role="region"
        >
          <div className="account-menu-actions">
            <NavLink className="account-menu-link" to={ACCOUNT_ROUTE_PATH}>
              Account settings
            </NavLink>
            <button
              className="logout-button"
              type="button"
              disabled={submitting || !state.session.logoutPath}
              onClick={() => onLogout(state.session)}
            >
              {submitting ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
          {logoutState.status === 'error' && (
            <p className="session-message error" role="alert">
              {logoutState.message}
            </p>
          )}
          <button
            aria-controls={detailsId}
            aria-expanded={showDetails}
            className="connection-details-button"
            type="button"
            onClick={() => setShowDetails((current) => !current)}
          >
            Connection details
          </button>
          {showDetails && (
            <div id={detailsId}>
              <SessionDetails session={state.session} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function useRouteContext() {
  const { pathname } = useLocation()

  return (
    ROUTE_CONTEXTS.find((context) =>
      matchPath({ path: context.path, end: true }, pathname),
    ) ?? CATALOG_ROUTE_CONTEXT
  )
}

function SessionBootstrapPanel({ state }: { state: SessionState }) {
  return (
    <section className="session-panel" aria-labelledby="session-title">
      <div className="section-heading">
        <p className="eyebrow">Connection</p>
        <h2 id="session-title">Connection details</h2>
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

function SessionDetails({
  session,
  showStatus = true,
}: {
  session: SessionResponse
  showStatus?: boolean
}) {
  const csrf = session.csrf
  const csrfLabel =
    csrf?.enabled === true
      ? `${csrf.cookieName ?? 'CSRF cookie'} -> ${csrf.headerName ?? 'CSRF header'}`
      : 'Disabled'

  return (
    <div className="session-details">
      {showStatus && <SessionStatusSummary session={session} />}

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
    </div>
  )
}

function SessionLoginActions({ session }: { session: SessionResponse }) {
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

function SessionStatusSummary({ session }: { session: SessionResponse }) {
  const statusLabel =
    session.authenticated === true ? 'Signed in' : 'Signed out'

  return (
    <div className="session-summary">
      <span
        className={`status-pill ${
          session.authenticated === true ? 'authenticated' : 'anonymous'
        }`}
      >
        {statusLabel}
      </span>
    </div>
  )
}

function hasAuthorizationPath(
  provider: SessionLoginProvider,
): provider is SessionLoginProvider & { authorizationPath: string } {
  return Boolean(provider.authorizationPath)
}

export default App
