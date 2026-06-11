import {
  useCallback,
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
import { resolveLanguage } from './resolveLanguage'
import { I18nContext, type I18nContextValue, type UiTranslate } from './useI18n'

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
  const [catalog, setCatalog] = useState<UiCatalog | null>(null)
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
          setCatalog(loaded)
        }
      })
      .catch(() => {
        // Catalog load failures are non-fatal; chrome renders the English
        // defaults until the next language change retries the load.
        if (!ignore) {
          setCatalog(null)
        }
      })

    return () => {
      ignore = true
    }
  }, [language])

  const t = useCallback<UiTranslate>(
    (key, params) =>
      formatUiMessage(catalog?.get(key) ?? UI_MESSAGES[key], params),
    [catalog],
  )
  const value = useMemo<I18nContextValue>(
    () => ({ clearAccountPreference, language, refreshLanguage, t }),
    [clearAccountPreference, language, refreshLanguage, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
