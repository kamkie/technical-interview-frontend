import { afterEach, describe, expect, it } from 'vitest'

import {
  createJsonReadHeaders,
  getActiveLanguageHeaders,
  getActiveRequestLanguage,
  setActiveRequestLanguage,
} from './http'

afterEach(() => {
  setActiveRequestLanguage(undefined)
})

describe('active request language', () => {
  it('starts unset and produces no Accept-Language header', () => {
    expect(getActiveRequestLanguage()).toBeUndefined()
    expect(getActiveLanguageHeaders()).toEqual({})
  })

  it('produces an exact resolved-language header once set', () => {
    setActiveRequestLanguage('pl')

    expect(getActiveRequestLanguage()).toBe('pl')
    expect(getActiveLanguageHeaders()).toEqual({
      'Accept-Language': 'pl',
    })
  })

  it('clears back to no header when unset', () => {
    setActiveRequestLanguage('de')
    setActiveRequestLanguage(undefined)

    expect(getActiveLanguageHeaders()).toEqual({})
  })
})

describe('createJsonReadHeaders', () => {
  it('passes the browser languages through before a language resolves', () => {
    expect(createJsonReadHeaders()).toEqual({
      Accept: 'application/json',
      'Accept-Language': navigator.languages.join(', '),
    })
  })

  it('sends exactly the resolved language once set', () => {
    setActiveRequestLanguage('uk')

    expect(createJsonReadHeaders()).toEqual({
      Accept: 'application/json',
      'Accept-Language': 'uk',
    })
  })

  it('lets an explicit accept-language argument win over the resolved language', () => {
    setActiveRequestLanguage('uk')

    expect(createJsonReadHeaders('fr')).toEqual({
      Accept: 'application/json',
      'Accept-Language': 'fr',
    })
  })
})
