import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  fetchBooks,
  fetchCategories,
  type Book,
  type BookPage,
  type Category,
} from '../api/catalog'
import { getDisplayMessage, type LoadState } from '../ui/asyncState'
import { PaginationControls } from '../ui/PaginationControls'
import { StateBlock } from '../ui/StateBlock'
import { CategoryFilter } from './CategoryFilter'
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

export function CatalogPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useMemo(
    () => parseCatalogSearchParams(searchParams),
    [searchParams],
  )
  const currentSearch = searchParams.toString()
  const canonicalSearch = useMemo(
    () => catalogQueryToSearchParams(query).toString(),
    [query],
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
  const primarySort = getPrimarySort(query)

  useEffect(() => {
    if (canonicalSearch !== currentSearch) {
      setSearchParams(new URLSearchParams(canonicalSearch), { replace: true })
    }
  }, [canonicalSearch, currentSearch, setSearchParams])

  function updateCatalogQuery(nextQuery: CatalogQueryState) {
    const nextSearchParams = catalogQueryToSearchParams(nextQuery)

    if (nextSearchParams.toString() !== currentSearch) {
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
        <p className="section-description">
          Browse approved books with filters, categories, sorting, and
          pagination.
        </p>
      </div>

      <div className="route-state-panel" aria-label="Catalog status summary">
        <div>
          <span className="state-label">Current task</span>
          <span className="state-value">Find public catalog records</span>
        </div>
        <div>
          <span className="state-label">Query state</span>
          <span className="state-value">
            {getActiveFilterSummary(query).length > 0
              ? 'Filtered results'
              : 'Default catalog view'}
          </span>
        </div>
        <div>
          <span className="state-label">Primary actions</span>
          <span className="state-value">Search, filter, sort, paginate</span>
        </div>
      </div>

      <form
        aria-label="Catalog filters"
        className="catalog-filters"
        onSubmit={handleFilterSubmit}
      >
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
        ariaLabel="Category filters"
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

      {booksState.status === 'ready' && (
        <CatalogQuerySummary page={booksState.value} query={query} />
      )}

      {booksState.status === 'loading' && (
        <StateBlock
          message="Loading books..."
          title="Loading catalog results"
          variant="loading"
        />
      )}

      {booksState.status === 'error' && (
        <StateBlock
          message={booksState.message}
          title="Books could not be displayed"
          variant="error"
        />
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

function CatalogQuerySummary({
  page,
  query,
}: {
  page: BookPage
  query: CatalogQueryState
}) {
  const activeFilters = getActiveFilterSummary(query)

  return (
    <div className="catalog-summary" aria-live="polite">
      <p>{formatBookWindow(page, query)}</p>
      <dl className="catalog-query-details" aria-label="Active catalog query">
        <div>
          <dt>Filters</dt>
          <dd>
            {activeFilters.length > 0
              ? activeFilters.join('; ')
              : 'No filters applied'}
          </dd>
        </div>
        <div>
          <dt>Sort</dt>
          <dd>{getSortLabel(query)}</dd>
        </div>
        <div>
          <dt>Page</dt>
          <dd>{formatPageStatus(page, query)}</dd>
        </div>
        <div>
          <dt>Rows</dt>
          <dd>{query.size} per page</dd>
        </div>
        <div>
          <dt>Selected</dt>
          <dd>0 selected</dd>
        </div>
        <div>
          <dt>Visible</dt>
          <dd>{formatVisibleBookCount(page)}</dd>
        </div>
      </dl>
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
        <StateBlock
          message="No books match these filters."
          title="No catalog results"
          variant="empty"
        />
        <PaginationControls
          ariaLabel="Book pagination"
          pageNumber={pageNumber}
          pageSize={pageSize}
          querySize={query.size}
          totalPages={totalPages}
          first={first}
          last={last}
          onNextPage={onNextPage}
          onPageSizeChange={(size) => onPageSizeChange(size as PageSize)}
          onPreviousPage={onPreviousPage}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      </div>
    )
  }

  return (
    <div className="book-results">
      <div
        aria-label="Scrollable public books table"
        className="catalog-table-scroll"
        role="region"
        tabIndex={0}
      >
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
        ariaLabel="Book pagination"
        pageNumber={pageNumber}
        pageSize={pageSize}
        querySize={query.size}
        totalPages={totalPages}
        first={first}
        last={last}
        onNextPage={onNextPage}
        onPageSizeChange={(size) => onPageSizeChange(size as PageSize)}
        onPreviousPage={onPreviousPage}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
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
  const nextDirectionLabel = direction === 'ASC' ? 'descending' : 'ascending'
  const sortButtonLabel = `Sort by ${label}; currently ${indicator}. Activate to sort ${nextDirectionLabel}.`

  return (
    <th aria-sort={ariaSort} scope="col">
      <button
        aria-label={sortButtonLabel}
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

function getActiveFilterSummary(query: CatalogQueryState) {
  const filters: string[] = []

  if (query.title) {
    filters.push(`Title: ${query.title}`)
  }

  if (query.author) {
    filters.push(`Author: ${query.author}`)
  }

  if (query.isbn) {
    filters.push(`ISBN: ${query.isbn}`)
  }

  if (query.categories.length > 0) {
    filters.push(`Categories: ${query.categories.join(', ')}`)
  }

  return filters
}

function getSortLabel(query: CatalogQueryState) {
  const primarySort = getPrimarySort(query)
  const sortOption = SORT_OPTIONS.find((option) => option.value === primarySort)

  return sortOption?.label ?? primarySort
}

function formatBookWindow(page: BookPage, query: CatalogQueryState) {
  const totalElements = page.totalElements ?? 0
  const numberOfElements = page.numberOfElements ?? page.content?.length ?? 0

  if (totalElements <= 0 || numberOfElements <= 0) {
    return formatBookCount(totalElements)
  }

  const pageNumber = page.number ?? query.page
  const pageSize = page.size ?? query.size
  const start = pageNumber * pageSize + 1
  const end = Math.min(start + numberOfElements - 1, totalElements)

  return `Showing ${start}-${end} of ${formatBookCount(totalElements)}`
}

function formatBookCount(count: number) {
  return `${count} ${count === 1 ? 'book' : 'books'}`
}

function formatVisibleBookCount(page: BookPage) {
  const count = page.numberOfElements ?? page.content?.length ?? 0

  return `${count} visible`
}

function formatPageStatus(page: BookPage, query: CatalogQueryState) {
  const pageNumber = (page.number ?? query.page) + 1
  const totalPages = page.totalPages ?? 0

  return totalPages > 0 ? `Page ${pageNumber} of ${totalPages}` : `Page ${pageNumber}`
}

function createFilterDraftKey(draft: CatalogFilterDraft) {
  return `${draft.title}\u0000${draft.author}\u0000${draft.isbn}`
}
