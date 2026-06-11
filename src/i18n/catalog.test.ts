import { describe, expect, it, vi } from 'vitest'

import type { LocalizationPage } from '../api/localizations'
import { UI_CATALOG_PAGE_SIZE, loadUiCatalog } from './catalog'

describe('loadUiCatalog', () => {
  it('follows pagination until the last page and maps keys to text', async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          createPage({
            content: [
              { id: 1, messageKey: 'ui.nav.catalog', language: 'pl', messageText: 'Katalog' },
            ],
            last: false,
            number: 0,
          }),
        ),
      )
      .mockResolvedValueOnce(
        Response.json(
          createPage({
            content: [
              { id: 2, messageKey: 'ui.shell.brand', language: 'pl', messageText: 'Konsola Biblioteki' },
            ],
            last: true,
            number: 1,
          }),
        ),
      )

    const catalog = await loadUiCatalog('pl', { fetchImplementation })

    expect(catalog.get('ui.nav.catalog')).toBe('Katalog')
    expect(catalog.get('ui.shell.brand')).toBe('Konsola Biblioteki')
    expect(fetchImplementation).toHaveBeenCalledTimes(2)

    const [firstPath] = fetchImplementation.mock.calls[0] as [string]
    const [secondPath] = fetchImplementation.mock.calls[1] as [string]

    expect(firstPath).toContain('language=pl')
    expect(firstPath).toContain(`size=${UI_CATALOG_PAGE_SIZE}`)
    expect(firstPath).toContain('page=0')
    expect(secondPath).toContain('page=1')
  })

  it('skips rows with blank text so they fall back to English defaults', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      Response.json(
        createPage({
          content: [
            { id: 1, messageKey: 'ui.nav.catalog', language: 'pl', messageText: '   ' },
            { id: 2, messageKey: 'ui.nav.users', language: 'pl', messageText: 'Użytkownicy' },
          ],
          last: true,
        }),
      ),
    )

    const catalog = await loadUiCatalog('pl', { fetchImplementation })

    expect(catalog.has('ui.nav.catalog')).toBe(false)
    expect(catalog.get('ui.nav.users')).toBe('Użytkownicy')
  })

  it('stops on an empty page without a last marker', async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(Response.json(createPage({ content: [], last: undefined })))

    const catalog = await loadUiCatalog('de', { fetchImplementation })

    expect(catalog.size).toBe(0)
    expect(fetchImplementation).toHaveBeenCalledTimes(1)
  })
})

function createPage(overrides: Partial<LocalizationPage>): LocalizationPage {
  return {
    content: [],
    number: 0,
    size: UI_CATALOG_PAGE_SIZE,
    totalElements: overrides.content?.length ?? 0,
    totalPages: 1,
    first: true,
    last: true,
    ...overrides,
  }
}
