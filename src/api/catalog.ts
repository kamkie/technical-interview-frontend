import type { components } from './generated/openapi'
import {
  ApiRequestError,
  getBrowserAcceptLanguage,
  parseApiProblem,
  type FetchImplementation,
} from './http'

export const BOOKS_PATH = '/api/books' as const
export const CATEGORIES_PATH = '/api/categories' as const
export const DEFAULT_BOOK_PAGE_SIZE = 10
export const DEFAULT_BOOK_SORT = ['title,ASC'] as const

export type Book = components['schemas']['Book']
export type BookPage = components['schemas']['PageBook']
export type Category = components['schemas']['Category']

export type BookSearchParams = {
  title?: string
  author?: string
  isbn?: string
  year?: number
  yearFrom?: number
  yearTo?: number
  category?: readonly string[]
  page?: number
  size?: number
  sort?: readonly string[]
}

export type CatalogFetchOptions = {
  acceptLanguage?: string
  fetchImplementation?: FetchImplementation
}

export async function fetchBooks(
  params: BookSearchParams = {},
  options: CatalogFetchOptions = {},
): Promise<BookPage> {
  const path = buildBookSearchPath(params)

  return fetchCatalogJson<BookPage>('GET', path, options)
}

export async function fetchCategories(
  options: CatalogFetchOptions = {},
): Promise<Category[]> {
  return fetchCatalogJson<Category[]>('GET', CATEGORIES_PATH, options)
}

export function buildBookSearchPath(params: BookSearchParams = {}) {
  const search = new URLSearchParams()

  appendString(search, 'title', params.title)
  appendString(search, 'author', params.author)
  appendString(search, 'isbn', params.isbn)
  appendNumber(search, 'year', params.year)
  appendNumber(search, 'yearFrom', params.yearFrom)
  appendNumber(search, 'yearTo', params.yearTo)
  appendStringList(search, 'category', params.category)
  appendNumber(search, 'page', params.page)
  appendNumber(search, 'size', params.size)
  appendStringList(search, 'sort', params.sort)

  const query = search.toString()

  return query ? `${BOOKS_PATH}?${query}` : BOOKS_PATH
}

async function fetchCatalogJson<T>(
  method: 'GET',
  path: string,
  options: CatalogFetchOptions,
) {
  const response = await (options.fetchImplementation ?? globalThis.fetch)(path, {
    method,
    credentials: 'same-origin',
    headers: createReadHeaders(options.acceptLanguage),
  })

  if (!response.ok) {
    throw new ApiRequestError(
      method,
      path,
      response.status,
      response.statusText || 'Unknown status',
      await parseApiProblem(response),
    )
  }

  return (await response.json()) as T
}

function createReadHeaders(acceptLanguage = getBrowserAcceptLanguage()) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (acceptLanguage) {
    headers['Accept-Language'] = acceptLanguage
  }

  return headers
}

function appendString(
  search: URLSearchParams,
  name: string,
  value: string | undefined,
) {
  const trimmed = value?.trim()

  if (trimmed) {
    search.set(name, trimmed)
  }
}

function appendStringList(
  search: URLSearchParams,
  name: string,
  values: readonly string[] | undefined,
) {
  for (const value of values ?? []) {
    const trimmed = value.trim()

    if (trimmed) {
      search.append(name, trimmed)
    }
  }
}

function appendNumber(
  search: URLSearchParams,
  name: string,
  value: number | undefined,
) {
  if (value !== undefined && Number.isFinite(value)) {
    search.set(name, String(value))
  }
}
