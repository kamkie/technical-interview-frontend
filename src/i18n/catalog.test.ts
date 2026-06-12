import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { LocalizationPage } from '../api/localizations'
import {
  UI_CATALOG_PAGE_SIZE,
  clearUiCatalogCache,
  invalidateUiCatalog,
  loadUiCatalog,
  subscribeToUiCatalogInvalidations,
} from './catalog'

describe('loadUiCatalog', () => {
  beforeEach(() => {
    clearUiCatalogCache()
  })

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

  it('serves the session cache for a repeated language without a second fetch', async () => {
    const fetchImplementation = createSinglePageFetch('pl')

    const firstCatalog = await loadUiCatalog('pl', { fetchImplementation })
    const secondCatalog = await loadUiCatalog('pl', { fetchImplementation })

    expect(secondCatalog).toBe(firstCatalog)
    expect(fetchImplementation).toHaveBeenCalledTimes(1)

    // The cache is keyed by language, so another language still loads.
    await loadUiCatalog('de', { fetchImplementation })

    expect(fetchImplementation).toHaveBeenCalledTimes(2)
  })

  it('shares one in-flight load between concurrent requests for the same language', async () => {
    let resolveFetch: ((response: Response) => void) | undefined
    const fetchImplementation = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve
        }),
    )

    const firstLoad = loadUiCatalog('pl', { fetchImplementation })
    const secondLoad = loadUiCatalog('pl', { fetchImplementation })

    expect(fetchImplementation).toHaveBeenCalledTimes(1)

    resolveFetch?.(
      Response.json(
        createPage({
          content: [
            { id: 1, messageKey: 'ui.nav.catalog', language: 'pl', messageText: 'Katalog' },
          ],
          last: true,
        }),
      ),
    )

    const [firstCatalog, secondCatalog] = await Promise.all([
      firstLoad,
      secondLoad,
    ])

    expect(firstCatalog).toBe(secondCatalog)
    expect(firstCatalog.get('ui.nav.catalog')).toBe('Katalog')
    expect(fetchImplementation).toHaveBeenCalledTimes(1)
  })

  it('does not cache failed loads, so the next request retries', async () => {
    // Two rejections: `fetchBackendRead` retries an unreachable GET once
    // before the failure propagates out of the load.
    const fetchImplementation = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockRejectedValueOnce(new Error('offline'))
      .mockImplementation(createSinglePageFetch('pl'))

    await expect(loadUiCatalog('pl', { fetchImplementation })).rejects.toThrow(
      'could not reach the backend service',
    )
    expect(fetchImplementation).toHaveBeenCalledTimes(2)

    const catalog = await loadUiCatalog('pl', { fetchImplementation })

    expect(catalog.get('ui.nav.catalog')).toBe('Katalog')
    expect(fetchImplementation).toHaveBeenCalledTimes(3)
  })

  it('refetches a language after its cache entry is invalidated', async () => {
    const fetchImplementation = createSinglePageFetch('pl')

    await loadUiCatalog('pl', { fetchImplementation })
    invalidateUiCatalog('de')
    await loadUiCatalog('pl', { fetchImplementation })

    // Invalidating another language leaves this entry cached.
    expect(fetchImplementation).toHaveBeenCalledTimes(1)

    invalidateUiCatalog('pl')

    const catalog = await loadUiCatalog('pl', { fetchImplementation })

    expect(catalog.get('ui.nav.catalog')).toBe('Katalog')
    expect(fetchImplementation).toHaveBeenCalledTimes(2)
  })

  it('notifies subscribed listeners with the invalidated language', () => {
    const firstListener = vi.fn()
    const secondListener = vi.fn()
    const unsubscribeFirst = subscribeToUiCatalogInvalidations(firstListener)
    const unsubscribeSecond = subscribeToUiCatalogInvalidations(secondListener)

    try {
      invalidateUiCatalog('pl')

      expect(firstListener).toHaveBeenCalledTimes(1)
      expect(firstListener).toHaveBeenCalledWith('pl')
      expect(secondListener).toHaveBeenCalledTimes(1)
      expect(secondListener).toHaveBeenCalledWith('pl')

      invalidateUiCatalog('de')

      expect(firstListener).toHaveBeenNthCalledWith(2, 'de')
      expect(secondListener).toHaveBeenNthCalledWith(2, 'de')
    } finally {
      unsubscribeFirst()
      unsubscribeSecond()
    }
  })

  it('stops notifying a listener after unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToUiCatalogInvalidations(listener)

    invalidateUiCatalog('pl')
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    invalidateUiCatalog('pl')

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('deletes the cache entry before notifying, so a listener-triggered load refetches', async () => {
    const fetchImplementation = createSinglePageFetch('pl')

    await loadUiCatalog('pl', { fetchImplementation })
    expect(fetchImplementation).toHaveBeenCalledTimes(1)

    let loadDuringNotification: Promise<unknown> | undefined
    const unsubscribe = subscribeToUiCatalogInvalidations(() => {
      loadDuringNotification = loadUiCatalog('pl', { fetchImplementation })
    })

    try {
      invalidateUiCatalog('pl')

      await loadDuringNotification

      expect(fetchImplementation).toHaveBeenCalledTimes(2)
    } finally {
      unsubscribe()
    }
  })
})

function createSinglePageFetch(language: string) {
  return vi.fn().mockImplementation(() =>
    Promise.resolve(
      Response.json(
        createPage({
          content: [
            {
              id: 1,
              messageKey: 'ui.nav.catalog',
              language,
              messageText: 'Katalog',
            },
          ],
          last: true,
        }),
      ),
    ),
  )
}

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
