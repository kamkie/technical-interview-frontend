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

// Resolves free text from the searchable language input to a supported
// language code: '' for no preference, null when nothing matches.
export function resolveLanguageInput(input: string): string | null {
  const normalized = input.trim().toLowerCase()

  if (!normalized) {
    return ''
  }

  const match = LANGUAGE_OPTIONS.find(
    (language) =>
      language.value === normalized ||
      language.label.toLowerCase() === normalized,
  )

  return match?.value ?? null
}

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
