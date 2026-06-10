import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react'
import {
  matchPath,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from 'react-router-dom'

import {
  publishAccountUpdate,
  useCurrentAccount,
} from './account/useCurrentAccount'
import { LANGUAGE_OPTIONS } from './account/languageOptions'
import { updateAccountLanguage } from './api/account'
import {
  fetchCurrentSession,
  formatLoginProviderName,
  getAvailableLoginProviders,
  logoutCurrentSession,
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
import { hasAdminRole } from './auth/roles'
import { CatalogPanel } from './catalog/CatalogPanel'
import { CATALOG_ROUTE_PATH } from './catalog/catalogQuery'
import {
  OPERATOR_DIAGNOSTICS_ROUTE_PATH,
  OperatorDiagnosticsPage,
} from './operator/OperatorDiagnosticsPage'
import { OPERATOR_ROUTE_PATH, OperatorPage } from './operator/OperatorPage'
import { getDisplayMessage, type MutationState } from './ui/asyncState'
import {
  FlagDe,
  FlagEn,
  FlagEs,
  FlagFr,
  FlagNo,
  FlagPl,
  FlagUk,
  type FlagProps,
} from './ui/flags'
import {
  IconBookOpen,
  IconChevronDown,
  IconGlobe,
  IconMonitor,
  IconMoon,
  IconSun,
} from './ui/icons'
import {
  THEME_PREFERENCES,
  useThemePreference,
  type ThemePreference,
} from './ui/theme'

const ACCOUNT_ROUTE_PATH = '/account'

const LANGUAGE_FLAGS: Record<string, (props: FlagProps) => ReactElement> = {
  de: FlagDe,
  en: FlagEn,
  es: FlagEs,
  fr: FlagFr,
  no: FlagNo,
  pl: FlagPl,
  uk: FlagUk,
}

type RouteContext = {
  area: string
  // Dewey classification for the area, typed on the route card's call number.
  code: string
  description: string
  path: string
  title: string
}

const CATALOG_ROUTE_CONTEXT: RouteContext = {
  area: 'Public catalog',
  code: '028',
  description:
    'Search the approved collection and review catalog availability.',
  path: CATALOG_ROUTE_PATH,
  title: 'Book catalog',
}

const ROUTE_CONTEXTS: readonly RouteContext[] = [
  CATALOG_ROUTE_CONTEXT,
  {
    area: 'Account',
    code: '025.6',
    description:
      'Review the current profile and manage account preferences for this session.',
    path: ACCOUNT_ROUTE_PATH,
    title: 'Account settings',
  },
  {
    area: 'Admin',
    code: '025.3',
    description:
      'Manage book records and categories through backend-authorized catalog tools.',
    path: ADMIN_CATALOG_ROUTE_PATH,
    title: 'Catalog administration',
  },
  {
    area: 'Admin',
    code: '418',
    description:
      'Maintain localized messages without treating translated text as program logic.',
    path: ADMIN_LOCALIZATION_ROUTE_PATH,
    title: 'Localization administration',
  },
  {
    area: 'Admin',
    code: '023',
    description:
      'Review application users and role-grant provenance through admin workflows.',
    path: ADMIN_USERS_ROUTE_PATH,
    title: 'User administration',
  },
  {
    area: 'Admin',
    code: '023',
    description:
      'Review application users and role-grant provenance through admin workflows.',
    path: ADMIN_USER_DETAIL_ROUTE_PATH,
    title: 'User administration',
  },
  {
    area: 'Operations',
    code: '025.1',
    description:
      'Review operator audit evidence with URL-backed filters, pagination, and read-only details.',
    path: OPERATOR_ROUTE_PATH,
    title: 'Operations console',
  },
  {
    area: 'Operations',
    code: '004.2',
    description:
      'Review build, runtime, and health evidence for support escalations.',
    path: OPERATOR_DIAGNOSTICS_ROUTE_PATH,
    title: 'System diagnostics',
  },
]

const THEME_LABELS: Record<ThemePreference, string> = {
  dark: 'Dark',
  light: 'Light',
  system: 'System',
}

const THEME_ICONS: Record<ThemePreference, typeof IconSun> = {
  dark: IconMoon,
  light: IconSun,
  system: IconMonitor,
}

type LogoutState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string }

function useDismissibleMenu() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      const container = containerRef.current

      if (
        container &&
        event.target instanceof Node &&
        !container.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      const container = containerRef.current
      const focusInsideMenu =
        container !== null &&
        ((event.target instanceof Node && container.contains(event.target)) ||
          container.contains(document.activeElement))

      if (!focusInsideMenu) {
        return
      }

      setOpen(false)
      container.querySelector<HTMLElement>('[aria-expanded]')?.focus()
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return { containerRef, open, setOpen }
}

export function App() {
  const { refreshSession, sessionState } = useSessionBootstrap()
  const isAdmin = useAdminVisibility(sessionState)
  const routeContext = useRouteContext()
  useRouteFocusReset()
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
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="topbar">
        <div className="topbar-primary">
          <Link className="brand-lockup" to={CATALOG_ROUTE_PATH}>
            <span className="brand-mark" aria-hidden="true">
              <IconBookOpen height={18} width={18} />
            </span>
            <span className="brand-name">Library Console</span>
          </Link>
          <ShellNavigation authenticated={authenticated} isAdmin={isAdmin} />
        </div>
        <div className="topbar-actions">
          {authenticated && sessionState.status === 'ready' && (
            <QuickLanguageMenu session={sessionState.session} />
          )}
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

      <main className="workspace" id="main-content" tabIndex={-1}>
        <RouteContextHeader key={routeContext.path} context={routeContext} />

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
          <Route
            path={OPERATOR_DIAGNOSTICS_ROUTE_PATH}
            element={
              <RequireAuthenticated state={sessionState}>
                {sessionState.status === 'ready' && (
                  <OperatorDiagnosticsPage session={sessionState.session} />
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

function ShellNavigation({
  authenticated,
  isAdmin,
}: {
  authenticated: boolean
  isAdmin: boolean
}) {
  return (
    <nav className="shell-navigation" aria-label="Primary navigation">
      <NavLink to={CATALOG_ROUTE_PATH}>Catalog</NavLink>
      {authenticated && isAdmin && <AdminMenu />}
    </nav>
  )
}

function useAdminVisibility(sessionState: SessionState) {
  const session =
    sessionState.status === 'ready' && sessionState.session.authenticated === true
      ? sessionState.session
      : null
  // The pathname refresh key retries a failed account load on the next route
  // change, so one transient failure cannot hide admin navigation all session.
  const { pathname } = useLocation()
  const accountState = useCurrentAccount(session, pathname)

  return accountState.status === 'ready' && hasAdminRole(accountState.value)
}

function AdminMenu() {
  const { containerRef, open, setOpen } = useDismissibleMenu()
  const panelId = 'admin-menu-panel'

  function closeMenu() {
    setOpen(false)
  }

  return (
    <div className="nav-menu" aria-label="Admin workflows" ref={containerRef}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="nav-menu-button"
        id="admin-menu-trigger"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        Admin
        <IconChevronDown className="menu-caret" height={14} width={14} />
      </button>
      {open && (
        <nav
          aria-labelledby="admin-menu-trigger"
          className="nav-menu-panel"
          id={panelId}
        >
          <NavLink to={ADMIN_CATALOG_ROUTE_PATH} onClick={closeMenu}>
            Catalog admin
          </NavLink>
          <NavLink to={ADMIN_LOCALIZATION_ROUTE_PATH} onClick={closeMenu}>
            Localizations
          </NavLink>
          <NavLink to={ADMIN_USERS_ROUTE_PATH} onClick={closeMenu}>
            Users
          </NavLink>
          <NavLink end to={OPERATOR_ROUTE_PATH} onClick={closeMenu}>
            Operations
          </NavLink>
          <NavLink to={OPERATOR_DIAGNOSTICS_ROUTE_PATH} onClick={closeMenu}>
            Diagnostics
          </NavLink>
        </nav>
      )}
    </div>
  )
}

// Wide-viewport shortcut for the account language preference; the account
// page keeps the full searchable control and the clear action.
function QuickLanguageMenu({ session }: { session: SessionResponse }) {
  const { containerRef, open, setOpen } = useDismissibleMenu()
  const accountState = useCurrentAccount(session)
  const [updateState, setUpdateState] = useState<MutationState>({
    status: 'idle',
  })

  if (accountState.status !== 'ready') {
    return null
  }

  const account = accountState.value
  const currentLanguage = account.preferredLanguage?.trim() ?? ''
  const currentOption =
    LANGUAGE_OPTIONS.find((option) => option.value === currentLanguage) ?? null
  const submitting = updateState.status === 'submitting'
  const CurrentFlag = currentOption ? LANGUAGE_FLAGS[currentOption.value] : null
  const panelId = 'language-menu-panel'

  async function selectLanguage(value: string) {
    if (value === currentLanguage) {
      setOpen(false)

      return
    }

    setUpdateState({ status: 'submitting' })

    try {
      const nextAccount = await updateAccountLanguage(session, value)

      publishAccountUpdate(session, nextAccount)
      setUpdateState({ status: 'idle' })
      setOpen(false)
    } catch (error: unknown) {
      setUpdateState({
        status: 'error',
        message: getDisplayMessage(
          error,
          'Language preference could not be saved.',
        ),
      })
    }
  }

  return (
    <div className="nav-menu language-menu" ref={containerRef}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={`Language preference, currently ${
          currentOption?.label ?? 'no preference'
        }`}
        className="nav-menu-button language-menu-button"
        id="language-menu-trigger"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        {CurrentFlag ? (
          <CurrentFlag className="language-flag" />
        ) : (
          <IconGlobe height={14} width={14} />
        )}
        <span className="language-code">
          {currentOption ? currentOption.value.toUpperCase() : '–'}
        </span>
        <IconChevronDown className="menu-caret" height={14} width={14} />
      </button>
      {open && (
        <div
          aria-labelledby="language-menu-trigger"
          className="nav-menu-panel language-menu-panel"
          id={panelId}
          role="group"
        >
          {LANGUAGE_OPTIONS.map((option) => {
            const Flag = LANGUAGE_FLAGS[option.value]

            return (
              <button
                aria-current={option.value === currentLanguage || undefined}
                className="language-option-button"
                disabled={submitting}
                key={option.value}
                type="button"
                onClick={() => void selectLanguage(option.value)}
              >
                <Flag className="language-flag" />
                <span>{option.label}</span>
              </button>
            )
          })}
          {updateState.status === 'error' && (
            <p className="session-message error" role="alert">
              {updateState.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function RouteContextHeader({ context }: { context: RouteContext }) {
  useEffect(() => {
    document.title = `${context.title} · Library Console`
  }, [context.title])

  return (
    <header className="route-context page-header">
      <p className="eyebrow">
        <span className="call-number">{context.code}</span>
        {` · ${context.area}`}
      </p>
      <h1 id="page-title" tabIndex={-1}>
        {context.title}
      </h1>
      <p className="lede">{context.description}</p>
    </header>
  )
}

// Moves focus to the page heading after in-app navigation so the new route is
// announced; initial load, replace-redirects, and query-only changes keep the
// browser's own focus behavior.
function useRouteFocusReset() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const previousPathnameRef = useRef<string | null>(null)

  useEffect(() => {
    const previousPathname = previousPathnameRef.current

    previousPathnameRef.current = pathname

    if (
      navigationType === 'REPLACE' ||
      previousPathname === null ||
      previousPathname === pathname
    ) {
      return
    }

    window.requestAnimationFrame(() => {
      document.getElementById('page-title')?.focus()
    })
  }, [navigationType, pathname])
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
      {THEME_PREFERENCES.map((option) => {
        const Icon = THEME_ICONS[option]

        return (
          <label
            className="theme-option"
            key={option}
            title={`${THEME_LABELS[option]} theme`}
          >
            <input
              type="radio"
              name="theme-preference"
              value={option}
              checked={preference === option}
              onChange={() => onPreferenceChange(option)}
            />
            <span className="theme-option-indicator">
              <Icon />
              <span className="visually-hidden">{THEME_LABELS[option]}</span>
            </span>
          </label>
        )
      })}
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
  const { containerRef, open, setOpen } = useDismissibleMenu()
  const accountState = useCurrentAccount(
    state.status === 'ready' && state.session.authenticated === true
      ? state.session
      : null,
  )
  const panelId = 'account-menu-panel'

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
      <div className="account-menu" ref={containerRef}>
        <button
          aria-controls={panelId}
          aria-expanded={open}
          className="account-menu-button connection-issue"
          id="account-menu-trigger"
          type="button"
          onClick={() => setOpen((current) => !current)}
        >
          Connection issue
          <IconChevronDown className="menu-caret" height={14} width={14} />
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
      <div className="account-menu" ref={containerRef}>
        <button
          aria-controls={panelId}
          aria-expanded={open}
          className="account-menu-button sign-in"
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
            <div className="session-action-summary">
              <p className="session-action-title">Sign in to your workspace</p>
              <p className="session-message muted">
                Choose one of the sign-in options supplied by the current
                session.
              </p>
            </div>
            <SessionLoginActions session={state.session} />
            <SessionStatusSummary session={state.session} />
            <SessionDetails session={state.session} showStatus={false} />
          </div>
        )}
      </div>
    )
  }

  const submitting = logoutState.status === 'submitting'
  // The trigger names the signed-in user as soon as the cached account
  // resolves; "Account" only bridges the initial load.
  const accountLabel =
    accountState.status === 'ready'
      ? accountState.value.displayName?.trim() ||
        accountState.value.login?.trim() ||
        'Account'
      : 'Account'

  return (
    <div className="account-menu" ref={containerRef}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="account-menu-button signed-in"
        id="account-menu-trigger"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="account-menu-name">{accountLabel}</span>
        <IconChevronDown className="menu-caret" height={14} width={14} />
      </button>
      {open && (
        <div
          aria-label="Account menu"
          className="account-menu-panel"
          id={panelId}
          role="region"
        >
          <div className="account-menu-actions">
            <NavLink
              className="account-menu-link"
              to={ACCOUNT_ROUTE_PATH}
              onClick={() => setOpen(false)}
            >
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
          {!state.session.logoutPath && (
            <p className="session-message muted">
              Sign out is unavailable for this session.
            </p>
          )}
          {logoutState.status === 'error' && (
            <p className="session-message error" role="alert">
              {logoutState.message}
            </p>
          )}
          <SessionDetails session={state.session} />
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
      ? `Cookie ${csrf.cookieName ?? 'unavailable'}; header ${
          csrf.headerName ?? 'unavailable'
        }`
      : 'Disabled'

  return (
    <div className="session-details">
      {showStatus && <SessionStatusSummary session={session} />}

      <dl className="session-metadata">
        <div>
          <dt>Account endpoint</dt>
          <dd>
            {session.authenticated === true
              ? session.accountPath ?? 'Unavailable'
              : 'None'}
          </dd>
        </div>
        <div>
          <dt>Sign-out endpoint</dt>
          <dd>{session.logoutPath ?? 'Unavailable'}</dd>
        </div>
        <div>
          <dt>Session cookie</dt>
          <dd>{session.sessionCookie?.name ?? 'Unavailable'}</dd>
        </div>
        <div>
          <dt>Write protection</dt>
          <dd>{csrfLabel}</dd>
        </div>
      </dl>
    </div>
  )
}

function SessionLoginActions({ session }: { session: SessionResponse }) {
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

function SessionStatusSummary({ session }: { session: SessionResponse }) {
  const statusLabel =
    session.authenticated === true ? 'Signed in' : 'Browsing as guest'

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

export default App
