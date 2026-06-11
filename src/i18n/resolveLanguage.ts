import {
  SUPPORTED_LOCALIZATION_LANGUAGES,
  type SupportedLocalizationLanguage,
} from '../api/localizations'
import { readCookie } from '../api/session'

export const FALLBACK_LANGUAGE: SupportedLocalizationLanguage = 'en'
// Backend negotiation cookie name from docs/backend/FRONTEND_AI_CONTRACT.md.
export const LANGUAGE_COOKIE_NAME = 'language'

export type LanguageResolutionInputs = {
  accountPreferredLanguage?: string | null
  cookieSource?: string
  browserLanguages?: readonly string[]
}

export function resolveLanguage({
  accountPreferredLanguage,
  cookieSource = '',
  browserLanguages = [],
}: LanguageResolutionInputs): SupportedLocalizationLanguage {
  const preference = toSupportedLanguage(accountPreferredLanguage)

  if (preference) {
    return preference
  }

  const cookieLanguage = toSupportedLanguage(
    readCookie(cookieSource, LANGUAGE_COOKIE_NAME),
  )

  if (cookieLanguage) {
    return cookieLanguage
  }

  for (const candidate of browserLanguages) {
    const browserLanguage = toSupportedLanguage(candidate)

    if (browserLanguage) {
      return browserLanguage
    }
  }

  return FALLBACK_LANGUAGE
}

// Maps region tags such as `pl-PL` to their base language and returns
// undefined for unsupported or blank values.
export function toSupportedLanguage(
  value: string | null | undefined,
): SupportedLocalizationLanguage | undefined {
  const base = value?.trim().toLowerCase().split('-')[0]

  return SUPPORTED_LOCALIZATION_LANGUAGES.find((language) => language === base)
}
