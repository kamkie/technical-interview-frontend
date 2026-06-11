import type { UiTranslate } from '../i18n/useI18n'

// Labels stay the canonical English names; display surfaces translate them
// through the `ui.language.<code>` catalog keys.
export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'pl', label: 'Polish' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'no', label: 'Norwegian' },
] as const

export type LanguageOption = (typeof LANGUAGE_OPTIONS)[number]

export function formatLanguagePreference(
  value: string | undefined,
  t: UiTranslate,
) {
  const languageValue = value?.trim()

  if (!languageValue) {
    return t('ui.account.no-preference')
  }

  const option = LANGUAGE_OPTIONS.find(
    (language) => language.value === languageValue,
  )

  return option ? t(`ui.language.${option.value}`) : languageValue
}
