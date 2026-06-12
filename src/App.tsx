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
import { CatalogCoverage } from './i18n/I18nProvider'
import type { UiMessageKey } from './i18n/messages'
import { LANGUAGE_COOKIE_NAME } from './i18n/resolveLanguage'
import { useI18n } from './i18n/useI18n'
import {
  OPERATOR_DIAGNOSTICS_ROUTE_PATH,
  OperatorDiagnosticsPage,
} from './operator/OperatorDiagnosticsPage'
import { OPERATOR_ROUTE_PATH, OperatorPage } from './operator/OperatorPage'
import {
  createLoadError,
  getApiDisplayMessage,
  getLoadErrorMessage,
  type MutationState,
} from './ui/asyncState'
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
  areaKey: UiMessageKey
  // Dewey classification for the area, typed on the route card's call number.
  code: string
  descriptionKey: UiMessageKey
  path: string
  titleKey: UiMessageKey
}

const CATALOG_ROUTE_CONTEXT: RouteContext = {
  areaKey: 'ui.area.catalog',
  code: '028',
  descriptionKey: 'ui.route.catalog.description',
  path: CATALOG_ROUTE_PATH,
  titleKey: 'ui.route.catalog.title',
}

const ROUTE_CONTEXTS: readonly RouteContext[] = [
  CATALOG_ROUTE_CONTEXT,
  {
    areaKey: 'ui.area.account',
    code: '025.6',
    descriptionKey: 'ui.route.account.description',
    path: ACCOUNT_ROUTE_PATH,
    titleKey: 'ui.route.account.title',
  },
  {
    areaKey: 'ui.area.admin',
    code: '025.3',
    descriptionKey: 'ui.route.admin-catalog.description',
    path: ADMIN_CATALOG_ROUTE_PATH,
    titleKey: 'ui.route.admin-catalog.title',
  },
  {
    areaKey: 'ui.area.admin',
    code: '418',
    descriptionKey: 'ui.route.admin-localization.description',
    path: ADMIN_LOCALIZATION_ROUTE_PATH,
    titleKey: 'ui.route.admin-localization.title',
  },
  {
    areaKey: 'ui.area.admin',
    code: '023',
    descriptionKey: 'ui.route.admin-users.description',
    path: ADMIN_USERS_ROUTE_PATH,
    titleKey: 'ui.route.admin-users.title',
  },
  {
    areaKey: 'ui.area.admin',
    code: '023',
    descriptionKey: 'ui.route.admin-users.description',
    path: ADMIN_USER_DETAIL_ROUTE_PATH,
    titleKey: 'ui.route.admin-users.title',
  },
  {
    areaKey: 'ui.area.operations',
    code: '025.1',
    descriptionKey: 'ui.route.operator.description',
    path: OPERATOR_ROUTE_PATH,
    titleKey: 'ui.route.operator.title',
  },
  {
    areaKey: 'ui.area.operations',
    code: '004.2',
    descriptionKey: 'ui.route.diagnostics.description',
    path: OPERATOR_DIAGNOSTICS_ROUTE_PATH,
    titleKey: 'ui.route.diagnostics.title',
  },
]

const THEME_LABEL_KEYS: Record<ThemePreference, UiMessageKey> = {
  dark: 'ui.theme.dark',
  light: 'ui.theme.light',
  system: 'ui.theme.system',
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
  const { clearAccountPreference, t } = useI18n()
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
      clearAccountPreference()
      setLogoutState({ status: 'idle' })
    } catch (error: unknown) {
      setLogoutState({
        status: 'error',
        message: getApiDisplayMessage(t, error, t('ui.session.logout-failed')),
      })
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t('ui.shell.skip-link')}
      </a>
      <header className="topbar">
        <div className="topbar-primary">
          <Link className="brand-lockup" to={CATALOG_ROUTE_PATH}>
            <span className="brand-mark" aria-hidden="true">
              <IconBookOpen height={18} width={18} />
            </span>
            <span className="brand-name">{t('ui.shell.brand')}</span>
          </Link>
          <ShellNavigation authenticated={authenticated} isAdmin={isAdmin} />
        </div>
        <div className="topbar-actions">
          {sessionState.status === 'ready' &&
            (authenticated ? (
              <QuickLanguageMenu session={sessionState.session} />
            ) : (
              <AnonymousLanguageMenu />
            ))}
          <ThemePreferenceControl
            preference={preference}
            resolvedTheme={resolvedTheme}
            onPreferenceChange={setPreference}
          />
          <SessionAccountMenu
            logoutState={logoutState}
            state={sessionState}
            onLogout={handleLogout}
            onRetrySession={refreshSession}
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
  const { t } = useI18n()

  return (
    <nav className="shell-navigation" aria-label={t('ui.nav.primary-label')}>
      <NavLink to={CATALOG_ROUTE_PATH}>{t('ui.nav.catalog')}</NavLink>
      {authenticated && isAdmin && (
        <>
          <WorkflowMenu
            ariaLabel={t('ui.nav.admin-label')}
            idPrefix="admin-menu"
            label={t('ui.nav.admin')}
            items={[
              { label: t('ui.nav.catalog-admin'), to: ADMIN_CATALOG_ROUTE_PATH },
              { label: t('ui.nav.localizations'), to: ADMIN_LOCALIZATION_ROUTE_PATH },
              { label: t('ui.nav.users'), to: ADMIN_USERS_ROUTE_PATH },
            ]}
          />
          <WorkflowMenu
            ariaLabel={t('ui.nav.operations-label')}
            idPrefix="operations-menu"
            label={t('ui.nav.operations')}
            items={[
              {
                end: true,
                label: t('ui.nav.operations-console'),
                to: OPERATOR_ROUTE_PATH,
              },
              { label: t('ui.nav.diagnostics'), to: OPERATOR_DIAGNOSTICS_ROUTE_PATH },
            ]}
          />
        </>
      )}
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

// One topbar menu per workflow area, so the nav grouping matches the route
// context areas (Admin vs Operations) typed on each page's call-number card.
function WorkflowMenu({
  ariaLabel,
  idPrefix,
  items,
  label,
}: {
  ariaLabel: string
  idPrefix: string
  items: readonly { end?: boolean; label: string; to: string }[]
  label: string
}) {
  const { containerRef, open, setOpen } = useDismissibleMenu()
  const panelId = `${idPrefix}-panel`
  const triggerId = `${idPrefix}-trigger`

  function closeMenu() {
    setOpen(false)
  }

  return (
    <div className="nav-menu" aria-label={ariaLabel} ref={containerRef}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="nav-menu-button"
        id={triggerId}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        {label}
        <IconChevronDown className="menu-caret" height={14} width={14} />
      </button>
      {open && (
        <nav
          aria-labelledby={triggerId}
          className="nav-menu-panel"
          id={panelId}
        >
          {items.map((item) => (
            <NavLink end={item.end} key={item.to} to={item.to} onClick={closeMenu}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}

// Wide-viewport shortcut for the account language preference; the account
// page keeps the full searchable control and the clear action.
function QuickLanguageMenu({ session }: { session: SessionResponse }) {
  const { t } = useI18n()
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
        message: getApiDisplayMessage(t, error, t('ui.language.save-failed')),
      })
    }
  }

  return (
    <div className="nav-menu language-menu" ref={containerRef}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={t('ui.language.menu-label', {
          label: currentOption
            ? t(`ui.language.${currentOption.value}`)
            : t('ui.language.no-preference-inline'),
        })}
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
                <span>{t(`ui.language.${option.value}`)}</span>
              </button>
            )
          })}
          <LanguageCoverageNotice
            isAdmin={hasAdminRole(account)}
            onNavigate={() => setOpen(false)}
          />
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

// The values come from the fixed LANGUAGE_OPTIONS list, so the cookie write
// needs no encoding; one year keeps the anonymous choice across visits.
function persistAnonymousLanguageCookie(value: string) {
  document.cookie = `${LANGUAGE_COOKIE_NAME}=${value}; path=/; max-age=31536000; SameSite=Lax`
}

// Anonymous visitors choose the UI language by writing the backend `language`
// negotiation cookie, so the rendered chrome and backend payloads agree
// before any account exists. The signed-in shortcut stays preference-backed.
function AnonymousLanguageMenu() {
  const { language, refreshLanguage, t } = useI18n()
  const { containerRef, open, setOpen } = useDismissibleMenu()
  const currentOption =
    LANGUAGE_OPTIONS.find((option) => option.value === language) ?? null
  const CurrentFlag = currentOption ? LANGUAGE_FLAGS[currentOption.value] : null
  const panelId = 'language-menu-panel'

  function selectLanguage(value: string) {
    persistAnonymousLanguageCookie(value)
    refreshLanguage()
    setOpen(false)
  }

  return (
    <div className="nav-menu language-menu language-menu-anonymous" ref={containerRef}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={t('ui.language.menu-label', {
          label: currentOption
            ? t(`ui.language.${currentOption.value}`)
            : t('ui.language.no-preference-inline'),
        })}
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
                aria-current={option.value === language || undefined}
                className="language-option-button"
                key={option.value}
                type="button"
                onClick={() => selectLanguage(option.value)}
              >
                <Flag className="language-flag" />
                <span>{t(`ui.language.${option.value}`)}</span>
              </button>
            )
          })}
          <LanguageCoverageNotice
            isAdmin={false}
            onNavigate={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  )
}

// Partial-translation notice under the language options: when the loaded
// catalog covers less than the full `UI_MESSAGES` registry, the menu states
// how much of the interface the active language covers and that the rest
// appears in English. Admins also get a direct path to finish the
// translation; following it dismisses the menu like other menu links.
function LanguageCoverageNotice({
  isAdmin,
  onNavigate,
}: {
  isAdmin: boolean
  onNavigate: () => void
}) {
  const { language, t } = useI18n()

  return (
    <CatalogCoverage>
      {(coverage) => {
        const percent = Math.round(coverage * 100)

        if (percent >= 100) {
          return null
        }

        return (
          <>
            <p className="session-message muted">
              {t('ui.language.partial-coverage', {
                language: t(`ui.language.${language}`),
                percent,
              })}
            </p>
            {isAdmin && (
              <Link
                to={`${ADMIN_LOCALIZATION_ROUTE_PATH}?language=${language}`}
                onClick={onNavigate}
              >
                {t('ui.language.complete-translation')}
              </Link>
            )}
          </>
        )
      }}
    </CatalogCoverage>
  )
}

function RouteContextHeader({ context }: { context: RouteContext }) {
  const { t } = useI18n()
  const title = t(context.titleKey)
  const brand = t('ui.shell.brand')

  useEffect(() => {
    document.title = `${title} · ${brand}`
  }, [brand, title])

  return (
    <header className="route-context page-header">
      <p className="eyebrow">
        <span className="call-number">{context.code}</span>
        {` · ${t(context.areaKey)}`}
      </p>
      <h1 id="page-title" tabIndex={-1}>
        {title}
      </h1>
      <p className="lede">{t(context.descriptionKey)}</p>
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
  const { t } = useI18n()

  return (
    <div
      className="theme-control"
      role="radiogroup"
      aria-label={t('ui.theme.group-label', {
        label: t(THEME_LABEL_KEYS[preference]),
        mode: t(`ui.theme.mode.${resolvedTheme}`),
      })}
    >
      {THEME_PREFERENCES.map((option) => {
        const Icon = THEME_ICONS[option]

        return (
          <label
            className="theme-option"
            key={option}
            title={t('ui.theme.option-title', {
              label: t(THEME_LABEL_KEYS[option]),
            })}
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
              <span className="visually-hidden">{t(THEME_LABEL_KEYS[option])}</span>
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
      // The empty fallback lets display sites localize the generic
      // bootstrap-failure message at render time.
      setSessionState(createLoadError(error, ''))
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
          setSessionState(createLoadError(error, ''))
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
  onRetrySession,
  state,
}: {
  logoutState: LogoutState
  onLogout: (session: SessionResponse) => void
  onRetrySession: () => void
  state: SessionState
}) {
  const { t } = useI18n()
  const { containerRef, open, setOpen } = useDismissibleMenu()
  const accountState = useCurrentAccount(
    state.status === 'ready' && state.session.authenticated === true
      ? state.session
      : null,
  )
  const panelId = 'account-menu-panel'

  if (state.status === 'loading') {
    return (
      <div className="header-session" aria-label={t('ui.session.status-label')}>
        <span className="header-session-text" role="status">
          {t('ui.session.checking')}
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
          {t('ui.session.connection-issue')}
          <IconChevronDown className="menu-caret" height={14} width={14} />
        </button>
        {open && (
          <div
            aria-label={t('ui.session.connection-menu-label')}
            className="account-menu-panel"
            id={panelId}
            role="region"
          >
            <SessionBootstrapPanel state={state} onRetry={onRetrySession} />
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
          {t('ui.session.sign-in')}
        </button>
        {open && (
          <div
            aria-label={t('ui.session.sign-in-options-label')}
            className="account-menu-panel"
            id={panelId}
            role="region"
          >
            <div className="session-action-summary">
              <p className="session-action-title">
                {t('ui.session.sign-in-title')}
              </p>
              <p className="session-message muted">
                {t('ui.session.sign-in-hint')}
              </p>
            </div>
            <SessionLoginActions session={state.session} />
            <SessionStatusSummary session={state.session} />
            <SessionDetailsDisclosure session={state.session} showStatus={false} />
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
        t('ui.session.account')
      : t('ui.session.account')

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
          aria-label={t('ui.session.account-menu-label')}
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
              {t('ui.session.account-settings')}
            </NavLink>
            <button
              className="logout-button"
              type="button"
              disabled={submitting || !state.session.logoutPath}
              onClick={() => onLogout(state.session)}
            >
              {submitting
                ? t('ui.session.signing-out')
                : t('ui.session.sign-out')}
            </button>
          </div>
          {!state.session.logoutPath && (
            <p className="session-message muted">
              {t('ui.session.sign-out-unavailable')}
            </p>
          )}
          {logoutState.status === 'error' && (
            <p className="session-message error" role="alert">
              {logoutState.message}
            </p>
          )}
          <SessionDetailsDisclosure session={state.session} />
        </div>
      )}
    </div>
  )
}

// Session metadata stays one disclosure away so the sign-in and sign-out
// actions visually lead their menus.
function SessionDetailsDisclosure({
  session,
  showStatus = true,
}: {
  session: SessionResponse
  showStatus?: boolean
}) {
  const { t } = useI18n()

  return (
    <details className="session-details-disclosure">
      <summary>{t('ui.session.connection-details')}</summary>
      <SessionDetails session={session} showStatus={showStatus} />
    </details>
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

function SessionBootstrapPanel({
  onRetry,
  state,
}: {
  onRetry: () => void
  state: SessionState
}) {
  const { t } = useI18n()

  return (
    <section className="session-panel" aria-labelledby="session-title">
      <div className="section-heading">
        <p className="eyebrow">{t('ui.session.connection-eyebrow')}</p>
        <h2 id="session-title">{t('ui.session.connection-details')}</h2>
      </div>

      {state.status === 'loading' && (
        <p className="session-message" role="status">
          {t('ui.session.loading')}
        </p>
      )}

      {state.status === 'error' && (
        <>
          <p className="session-message error" role="alert">
            {getLoadErrorMessage(t, state) || t('ui.session.bootstrap-failed')}
          </p>
          <button className="secondary-button" type="button" onClick={onRetry}>
            {t('ui.common.retry')}
          </button>
        </>
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
  const { t } = useI18n()
  const csrf = session.csrf
  const csrfLabel =
    csrf?.enabled === true
      ? t('ui.session.csrf-label', {
          cookie: csrf.cookieName ?? 'unavailable',
          header: csrf.headerName ?? 'unavailable',
        })
      : t('ui.common.disabled')

  return (
    <div className="session-details">
      {showStatus && <SessionStatusSummary session={session} />}

      <dl className="session-metadata">
        <div>
          <dt>{t('ui.session.account-endpoint')}</dt>
          <dd>
            {session.authenticated === true
              ? session.accountPath ?? t('ui.common.unavailable')
              : t('ui.common.none')}
          </dd>
        </div>
        <div>
          <dt>{t('ui.session.sign-out-endpoint')}</dt>
          <dd>{session.logoutPath ?? t('ui.common.unavailable')}</dd>
        </div>
        <div>
          <dt>{t('ui.session.cookie')}</dt>
          <dd>{session.sessionCookie?.name ?? t('ui.common.unavailable')}</dd>
        </div>
        <div>
          <dt>{t('ui.session.write-protection')}</dt>
          <dd>{csrfLabel}</dd>
        </div>
      </dl>
    </div>
  )
}

function SessionLoginActions({ session }: { session: SessionResponse }) {
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

function SessionStatusSummary({ session }: { session: SessionResponse }) {
  const { t } = useI18n()
  const statusLabel =
    session.authenticated === true
      ? t('ui.session.signed-in')
      : t('ui.session.guest')

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
