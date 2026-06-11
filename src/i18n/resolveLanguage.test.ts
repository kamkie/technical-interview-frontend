import { describe, expect, it } from 'vitest'

import {
  FALLBACK_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  resolveLanguage,
  toSupportedLanguage,
} from './resolveLanguage'

describe('resolveLanguage', () => {
  it('prefers the account language over cookie and browser locales', () => {
    expect(
      resolveLanguage({
        accountPreferredLanguage: 'pl',
        cookieSource: `${LANGUAGE_COOKIE_NAME}=de`,
        browserLanguages: ['fr-FR', 'fr'],
      }),
    ).toBe('pl')
  })

  it('falls back to the backend language cookie without an account preference', () => {
    expect(
      resolveLanguage({
        cookieSource: `other=x; ${LANGUAGE_COOKIE_NAME}=de; XSRF-TOKEN=token`,
        browserLanguages: ['fr-FR'],
      }),
    ).toBe('de')
  })

  it('falls back to the first supported browser locale without preference or cookie', () => {
    expect(
      resolveLanguage({
        browserLanguages: ['zz', 'fr-FR', 'pl'],
      }),
    ).toBe('fr')
  })

  it('falls back to English when no source resolves to a supported language', () => {
    expect(
      resolveLanguage({
        accountPreferredLanguage: 'xx',
        cookieSource: `${LANGUAGE_COOKIE_NAME}=yy`,
        browserLanguages: ['zz-ZZ'],
      }),
    ).toBe(FALLBACK_LANGUAGE)
  })

  it('resolves English from empty inputs', () => {
    expect(resolveLanguage({})).toBe(FALLBACK_LANGUAGE)
  })

  it('skips an unsupported account preference without dropping later tiers', () => {
    expect(
      resolveLanguage({
        accountPreferredLanguage: 'xx',
        cookieSource: `${LANGUAGE_COOKIE_NAME}=uk`,
      }),
    ).toBe('uk')
  })

  it('skips an unsupported cookie language without dropping the browser tier', () => {
    expect(
      resolveLanguage({
        cookieSource: `${LANGUAGE_COOKIE_NAME}=xx`,
        browserLanguages: ['no'],
      }),
    ).toBe('no')
  })
})

describe('toSupportedLanguage', () => {
  it('maps region tags to their supported base language', () => {
    expect(toSupportedLanguage('pl-PL')).toBe('pl')
    expect(toSupportedLanguage('DE-at')).toBe('de')
  })

  it('normalizes case and surrounding whitespace', () => {
    expect(toSupportedLanguage('  ES ')).toBe('es')
  })

  it('returns undefined for unsupported, blank, or missing values', () => {
    expect(toSupportedLanguage('zz')).toBeUndefined()
    expect(toSupportedLanguage('')).toBeUndefined()
    expect(toSupportedLanguage('   ')).toBeUndefined()
    expect(toSupportedLanguage(undefined)).toBeUndefined()
    expect(toSupportedLanguage(null)).toBeUndefined()
  })
})
