import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { publishAccountUpdate } from '../account/useCurrentAccount'
import type { UserAccount } from '../api/account'
import { getActiveRequestLanguage, setActiveRequestLanguage } from '../api/http'
import { LOCALIZATIONS_PATH } from '../api/localizations'
import { readCookie, type SessionResponse } from '../api/session'
import { CatalogCoverage, I18nProvider } from './I18nProvider'
import { UI_MESSAGES } from './messages'
import { LANGUAGE_COOKIE_NAME, resolveLanguage } from './resolveLanguage'
import { useI18n } from './useI18n'

afterEach(() => {
  vi.unstubAllGlobals()
  setActiveRequestLanguage(undefined)
  document.documentElement.lang = 'en'
  document.cookie = 'language=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
})

function Probe() {
  const { clearAccountPreference, language, refreshLanguage, t } = useI18n()

  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="brand">{t('ui.shell.brand')}</span>
      <span data-testid="catalog-link">{t('ui.nav.catalog')}</span>
      <button type="button" onClick={refreshLanguage}>
        refresh-language
      </button>
      <button type="button" onClick={clearAccountPreference}>
        clear-account-preference
      </button>
      <CatalogCoverage>
        {(coverage) => <span data-testid="coverage">{String(coverage)}</span>}
      </CatalogCoverage>
    </div>
  )
}

describe('I18nProvider', () => {
  it('resolves the cookie language, loads its catalog, and serves catalog text', async () => {
    document.cookie = 'language=pl; path=/'

    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        Response.json({
          content: [
            {
              id: 1,
              messageKey: 'ui.shell.brand',
              language: 'pl',
              messageText: 'Konsola Biblioteki',
            },
          ],
          number: 0,
          size: 100,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )

    expect(screen.getByTestId('language')).toHaveTextContent('pl')
    expect(getActiveRequestLanguage()).toBe('pl')

    await waitFor(() => {
      expect(screen.getByTestId('brand')).toHaveTextContent('Konsola Biblioteki')
    })
    // A key the catalog does not cover falls back to the English default.
    expect(screen.getByTestId('catalog-link')).toHaveTextContent('Catalog')
    expect(document.documentElement.lang).toBe('pl')

    const [path] = fetchMock.mock.calls[0] as [string]

    expect(path).toContain(LOCALIZATIONS_PATH)
    expect(path).toContain('language=pl')
  })

  it('renders English defaults when the catalog load fails', async () => {
    document.cookie = 'language=de; path=/'

    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )

    expect(screen.getByTestId('language')).toHaveTextContent('de')

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })
    expect(screen.getByTestId('brand')).toHaveTextContent('Library Console')
    expect(screen.getByTestId('catalog-link')).toHaveTextContent('Catalog')
    // A failed load leaves no catalog evidence, so coverage stays complete.
    expect(screen.getByTestId('coverage')).toHaveTextContent(/^1$/)
  })

  it('serves English defaults without a mounted provider', () => {
    render(<Probe />)

    expect(screen.getByTestId('language')).toHaveTextContent('en')
    expect(screen.getByTestId('brand')).toHaveTextContent('Library Console')
    expect(screen.getByTestId('coverage')).toHaveTextContent(/^1$/)
  })

  it('reports coverage as the share of UI_MESSAGES keys the loaded catalog covers', async () => {
    document.cookie = 'language=pl; path=/'

    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        Response.json({
          content: [
            {
              id: 1,
              messageKey: 'ui.shell.brand',
              language: 'pl',
              messageText: 'Konsola Biblioteki',
            },
            {
              // Backend-owned keys outside UI_MESSAGES never count toward
              // chrome coverage.
              id: 2,
              messageKey: 'account.title',
              language: 'pl',
              messageText: 'Konto',
            },
          ],
          number: 0,
          size: 100,
          totalElements: 2,
          totalPages: 1,
          first: true,
          last: true,
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )

    // Until the catalog loads there is no evidence of a gap.
    expect(screen.getByTestId('coverage')).toHaveTextContent(/^1$/)

    await waitFor(() => {
      expect(screen.getByTestId('brand')).toHaveTextContent('Konsola Biblioteki')
    })
    expect(screen.getByTestId('coverage')).toHaveTextContent(
      String(1 / Object.keys(UI_MESSAGES).length),
    )
  })

  it('keeps the fallback language at full coverage regardless of catalog rows', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        Response.json({
          content: [
            {
              id: 1,
              messageKey: 'ui.shell.brand',
              language: 'en',
              messageText: 'Library Console Catalog Row',
            },
          ],
          number: 0,
          size: 100,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )

    expect(screen.getByTestId('language')).toHaveTextContent('en')

    await waitFor(() => {
      expect(screen.getByTestId('brand')).toHaveTextContent(
        'Library Console Catalog Row',
      )
    })
    expect(screen.getByTestId('coverage')).toHaveTextContent(/^1$/)
  })

  it('re-resolves and reloads the catalog when the account preference arrives', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) =>
      Promise.resolve(
        Response.json({
          content: String(input).includes('language=pl')
            ? [
                {
                  id: 1,
                  messageKey: 'ui.shell.brand',
                  language: 'pl',
                  messageText: 'Konsola Biblioteki',
                },
              ]
            : [],
          number: 0,
          size: 100,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )

    expect(screen.getByTestId('language')).toHaveTextContent('en')

    act(() => {
      publishAccountUpdate(createSession(), createAccount('pl'))
    })

    expect(screen.getByTestId('language')).toHaveTextContent('pl')
    expect(getActiveRequestLanguage()).toBe('pl')

    await waitFor(() => {
      expect(screen.getByTestId('brand')).toHaveTextContent('Konsola Biblioteki')
    })
    expect(document.documentElement.lang).toBe('pl')
  })

  it('re-resolves from the language cookie when refreshLanguage runs', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        Response.json({
          content: [],
          number: 0,
          size: 100,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )

    expect(screen.getByTestId('language')).toHaveTextContent('en')

    document.cookie = 'language=de; path=/'
    act(() => {
      screen.getByRole('button', { name: 'refresh-language' }).click()
    })

    expect(screen.getByTestId('language')).toHaveTextContent('de')
    expect(getActiveRequestLanguage()).toBe('de')
    await waitFor(() => {
      const paths = fetchMock.mock.calls.map(([input]) => String(input))

      expect(paths.some((path) => path.includes('language=de'))).toBe(true)
    })
  })

  it('persists the resolved account language in the negotiation cookie for the next load', () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        Response.json({
          content: [],
          number: 0,
          size: 100,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )

    act(() => {
      publishAccountUpdate(createSession(), createAccount('pl'))
    })

    expect(screen.getByTestId('language')).toHaveTextContent('pl')
    expect(readCookie(document.cookie, LANGUAGE_COOKIE_NAME)).toBe('pl')

    // Reload continuity: the next full page load resolves before
    // `/api/account` returns, so a fresh resolution without the account
    // preference must already land on the account's language at the cookie
    // tier — even against a different browser language.
    expect(
      resolveLanguage({
        cookieSource: document.cookie,
        browserLanguages: ['de-DE'],
      }),
    ).toBe('pl')
  })

  it('writes the resolved supported language, not the raw preference value', () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        Response.json({
          content: [],
          number: 0,
          size: 100,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )

    act(() => {
      publishAccountUpdate(createSession(), createAccount('pl-PL'))
    })

    expect(screen.getByTestId('language')).toHaveTextContent('pl')
    expect(readCookie(document.cookie, LANGUAGE_COOKIE_NAME)).toBe('pl')
  })

  it('leaves the negotiation cookie alone when the account has no supported preference', () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        Response.json({
          content: [],
          number: 0,
          size: 100,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )

    act(() => {
      publishAccountUpdate(createSession(), createAccount('xx'))
    })

    // Preference-less accounts keep following the cookie and browser tiers,
    // so pinning the browser language into the cookie would change behavior.
    expect(readCookie(document.cookie, LANGUAGE_COOKIE_NAME)).toBeUndefined()
    expect(
      resolveLanguage({
        cookieSource: document.cookie,
        browserLanguages: ['de'],
      }),
    ).toBe('de')
  })

  it('drops the account preference on clear so anonymous selection wins', () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        Response.json({
          content: [],
          number: 0,
          size: 100,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )

    act(() => {
      publishAccountUpdate(createSession(), createAccount('pl'))
    })
    expect(screen.getByTestId('language')).toHaveTextContent('pl')

    // Logout clears the remembered preference; the cookie tier wins again.
    document.cookie = 'language=de; path=/'
    act(() => {
      screen.getByRole('button', { name: 'clear-account-preference' }).click()
    })

    expect(screen.getByTestId('language')).toHaveTextContent('de')
    expect(getActiveRequestLanguage()).toBe('de')
  })
})

function createSession(): SessionResponse {
  return {
    authenticated: true,
  }
}

function createAccount(preferredLanguage: string): UserAccount {
  return {
    id: 42,
    login: 'kamkie',
    preferredLanguage,
  }
}
