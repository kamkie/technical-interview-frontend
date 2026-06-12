import {
  fetchLocalizations,
  type LocalizationFetchOptions,
  type LocalizationPage,
} from '../api/localizations'

// The backend clamps Spring page sizes to its configured maximum — exposed as
// `ConfigurationDetails.pagination.maxPageSize` in
// `docs/backend/approved-openapi.json` and serving 100 on the live backend —
// so requesting more than the clamp only shrinks the page actually returned.
export const UI_CATALOG_PAGE_SIZE = 100

export type UiCatalog = ReadonlyMap<string, string>

// Session-scoped catalog cache keyed by language: each catalog loads at most
// once per page load instead of on every provider mount and language switch.
// The cached value is the load promise itself, so concurrent requests for the
// same language (for example the dev StrictMode double effect) share one
// in-flight load. Failed loads evict themselves so the next request retries.
const catalogCache = new Map<string, Promise<UiCatalog>>()

// Serves the cached (or in-flight) catalog for the language, loading it on
// the first request of this session.
export function loadUiCatalog(
  language: string,
  options: LocalizationFetchOptions = {},
): Promise<UiCatalog> {
  const cached = catalogCache.get(language)

  if (cached) {
    return cached
  }

  const pending = fetchUiCatalog(language, options)

  catalogCache.set(language, pending)
  void pending.catch(() => {
    // Only evict our own entry: a later invalidation may already have made
    // room for a fresh load that this stale failure must not delete.
    if (catalogCache.get(language) === pending) {
      catalogCache.delete(language)
    }
  })

  return pending
}

// Invalidation channel, following the module-level listener-set pattern from
// `src/ui/asyncState.ts`: the i18n provider subscribes so a mutation touching
// the currently rendered language reloads its catalog in the same session
// instead of staying stale until the next full load or language switch.

type UiCatalogInvalidationListener = (language: string) => void

const uiCatalogInvalidationListeners = new Set<UiCatalogInvalidationListener>()

export function subscribeToUiCatalogInvalidations(
  listener: UiCatalogInvalidationListener,
) {
  uiCatalogInvalidationListeners.add(listener)

  return () => {
    uiCatalogInvalidationListeners.delete(listener)
  }
}

// Admin localization mutations call this with the saved or deleted row's
// language so the next catalog load for that language refetches instead of
// serving this session's cache. Listeners are notified after the entry is
// deleted, so a reload they trigger always refetches.
export function invalidateUiCatalog(language: string) {
  catalogCache.delete(language)

  for (const listener of [...uiCatalogInvalidationListeners]) {
    listener(language)
  }
}

// Test-only reset: drops every cached catalog so fetch-mocked specs sharing
// one module instance stay isolated.
export function clearUiCatalogCache() {
  catalogCache.clear()
}

// Loads every localization row for one language into a key -> text map. The
// first page reports the total page count, so the remaining pages load as one
// parallel wave; the sequential `last`-marker walk stays as the fallback when
// the count is missing or more rows appear behind the enumerated pages.
async function fetchUiCatalog(
  language: string,
  options: LocalizationFetchOptions,
): Promise<UiCatalog> {
  const catalog = new Map<string, string>()
  const firstPage = await fetchCatalogPage(language, 0, options)

  collectCatalogRows(catalog, firstPage)

  if (isLastCatalogPage(firstPage)) {
    return catalog
  }

  let nextSequentialPage = 1
  const totalPages = firstPage.totalPages

  if (typeof totalPages === 'number' && totalPages > 1) {
    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        fetchCatalogPage(language, index + 1, options),
      ),
    )

    for (const page of remainingPages) {
      collectCatalogRows(catalog, page)
    }

    const finalPage = remainingPages[remainingPages.length - 1]

    if (finalPage === undefined || isLastCatalogPage(finalPage)) {
      return catalog
    }

    nextSequentialPage = totalPages
  }

  for (let page = nextSequentialPage; ; page += 1) {
    const result = await fetchCatalogPage(language, page, options)

    collectCatalogRows(catalog, result)

    if (isLastCatalogPage(result)) {
      return catalog
    }
  }
}

async function fetchCatalogPage(
  language: string,
  page: number,
  options: LocalizationFetchOptions,
) {
  return fetchLocalizations(
    {
      language,
      page,
      size: UI_CATALOG_PAGE_SIZE,
      sort: ['messageKey,ASC'],
    },
    options,
  )
}

function collectCatalogRows(
  catalog: Map<string, string>,
  page: LocalizationPage,
) {
  for (const row of page.content ?? []) {
    // Rows with blank message text are skipped so they fall back to the
    // English defaults.
    if (row.messageKey && row.messageText?.trim()) {
      catalog.set(row.messageKey, row.messageText)
    }
  }
}

function isLastCatalogPage(page: LocalizationPage) {
  return page.last !== false || (page.content ?? []).length === 0
}
