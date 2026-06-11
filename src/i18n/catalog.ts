import {
  fetchLocalizations,
  type LocalizationFetchOptions,
} from '../api/localizations'

export const UI_CATALOG_PAGE_SIZE = 200

export type UiCatalog = ReadonlyMap<string, string>

// Loads every localization row for one language into a key -> text map,
// following Spring pagination until the backend reports the last page. Rows
// with blank message text are skipped so they fall back to English defaults.
export async function loadUiCatalog(
  language: string,
  options: LocalizationFetchOptions = {},
): Promise<UiCatalog> {
  const catalog = new Map<string, string>()

  for (let page = 0; ; page += 1) {
    const result = await fetchLocalizations(
      {
        language,
        page,
        size: UI_CATALOG_PAGE_SIZE,
        sort: ['messageKey,ASC'],
      },
      options,
    )
    const rows = result.content ?? []

    for (const row of rows) {
      if (row.messageKey && row.messageText?.trim()) {
        catalog.set(row.messageKey, row.messageText)
      }
    }

    if (result.last !== false || rows.length === 0) {
      return catalog
    }
  }
}
