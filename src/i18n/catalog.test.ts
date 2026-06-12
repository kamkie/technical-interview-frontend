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

  it('fetches the remaining enumerated pages as one parallel wave', async () => {
    let inFlightFollowUpRequests = 0
    let maxConcurrentFollowUpRequests = 0
    const fetchImplementation = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = new URL(String(input), 'http://localhost')
      const page = Number(url.searchParams.get('page'))

      if (page === 0) {
        return Promise.resolve(
          Response.json(
            createPage({
              content: [
                { id: 1, messageKey: 'ui.nav.catalog', language: 'pl', messageText: 'Katalog' },
              ],
              last: false,
              number: 0,
              totalPages: 3,
            }),
          ),
        )
      }

      inFlightFollowUpRequests += 1
      maxConcurrentFollowUpRequests = Math.max(
        maxConcurrentFollowUpRequests,
        inFlightFollowUpRequests,
      )

      // Resolving on a macrotask keeps both follow-up requests in flight at
      // once, so the concurrency counter proves the wave is parallel.
      return new Promise((resolve) => {
        setTimeout(() => {
          inFlightFollowUpRequests -= 1
          resolve(
            Response.json(
              createPage({
                content: [
                  {
                    id: page + 1,
                    messageKey: `ui.page-${page}`,
                    language: 'pl',
                    messageText: `Strona ${page}`,
                  },
                ],
                last: page === 2,
                number: page,
                totalPages: 3,
              }),
            ),
          )
        }, 10)
      })
    })

    const catalog = await loadUiCatalog('pl', { fetchImplementation })

    expect(catalog.get('ui.nav.catalog')).toBe('Katalog')
    expect(catalog.get('ui.page-1')).toBe('Strona 1')
    expect(catalog.get('ui.page-2')).toBe('Strona 2')
    expect(fetchImplementation).toHaveBeenCalledTimes(3)
    expect(maxConcurrentFollowUpRequests).toBe(2)
  })

  it('continues the sequential last-marker walk when rows appear behind the enumerated pages', async () => {
    const fetchImplementation = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = new URL(String(input), 'http://localhost')
      const page = Number(url.searchParams.get('page'))

      return Promise.resolve(
        Response.json(
          createPage({
            content: [
              {
                id: page + 1,
                messageKey: `ui.page-${page}`,
                language: 'pl',
                messageText: `Strona ${page}`,
              },
            ],
            // Pages 0-1 are enumerated by totalPages; page 1 still reports
            // more rows behind it, so the walk continues to page 2.
            last: page >= 2,
            number: page,
            totalPages: 2,
          }),
        ),
      )
    })

    const catalog = await loadUiCatalog('pl', { fetchImplementation })

    expect(catalog.get('ui.page-0')).toBe('Strona 0')
    expect(catalog.get('ui.page-1')).toBe('Strona 1')
    expect(catalog.get('ui.page-2')).toBe('Strona 2')
    expect(fetchImplementation).toHaveBeenCalledTimes(3)
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
