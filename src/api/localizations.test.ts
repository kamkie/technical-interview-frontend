import { afterEach, describe, expect, it, vi } from 'vitest'

import { setActiveRequestLanguage } from './http'
import {
  LOCALIZATIONS_PATH,
  SUPPORTED_LOCALIZATION_LANGUAGES,
  buildLocalizationSearchPath,
  createLocalization,
  deleteLocalization,
  fetchLocalization,
  fetchLocalizations,
  getLocalizationCoverage,
  getLocalizationPath,
  updateLocalization,
  type LocalizationRequest,
  type LocalizationResponse,
} from './localizations'
import type { SessionResponse } from './session'

afterEach(() => {
  setActiveRequestLanguage(undefined)
})

describe('localizations API client', () => {
  it('serializes Spring pagination, filters, and repeated sort values', () => {
    expect(
      buildLocalizationSearchPath({
        messageKey: ' account.title ',
        language: ' pl ',
        page: 2,
        size: 20,
        sort: ['messageKey,ASC', 'language,DESC', ''],
      }),
    ).toBe(
      `${LOCALIZATIONS_PATH}?messageKey=account.title&language=pl&page=2&size=20&sort=messageKey%2CASC&sort=language%2CDESC`,
    )
  })

  it('fetches localization pages with same-origin credentials and language headers', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      Response.json({
        content: [],
        number: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
      }),
    )

    await fetchLocalizations(
      {
        messageKey: 'account.title',
        language: 'pl',
        page: 0,
        size: 20,
        sort: ['messageKey,ASC', 'language,ASC'],
      },
      {
        acceptLanguage: 'pl',
        fetchImplementation,
      },
    )

    expect(fetchImplementation).toHaveBeenCalledWith(
      `${LOCALIZATIONS_PATH}?messageKey=account.title&language=pl&page=0&size=20&sort=messageKey%2CASC&sort=language%2CASC`,
      {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'pl',
        },
      },
    )
  })

  it('fetches one localization row by id', async () => {
    const localization = createLocalizationRow({
      id: 7,
      messageKey: 'account.title',
      language: 'en',
    })
    const fetchImplementation = vi.fn().mockResolvedValue(Response.json(localization))

    await expect(
      fetchLocalization(7, { acceptLanguage: '', fetchImplementation }),
    ).resolves.toEqual(localization)

    expect(fetchImplementation).toHaveBeenCalledWith(getLocalizationPath(7), {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
  })

  it('carries the resolved language on localization mutations once set', async () => {
    setActiveRequestLanguage('de')

    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(Response.json(createLocalizationRow({ id: 11 })))
    const request = {
      messageKey: 'account.title',
      language: 'de',
      messageText: 'Konto',
    } satisfies LocalizationRequest

    await createLocalization(createSession(), request, {
      cookieSource: 'XSRF-TOKEN=token',
      fetchImplementation,
    })

    expect(fetchImplementation).toHaveBeenCalledWith(
      LOCALIZATIONS_PATH,
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Accept-Language': 'de',
          'X-XSRF-TOKEN': 'token',
        },
      }),
    )
  })

  it('creates localization rows with generated JSON bodies and configured CSRF metadata', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      Response.json(
        createLocalizationRow({
          id: 10,
          language: 'pl',
        }),
      ),
    )
    const request = {
      messageKey: 'account.title',
      language: 'pl',
      messageText: 'Konto',
      description: 'Account page title',
    } satisfies LocalizationRequest

    await expect(
      createLocalization(createSession(), request, {
        cookieSource: 'language=en; XSRF-TOKEN=token%201',
        fetchImplementation,
      }),
    ).resolves.toMatchObject({
      id: 10,
      language: 'pl',
    })

    expect(fetchImplementation).toHaveBeenCalledWith(LOCALIZATIONS_PATH, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'token 1',
      },
      body: JSON.stringify(request),
    })
  })

  it('updates localization rows with same-origin credentials and CSRF metadata', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      Response.json(
        createLocalizationRow({
          id: 10,
          messageText: 'Account',
        }),
      ),
    )
    const request = {
      messageKey: 'account.title',
      language: 'en',
      messageText: 'Account',
    } satisfies LocalizationRequest

    await updateLocalization(createSession(), 10, request, {
      cookieSource: 'XSRF-TOKEN=token',
      fetchImplementation,
    })

    expect(fetchImplementation).toHaveBeenCalledWith(getLocalizationPath(10), {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'token',
      },
      body: JSON.stringify(request),
    })
  })

  it('deletes localization rows with same-origin credentials and CSRF metadata', async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }))

    await deleteLocalization(createSession(), 10, {
      cookieSource: 'XSRF-TOKEN=token',
      fetchImplementation,
    })

    expect(fetchImplementation).toHaveBeenCalledWith(getLocalizationPath(10), {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'X-XSRF-TOKEN': 'token',
      },
      body: undefined,
    })
  })

  it('omits invented CSRF headers when the readable cookie is missing', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      Response.json(
        createLocalizationRow({
          id: 10,
        }),
      ),
    )

    await createLocalization(
      createSession(),
      {
        messageKey: 'account.title',
        language: 'fr',
        messageText: 'Compte',
      },
      {
        cookieSource: 'language=en',
        fetchImplementation,
      },
    )

    expect(fetchImplementation).toHaveBeenCalledWith(LOCALIZATIONS_PATH, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messageKey: 'account.title',
        language: 'fr',
        messageText: 'Compte',
      }),
    })
  })

  it('does not issue localization writes for anonymous sessions', async () => {
    const fetchImplementation = vi.fn()

    await expect(
      createLocalization(
        createSession({
          authenticated: false,
        }),
        {
          messageKey: 'account.title',
          language: 'pl',
          messageText: 'Konto',
        },
        { fetchImplementation },
      ),
    ).rejects.toThrow('Localization changes require an authenticated session.')
    expect(fetchImplementation).not.toHaveBeenCalled()
  })

  it('surfaces localized backend failure messages', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      Response.json(
        {
          status: 403,
          messageKey: 'error.localization.access_denied',
          message: 'Nie masz uprawnien do edycji tlumaczen.',
          language: 'pl',
        },
        {
          status: 403,
          statusText: 'Forbidden',
          headers: {
            'Content-Type': 'application/problem+json',
          },
        },
      ),
    )

    await expect(
      updateLocalization(
        createSession(),
        11,
        {
          messageKey: 'account.title',
          language: 'pl',
          messageText: 'Konto',
        },
        {
          cookieSource: 'XSRF-TOKEN=token',
          fetchImplementation,
        },
      ),
    ).rejects.toThrow('Nie masz uprawnien do edycji tlumaczen.')
  })
})

describe('localization coverage', () => {
  it('uses the contract-supported locale list', () => {
    expect(SUPPORTED_LOCALIZATION_LANGUAGES).toEqual([
      'en',
      'es',
      'de',
      'fr',
      'pl',
      'uk',
      'no',
    ])
  })

  it('marks keys complete when every supported locale has non-blank text', () => {
    const [coverage] = getLocalizationCoverage(
      SUPPORTED_LOCALIZATION_LANGUAGES.map((language, index) =>
        createLocalizationRow({
          id: index + 1,
          language,
          messageText: `Message ${language}`,
        }),
      ),
    )

    expect(coverage.status).toBe('complete')
    expect(coverage.locales.every((locale) => locale.status === 'complete')).toBe(
      true,
    )
  })

  it('marks keys partial when some locales have text and others are missing', () => {
    const [coverage] = getLocalizationCoverage([
      createLocalizationRow({
        language: 'en',
        messageText: 'Account',
      }),
      createLocalizationRow({
        id: 2,
        language: 'pl',
        messageText: 'Konto',
      }),
    ])

    expect(coverage.status).toBe('partial')
    expect(
      coverage.locales.find((locale) => locale.language === 'de')?.status,
    ).toBe('missing')
  })

  it('marks requested key or locale filters missing when no row matches', () => {
    const [coverage] = getLocalizationCoverage([], {
      languageFilter: 'uk',
      messageKeyFilter: 'account.title',
    })

    expect(coverage.status).toBe('missing')
    expect(coverage.messageKey).toBe('account.title')
    expect(coverage.locales.every((locale) => locale.status === 'missing')).toBe(
      true,
    )
  })

  it('marks duplicate key and language rows as conflicts', () => {
    const [coverage] = getLocalizationCoverage([
      createLocalizationRow({
        id: 1,
        language: 'en',
        messageText: 'Account',
      }),
      createLocalizationRow({
        id: 2,
        language: 'en',
        messageText: 'Account copy',
      }),
    ])

    expect(coverage.status).toBe('conflict')
    expect(
      coverage.locales.find((locale) => locale.language === 'en')?.status,
    ).toBe('conflict')
  })

  it('marks coverage unknown when required page loading fails', () => {
    const [coverage] = getLocalizationCoverage([], {
      loadFailed: true,
      messageKeyFilter: 'account.title',
    })

    expect(coverage.status).toBe('unknown')
    expect(coverage.locales.every((locale) => locale.status === 'unknown')).toBe(
      true,
    )
  })
})

function createLocalizationRow(
  overrides: LocalizationResponse = {},
): LocalizationResponse {
  return {
    id: 1,
    messageKey: 'account.title',
    language: 'en',
    messageText: 'Account',
    description: 'Account page title',
    createdAt: '2026-06-07T09:00:00Z',
    updatedAt: '2026-06-07T09:00:00Z',
    ...overrides,
  }
}

function createSession(overrides: SessionResponse = {}): SessionResponse {
  return {
    authenticated: true,
    accountPath: '/api/account',
    loginProviders: [],
    logoutPath: '/api/session/logout',
    sessionCookie: {
      name: 'technical-interview-demo-session',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    },
    csrf: {
      enabled: true,
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN',
    },
    ...overrides,
  }
}
