import { createContext, useContext } from 'react'

import type { SupportedLocalizationLanguage } from '../api/localizations'
import {
  UI_MESSAGES,
  formatUiMessage,
  type UiMessageKey,
  type UiMessageParams,
} from './messages'
import { FALLBACK_LANGUAGE } from './resolveLanguage'

export type UiTranslate = (
  key: UiMessageKey,
  params?: UiMessageParams,
) => string

export type I18nContextValue = {
  // Drops the remembered account preference and re-resolves; logout calls
  // this so an anonymous visitor is not pinned to the previous account's
  // language.
  clearAccountPreference: () => void
  language: SupportedLocalizationLanguage
  // Re-runs language resolution against the current account preference,
  // cookie, and browser locale; anonymous selection calls this after
  // writing the backend `language` cookie.
  refreshLanguage: () => void
  t: UiTranslate
}

// Without a mounted provider (isolated component renders and tests), lookups
// return the English defaults so chrome never breaks on missing context.
const DEFAULT_CONTEXT_VALUE: I18nContextValue = {
  clearAccountPreference: () => undefined,
  language: FALLBACK_LANGUAGE,
  refreshLanguage: () => undefined,
  t: (key, params) => formatUiMessage(UI_MESSAGES[key], params),
}

export const I18nContext = createContext<I18nContextValue>(DEFAULT_CONTEXT_VALUE)

export function useI18n(): I18nContextValue {
  return useContext(I18nContext)
}
