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

// Loads every localization row for one language into a key -> text map. The
// first page reports the total page count, so the remaining pages load as one
// parallel wave; the sequential `last`-marker walk stays as the fallback when
// the count is missing or more rows appear behind the enumerated pages.
export async function loadUiCatalog(
  language: string,
  options: LocalizationFetchOptions = {},
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
