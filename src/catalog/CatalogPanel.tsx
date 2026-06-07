import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  fetchBooks,
  fetchCategories,
  type Book,
  type BookPage,
  type Category,
} from '../api/catalog'
import {
  DEFAULT_CATALOG_QUERY,
  PAGE_SIZE_OPTIONS,
  SORT_OPTIONS,
  catalogQueryToBookSearchParams,
  catalogQueryToSearchParams,
  createCatalogFilterDraft,
  getPrimarySort,
  getSortDirection,
  nextSortForField,
  parseCatalogSearchParams,
  type CatalogFilterDraft,
  type CatalogQueryState,
  type PageSize,
  type SortField,
  type SortValue,
} from './catalogQuery'

type LoadState<T> =
  | { status: 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'error'; message: string }

export function CatalogPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useMemo(
    () => parseCatalogSearchParams(searchParams),
    [searchParams],
  )
  const [categoriesState, setCategoriesState] = useState<LoadState<Category[]>>({
    status: 'loading',
  })
  const [booksState, setBooksState] = useState<LoadState<BookPage>>({
    status: 'loading',
  })
  const routeFilterDraft = createCatalogFilterDraft(query)
  const routeFilterDraftKey = createFilterDraftKey(routeFilterDraft)
  const [filterDraftState, setFilterDraftState] = useState(() => ({
    key: routeFilterDraftKey,
    value: routeFilterDraft,
  }))
  const filterDraft =
    filterDraftState.key === routeFilterDraftKey
      ? filterDraftState.value
      : routeFilterDraft

  useEffect(() => {
    let ignore = false

    fetchCategories()
      .then((categories) => {
        if (!ignore) {
          setCategoriesState({ status: 'ready', value: categories })
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setCategoriesState({
            status: 'error',
            message: getDisplayMessage(error, 'Categories could not be loaded.'),
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false

    fetchBooks(catalogQueryToBookSearchParams(query))
      .then((books) => {
        if (!ignore) {
          setBooksState({ status: 'ready', value: books })
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setBooksState({
            status: 'error',
            message: getDisplayMessage(error, 'Books could not be loaded.'),
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [query])

  const categories =
    categoriesState.status === 'ready' ? categoriesState.value : []
  const activeCategoryCount = query.categories.length
  const primarySort = getPrimarySort(query)

  function updateCatalogQuery(nextQuery: CatalogQueryState) {
    const nextSearchParams = catalogQueryToSearchParams(nextQuery)

    if (nextSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(nextSearchParams)
    }
  }

  function updateFilterDraft(update: Partial<CatalogFilterDraft>) {
    setFilterDraftState({
      key: routeFilterDraftKey,
      value: {
        ...filterDraft,
        ...update,
      },
    })
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateCatalogQuery({
      ...query,
      author: filterDraft.author.trim(),
      isbn: filterDraft.isbn.trim(),
      page: 0,
      title: filterDraft.title.trim(),
    })
  }

  function clearFilters() {
    updateFilterDraft(createCatalogFilterDraft(DEFAULT_CATALOG_QUERY))
    updateCatalogQuery(DEFAULT_CATALOG_QUERY)
  }

  function toggleCategory(categoryName: string) {
    const categories = query.categories.includes(categoryName)
      ? query.categories.filter((name) => name !== categoryName)
      : [...query.categories, categoryName]

    updateCatalogQuery({
      ...query,
      categories,
      page: 0,
    })
  }

  function goToPage(page: number) {
    updateCatalogQuery({
      ...query,
      page: Math.max(0, page),
    })
  }

  function changePageSize(size: PageSize) {
    updateCatalogQuery({
      ...query,
      page: 0,
      size,
    })
  }

  function changeSort(sort: SortValue) {
    updateCatalogQuery({
      ...query,
      page: 0,
      sort: [sort],
    })
  }

  function sortByField(field: SortField) {
    changeSort(nextSortForField(query, field))
  }

  return (
    <section className="catalog-panel" aria-labelledby="catalog-title">
      <div className="section-heading">
        <p className="eyebrow">Public catalog</p>
        <h2 id="catalog-title">Books</h2>
      </div>

      <form className="catalog-filters" onSubmit={handleFilterSubmit}>
        <label>
          <span>Title</span>
          <input
            name="title"
            type="search"
            value={filterDraft.title}
            onChange={(event) => updateFilterDraft({ title: event.target.value })}
          />
        </label>
        <label>
          <span>Author</span>
          <input
            name="author"
            type="search"
            value={filterDraft.author}
            onChange={(event) => updateFilterDraft({ author: event.target.value })}
          />
        </label>
        <label>
          <span>ISBN</span>
          <input
            name="isbn"
            type="search"
            value={filterDraft.isbn}
            onChange={(event) => updateFilterDraft({ isbn: event.target.value })}
          />
        </label>
        <div className="catalog-filter-actions">
          <button type="submit">Search</button>
          <button type="button" className="secondary-button" onClick={clearFilters}>
            Clear
          </button>
        </div>
      </form>

      <CategoryFilter
        categories={categories}
        categoriesState={categoriesState}
        selectedCategories={query.categories}
        onToggleCategory={toggleCategory}
      />

      <div className="catalog-controls" aria-label="Catalog table controls">
        <label>
          <span>Sort by</span>
          <select
            value={primarySort}
            onChange={(event) => changeSort(event.target.value as SortValue)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Rows per page</span>
          <select
            value={query.size}
            onChange={(event) => changePageSize(Number(event.target.value) as PageSize)}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="catalog-summary" aria-live="polite">
        {booksState.status === 'ready' && (
          <p>
            {booksState.value.totalElements ?? 0} books
            {activeCategoryCount > 0
              ? ` in ${activeCategoryCount} selected categories`
              : ''}
          </p>
        )}
      </div>

      {booksState.status === 'loading' && (
        <p className="session-message" role="status">
          Loading books...
        </p>
      )}

      {booksState.status === 'error' && (
        <p className="session-message error" role="alert">
          {booksState.message}
        </p>
      )}

      {booksState.status === 'ready' && (
        <BookResults
          page={booksState.value}
          query={query}
          onNextPage={() => goToPage(query.page + 1)}
          onPageSizeChange={changePageSize}
          onPreviousPage={() => goToPage(query.page - 1)}
          onSortByField={sortByField}
        />
      )}
    </section>
  )
}

function CategoryFilter({
  categories,
  categoriesState,
  onToggleCategory,
  selectedCategories,
}: {
  categories: readonly Category[]
  categoriesState: LoadState<Category[]>
  onToggleCategory: (categoryName: string) => void
  selectedCategories: readonly string[]
}) {
  const namedCategories = useMemo(
    () =>
      categories.filter(
        (category): category is Category & { name: string } =>
          Boolean(category.name),
      ),
    [categories],
  )

  return (
    <div className="category-filter" aria-label="Category filters">
      {categoriesState.status === 'loading' && (
        <p className="session-message" role="status">
          Loading categories...
        </p>
      )}

      {categoriesState.status === 'error' && (
        <p className="session-message error" role="alert">
          {categoriesState.message}
        </p>
      )}

      {categoriesState.status === 'ready' && namedCategories.length === 0 && (
        <p className="session-message muted">No categories available.</p>
      )}

      {namedCategories.map((category) => {
        const selected = selectedCategories.includes(category.name)

        return (
          <button
            aria-pressed={selected}
            className={`category-chip ${selected ? 'selected' : ''}`}
            key={category.id ?? category.name}
            type="button"
            onClick={() => onToggleCategory(category.name)}
          >
            {category.name}
          </button>
        )
      })}
    </div>
  )
}

function BookResults({
  onNextPage,
  onPageSizeChange,
  onPreviousPage,
  onSortByField,
  page,
  query,
}: {
  onNextPage: () => void
  onPageSizeChange: (size: PageSize) => void
  onPreviousPage: () => void
  onSortByField: (field: SortField) => void
  page: BookPage
  query: CatalogQueryState
}) {
  const books = page.content ?? []
  const pageNumber = page.number ?? query.page
  const pageSize = page.size ?? query.size
  const totalPages = page.totalPages ?? 0
  const first = page.first === true || pageNumber <= 0
  const last =
    page.last === true || (totalPages > 0 && pageNumber >= totalPages - 1)

  if (books.length === 0) {
    return (
      <div className="book-results">
        <p className="session-message muted">No books match these filters.</p>
        <PaginationControls
          pageNumber={pageNumber}
          pageSize={pageSize}
          querySize={query.size}
          totalPages={totalPages}
          first={first}
          last={last}
          onNextPage={onNextPage}
          onPageSizeChange={onPageSizeChange}
          onPreviousPage={onPreviousPage}
        />
      </div>
    )
  }

  return (
    <div className="book-results">
      <div className="catalog-table-scroll">
        <table className="catalog-table">
          <caption className="visually-hidden">Public books</caption>
          <thead>
            <tr>
              <SortableColumnHeader
                field="title"
                label="Title"
                query={query}
                onSortByField={onSortByField}
              />
              <SortableColumnHeader
                field="author"
                label="Author"
                query={query}
                onSortByField={onSortByField}
              />
              <SortableColumnHeader
                field="publicationYear"
                label="Publication year"
                query={query}
                onSortByField={onSortByField}
              />
              <SortableColumnHeader
                field="isbn"
                label="ISBN"
                query={query}
                onSortByField={onSortByField}
              />
              <th className="plain-column-header" scope="col">
                Categories
              </th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <BookTableRow
                book={book}
                key={book.id ?? `${book.title}-${book.isbn}`}
              />
            ))}
          </tbody>
        </table>
      </div>

      <PaginationControls
        pageNumber={pageNumber}
        pageSize={pageSize}
        querySize={query.size}
        totalPages={totalPages}
        first={first}
        last={last}
        onNextPage={onNextPage}
        onPageSizeChange={onPageSizeChange}
        onPreviousPage={onPreviousPage}
      />
    </div>
  )
}

function SortableColumnHeader({
  field,
  label,
  onSortByField,
  query,
}: {
  field: SortField
  label: string
  onSortByField: (field: SortField) => void
  query: CatalogQueryState
}) {
  const direction = getSortDirection(query, field)
  const ariaSort =
    direction === 'ASC' ? 'ascending' : direction === 'DESC' ? 'descending' : 'none'
  const indicator =
    direction === 'ASC' ? 'ascending' : direction === 'DESC' ? 'descending' : 'not sorted'

  return (
    <th aria-sort={ariaSort} scope="col">
      <button
        className="column-sort-button"
        type="button"
        onClick={() => onSortByField(field)}
      >
        <span>{label}</span>
        <span className="sort-indicator" aria-hidden="true">
          {direction === 'ASC' ? 'Asc' : direction === 'DESC' ? 'Desc' : '-'}
        </span>
        <span className="visually-hidden">{indicator}</span>
      </button>
    </th>
  )
}

function PaginationControls({
  first,
  last,
  onNextPage,
  onPageSizeChange,
  onPreviousPage,
  pageNumber,
  pageSize,
  querySize,
  totalPages,
}: {
  first: boolean
  last: boolean
  onNextPage: () => void
  onPageSizeChange: (size: PageSize) => void
  onPreviousPage: () => void
  pageNumber: number
  pageSize: number
  querySize: PageSize
  totalPages: number
}) {
  return (
    <div className="pagination-controls" aria-label="Book pagination">
      <button type="button" disabled={first} onClick={onPreviousPage}>
        Previous
      </button>
      <span>
        Page {pageNumber + 1}
        {totalPages > 0 ? ` of ${totalPages}` : ''} - {pageSize} rows
      </span>
      <label className="inline-page-size">
        <span className="visually-hidden">Rows per page</span>
        <select
          value={querySize}
          onChange={(event) => onPageSizeChange(Number(event.target.value) as PageSize)}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <button type="button" disabled={last} onClick={onNextPage}>
        Next
      </button>
    </div>
  )
}

function BookTableRow({ book }: { book: Book }) {
  const categories = (book.categories ?? [])
    .map((category) => category.name)
    .filter(Boolean)

  return (
    <tr>
      <th scope="row">{book.title ?? 'Untitled book'}</th>
      <td>{book.author ?? 'Unknown author'}</td>
      <td>{book.publicationYear ?? 'Unknown'}</td>
      <td>{book.isbn ?? 'Unknown'}</td>
      <td>{categories.length > 0 ? categories.join(', ') : 'None'}</td>
    </tr>
  )
}

function getDisplayMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function createFilterDraftKey(draft: CatalogFilterDraft) {
  return `${draft.title}\u0000${draft.author}\u0000${draft.isbn}`
}
