import type { components } from './generated/openapi'
import {
  ApiRequestError,
  getBrowserAcceptLanguage,
  parseApiProblem,
  type FetchImplementation,
} from './http'
import { getCsrfHeaders, type SessionResponse } from './session'

export const BOOKS_PATH = '/api/books' as const
export const CATEGORIES_PATH = '/api/categories' as const
export const DEFAULT_BOOK_PAGE_SIZE = 10
export const DEFAULT_BOOK_SORT = ['title,ASC'] as const

export type Book = components['schemas']['Book']
export type BookPage = components['schemas']['PageBook']
export type BookCreateRequest = components['schemas']['BookCreateRequest']
export type BookUpdateRequest = components['schemas']['BookUpdateRequest']
export type Category = components['schemas']['Category']
export type CategoryCreateRequest = components['schemas']['CategoryCreateRequest']
export type CategoryUpdateRequest = components['schemas']['CategoryUpdateRequest']

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

export type CatalogMutationOptions = {
  cookieSource?: string
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

export async function fetchBook(
  id: number,
  options: CatalogFetchOptions = {},
): Promise<Book> {
  return fetchCatalogJson<Book>('GET', getBookPath(id), options)
}

export async function createBook(
  session: SessionResponse,
  request: BookCreateRequest,
  options: CatalogMutationOptions = {},
): Promise<Book> {
  return fetchCatalogMutationJson<Book>('POST', BOOKS_PATH, session, request, options)
}

export async function updateBook(
  session: SessionResponse,
  id: number,
  request: BookUpdateRequest,
  options: CatalogMutationOptions = {},
): Promise<Book> {
  return fetchCatalogMutationJson<Book>(
    'PUT',
    getBookPath(id),
    session,
    request,
    options,
  )
}

export async function deleteBook(
  session: SessionResponse,
  id: number,
  options: CatalogMutationOptions = {},
): Promise<void> {
  await fetchCatalogMutationNoContent('DELETE', getBookPath(id), session, options)
}

export async function createCategory(
  session: SessionResponse,
  request: CategoryCreateRequest,
  options: CatalogMutationOptions = {},
): Promise<Category> {
  return fetchCatalogMutationJson<Category>(
    'POST',
    CATEGORIES_PATH,
    session,
    request,
    options,
  )
}

export async function updateCategory(
  session: SessionResponse,
  id: number,
  request: CategoryUpdateRequest,
  options: CatalogMutationOptions = {},
): Promise<Category> {
  return fetchCatalogMutationJson<Category>(
    'PUT',
    getCategoryPath(id),
    session,
    request,
    options,
  )
}

export async function deleteCategory(
  session: SessionResponse,
  id: number,
  options: CatalogMutationOptions = {},
): Promise<void> {
  await fetchCatalogMutationNoContent(
    'DELETE',
    getCategoryPath(id),
    session,
    options,
  )
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

export function getBookPath(id: number) {
  return `${BOOKS_PATH}/${encodeURIComponent(String(id))}`
}

export function getCategoryPath(id: number) {
  return `${CATEGORIES_PATH}/${encodeURIComponent(String(id))}`
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

async function fetchCatalogMutationJson<T>(
  method: 'POST' | 'PUT',
  path: string,
  session: SessionResponse,
  body: object,
  options: CatalogMutationOptions,
) {
  const response = await fetchCatalogMutation(
    method,
    path,
    session,
    {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    options,
  )

  return (await response.json()) as T
}

async function fetchCatalogMutationNoContent(
  method: 'DELETE',
  path: string,
  session: SessionResponse,
  options: CatalogMutationOptions,
) {
  await fetchCatalogMutation(method, path, session, {}, options)
}

async function fetchCatalogMutation(
  method: 'POST' | 'PUT' | 'DELETE',
  path: string,
  session: SessionResponse,
  init: Pick<RequestInit, 'body' | 'headers'>,
  options: CatalogMutationOptions,
) {
  if (session.authenticated !== true) {
    throw new Error('Catalog changes require an authenticated session.')
  }

  const response = await (options.fetchImplementation ?? globalThis.fetch)(path, {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...init.headers,
      ...getCsrfHeaders(session, options.cookieSource),
    },
    body: init.body,
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

  return response
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
