import { useCallback, useEffect, useState } from 'react'

export const THEME_STORAGE_KEY = 'technical-interview-frontend.theme'

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const

export type ThemePreference = (typeof THEME_PREFERENCES)[number]
export type ResolvedTheme = Exclude<ThemePreference, 'system'>

export function useThemePreference() {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readStoredThemePreference(),
  )
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    readSystemTheme(),
  )
  const resolvedTheme = resolveThemePreference(preference, systemTheme)

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')

    if (!mediaQuery) {
      return undefined
    }

    function syncSystemTheme() {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    }

    syncSystemTheme()
    mediaQuery.addEventListener('change', syncSystemTheme)

    return () => {
      mediaQuery.removeEventListener('change', syncSystemTheme)
    }
  }, [])

  useEffect(() => {
    applyDocumentTheme(preference, resolvedTheme)
  }, [preference, resolvedTheme])

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference)
    storeThemePreference(nextPreference)
  }, [])

  return {
    preference,
    resolvedTheme,
    setPreference,
  }
}

export function readStoredThemePreference(): ThemePreference {
  try {
    const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY)

    return isThemePreference(storedPreference) ? storedPreference : 'system'
  } catch {
    return 'system'
  }
}

export function resolveThemePreference(
  preference: ThemePreference,
  systemTheme: ResolvedTheme,
): ResolvedTheme {
  return preference === 'system' ? systemTheme : preference
}

function readSystemTheme(): ResolvedTheme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches === true
    ? 'dark'
    : 'light'
}

function storeThemePreference(preference: ThemePreference) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // The UI still updates even when browser storage is unavailable.
  }
}

function applyDocumentTheme(
  preference: ThemePreference,
  resolvedTheme: ResolvedTheme,
) {
  const root = document.documentElement

  root.dataset.theme = resolvedTheme
  root.dataset.themePreference = preference
  root.style.colorScheme = resolvedTheme
}

function isThemePreference(value: string | null): value is ThemePreference {
  return THEME_PREFERENCES.some((preference) => preference === value)
}
