import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { subscribeToAccountValues } from '../account/useCurrentAccount'
import { setActiveRequestLanguage } from '../api/http'
import type { SupportedLocalizationLanguage } from '../api/localizations'
import { loadUiCatalog, type UiCatalog } from './catalog'
import { UI_MESSAGES, formatUiMessage } from './messages'
import {
  FALLBACK_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  resolveLanguage,
  toSupportedLanguage,
} from './resolveLanguage'
import { I18nContext, type I18nContextValue, type UiTranslate } from './useI18n'

// The loaded catalog stays tagged with its language so coverage is never
// derived from the previous language's rows while a switch is in flight.
type LoadedCatalog = {
  catalog: UiCatalog
  language: SupportedLocalizationLanguage
}

// Share of `UI_MESSAGES` keys the active language's loaded catalog covers, as
// a 0..1 ratio. Consumers read only this number, never the catalog rows. The
// fallback language is definitionally complete because its defaults live in
// `UI_MESSAGES`; unloaded and failed catalogs also count as complete so no
// partial-translation hint renders without loaded evidence.
const CatalogCoverageContext = createContext(1)

// Render-prop accessor for the coverage ratio. A component export keeps this
// file within react-refresh/only-export-components; hook and context exports
// belong in non-component modules such as `useI18n.ts`.
export function CatalogCoverage({
  children,
}: {
  children: (coverage: number) => ReactNode
}) {
  return children(useContext(CatalogCoverageContext))
}

// When an account arrives with a usable language preference, mirror the
// resolved supported language into the backend `language` negotiation cookie
// with the same write mechanics as the anonymous menu in `App.tsx`. The next
// full page load then resolves the account's language at the cookie tier
// before `/api/account` returns, eliminating the wrong-language flash; after
// logout the cookie intentionally keeps the last language. Accounts without a
// supported preference write nothing, so they keep following the cookie and
// browser tiers.
function persistResolvedPreferenceCookie(
  preferredLanguage: string | undefined,
) {
  const resolved = toSupportedLanguage(preferredLanguage)

  if (resolved) {
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${resolved}; path=/; max-age=31536000; SameSite=Lax`
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<SupportedLocalizationLanguage>(() => {
    const resolved = resolveLanguage({
      cookieSource: typeof document === 'undefined' ? '' : document.cookie,
      browserLanguages:
        typeof navigator === 'undefined' ? [] : navigator.languages,
    })

    // Applied synchronously so child effects fetch with the resolved language
    // on first render instead of the pre-resolution browser pass-through.
    setActiveRequestLanguage(resolved)

    return resolved
  })
  const [loadedCatalog, setLoadedCatalog] = useState<LoadedCatalog | null>(
    null,
  )
  // The latest account preference seen on this session, so cookie or browser
  // changes re-resolve below the preference tier instead of replacing it.
  const accountPreferenceRef = useRef<string | undefined>(undefined)

  const refreshLanguage = useCallback(() => {
    setLanguage(
      resolveLanguage({
        accountPreferredLanguage: accountPreferenceRef.current,
        cookieSource: typeof document === 'undefined' ? '' : document.cookie,
        browserLanguages:
          typeof navigator === 'undefined' ? [] : navigator.languages,
      }),
    )
  }, [])

  const clearAccountPreference = useCallback(() => {
    accountPreferenceRef.current = undefined
    refreshLanguage()
  }, [refreshLanguage])

  // Account loads and preference mutations re-resolve the language in the
  // same session; a language change refetches the catalog via the effect
  // below and re-renders the chrome.
  useEffect(
    () =>
      subscribeToAccountValues((account) => {
        accountPreferenceRef.current = account.preferredLanguage
        persistResolvedPreferenceCookie(account.preferredLanguage)
        refreshLanguage()
      }),
    [refreshLanguage],
  )

  useEffect(() => {
    setActiveRequestLanguage(language)
    document.documentElement.lang = language

    let ignore = false

    loadUiCatalog(language)
      .then((loaded) => {
        if (!ignore) {
          setLoadedCatalog({ catalog: loaded, language })
        }
      })
      .catch(() => {
        // Catalog load failures are non-fatal; chrome renders the English
        // defaults until the next language change retries the load.
        if (!ignore) {
          setLoadedCatalog(null)
        }
      })

    return () => {
      ignore = true
    }
  }, [language])

  const t = useCallback<UiTranslate>(
    (key, params) =>
      formatUiMessage(loadedCatalog?.catalog.get(key) ?? UI_MESSAGES[key], params),
    [loadedCatalog],
  )
  const value = useMemo<I18nContextValue>(
    () => ({ clearAccountPreference, language, refreshLanguage, t }),
    [clearAccountPreference, language, refreshLanguage, t],
  )
  const catalogCoverage = useMemo(() => {
    if (
      language === FALLBACK_LANGUAGE ||
      loadedCatalog === null ||
      loadedCatalog.language !== language
    ) {
      return 1
    }

    const keys = Object.keys(UI_MESSAGES)
    const covered = keys.filter((key) => loadedCatalog.catalog.has(key)).length

    return covered / keys.length
  }, [language, loadedCatalog])

  return (
    <I18nContext.Provider value={value}>
      <CatalogCoverageContext.Provider value={catalogCoverage}>
        {children}
      </CatalogCoverageContext.Provider>
    </I18nContext.Provider>
  )
}
