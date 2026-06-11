import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getActiveRequestLanguage, setActiveRequestLanguage } from '../api/http'
import { LOCALIZATIONS_PATH } from '../api/localizations'
import { I18nProvider } from './I18nProvider'
import { useI18n } from './useI18n'

afterEach(() => {
  vi.unstubAllGlobals()
  setActiveRequestLanguage(undefined)
  document.documentElement.lang = 'en'
  document.cookie = 'language=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
})

function Probe() {
  const { language, t } = useI18n()

  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="brand">{t('ui.shell.brand')}</span>
      <span data-testid="catalog-link">{t('ui.nav.catalog')}</span>
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
          size: 200,
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
  })

  it('serves English defaults without a mounted provider', () => {
    render(<Probe />)

    expect(screen.getByTestId('language')).toHaveTextContent('en')
    expect(screen.getByTestId('brand')).toHaveTextContent('Library Console')
  })
})
