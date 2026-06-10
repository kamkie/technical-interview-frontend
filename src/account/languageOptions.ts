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

export function formatLanguagePreference(value: string | undefined) {
  const languageValue = value?.trim()

  if (!languageValue) {
    return 'No preference'
  }

  return (
    LANGUAGE_OPTIONS.find((language) => language.value === languageValue)
      ?.label ?? languageValue
  )
}
