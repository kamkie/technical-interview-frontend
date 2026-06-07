import {
  DEFAULT_BOOK_PAGE_SIZE,
  DEFAULT_BOOK_SORT,
  type BookSearchParams,
} from '../api/catalog'
import {
  appendRepeatedParams,
  appendStringParam,
  getFirstTrimmedValue,
  parseNonNegativeInteger,
  sameValues,
  uniqueTrimmedValues,
} from '../routing/queryParams'

export const CATALOG_ROUTE_PATH = '/catalog' as const

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const

export const SORT_OPTIONS = [
  { value: 'title,ASC', label: 'Title A-Z', field: 'title', direction: 'ASC' },
  { value: 'title,DESC', label: 'Title Z-A', field: 'title', direction: 'DESC' },
  { value: 'author,ASC', label: 'Author A-Z', field: 'author', direction: 'ASC' },
  { value: 'author,DESC', label: 'Author Z-A', field: 'author', direction: 'DESC' },
  {
    value: 'publicationYear,DESC',
    label: 'Newest first',
    field: 'publicationYear',
    direction: 'DESC',
  },
  {
    value: 'publicationYear,ASC',
    label: 'Oldest first',
    field: 'publicationYear',
    direction: 'ASC',
  },
  { value: 'isbn,ASC', label: 'ISBN ascending', field: 'isbn', direction: 'ASC' },
  { value: 'isbn,DESC', label: 'ISBN descending', field: 'isbn', direction: 'DESC' },
] as const

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]
export type SortValue = (typeof SORT_OPTIONS)[number]['value']
export type SortField = (typeof SORT_OPTIONS)[number]['field']
export type SortDirection = (typeof SORT_OPTIONS)[number]['direction']

export type CatalogQueryState = {
  title: string
  author: string
  isbn: string
  categories: readonly string[]
  page: number
  size: PageSize
  sort: readonly SortValue[]
}

export type CatalogFilterDraft = Pick<
  CatalogQueryState,
  'author' | 'isbn' | 'title'
>

const SORT_VALUES = new Set<string>(SORT_OPTIONS.map((option) => option.value))
const PAGE_SIZES = new Set<number>(PAGE_SIZE_OPTIONS)
const DEFAULT_SORT_VALUE = DEFAULT_BOOK_SORT[0] as SortValue

export const DEFAULT_CATALOG_QUERY: CatalogQueryState = {
  title: '',
  author: '',
  isbn: '',
  categories: [],
  page: 0,
  size: DEFAULT_BOOK_PAGE_SIZE as PageSize,
  sort: [DEFAULT_SORT_VALUE],
}

export function parseCatalogSearchParams(
  searchParams: URLSearchParams,
): CatalogQueryState {
  const sort = uniqueTrimmedValues(searchParams.getAll('sort')).filter(
    isSortValue,
  )

  return {
    title: getFirstTrimmedValue(searchParams, 'title'),
    author: getFirstTrimmedValue(searchParams, 'author'),
    isbn: getFirstTrimmedValue(searchParams, 'isbn'),
    categories: uniqueTrimmedValues(searchParams.getAll('category')),
    page: parseNonNegativeInteger(searchParams.get('page'), 0),
    size: parsePageSize(searchParams.get('size')),
    sort: sort.length > 0 ? sort : DEFAULT_CATALOG_QUERY.sort,
  }
}

export function catalogQueryToSearchParams(query: CatalogQueryState) {
  const searchParams = new URLSearchParams()

  appendStringParam(searchParams, 'title', query.title)
  appendStringParam(searchParams, 'author', query.author)
  appendStringParam(searchParams, 'isbn', query.isbn)
  appendRepeatedParams(searchParams, 'category', query.categories)

  if (query.page > 0) {
    searchParams.set('page', String(query.page))
  }

  if (query.size !== DEFAULT_CATALOG_QUERY.size) {
    searchParams.set('size', String(query.size))
  }

  const sort = query.sort.length > 0 ? query.sort : DEFAULT_CATALOG_QUERY.sort
  if (!sameValues(sort, DEFAULT_CATALOG_QUERY.sort)) {
    appendRepeatedParams(searchParams, 'sort', sort)
  }

  return searchParams
}

export function catalogQueryToBookSearchParams(
  query: CatalogQueryState,
): BookSearchParams {
  return {
    title: query.title,
    author: query.author,
    isbn: query.isbn,
    category: query.categories,
    page: query.page,
    size: query.size,
    sort: query.sort,
  }
}

export function createCatalogFilterDraft(
  query: CatalogQueryState,
): CatalogFilterDraft {
  return {
    title: query.title,
    author: query.author,
    isbn: query.isbn,
  }
}

export function getPrimarySort(query: CatalogQueryState): SortValue {
  return query.sort[0] ?? DEFAULT_SORT_VALUE
}

export function getSortDirection(
  query: CatalogQueryState,
  field: SortField,
): SortDirection | undefined {
  const [property, direction] = getPrimarySort(query).split(',')

  if (property !== field || !isSortDirection(direction)) {
    return undefined
  }

  return direction
}

export function nextSortForField(
  query: CatalogQueryState,
  field: SortField,
): SortValue {
  const currentDirection = getSortDirection(query, field)
  const nextDirection: SortDirection =
    currentDirection === 'ASC' ? 'DESC' : 'ASC'
  const nextSort = `${field},${nextDirection}`

  return isSortValue(nextSort) ? nextSort : DEFAULT_SORT_VALUE
}

function parsePageSize(value: string | null): PageSize {
  const parsed = parseNonNegativeInteger(value, DEFAULT_CATALOG_QUERY.size)

  return PAGE_SIZES.has(parsed) ? (parsed as PageSize) : DEFAULT_CATALOG_QUERY.size
}

function isSortValue(value: string): value is SortValue {
  return SORT_VALUES.has(value)
}

function isSortDirection(value: string | undefined): value is SortDirection {
  return value === 'ASC' || value === 'DESC'
}
