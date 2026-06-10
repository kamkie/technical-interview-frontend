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
import { SortableColumnHeader } from '../ui/SortableColumnHeader'
import { StateBlock, StateMessage } from '../ui/StateBlock'
import { CategoryFilter } from './CategoryFilter'
import {
  DEFAULT_CATALOG_QUERY,
  PAGE_SIZE_OPTIONS,
  catalogQueryToBookSearchParams,
  catalogQueryToSearchParams,
  createCatalogFilterDraft,
  nextSortForField,
  parseCatalogSearchParams,
  type CatalogFilterDraft,
  type CatalogQueryState,
  type PageSize,
  type SortField,
  type SortValue,
} from './catalogQuery'

const LIVE_FILTER_DEBOUNCE_MS = 300

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
  // The fetching flag is derived by comparing the active query against the
  // last query whose request settled, so no effect has to set state twice.
  const [settledBooksQueryKey, setSettledBooksQueryKey] = useState<
    string | null
  >(null)
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
    const queryKey = catalogQueryToSearchParams(query).toString()

    fetchBooks(catalogQueryToBookSearchParams(query))
      .then((books) => {
        if (!ignore) {
          setSettledBooksQueryKey(queryKey)
          setBooksState({ status: 'ready', value: books })
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setSettledBooksQueryKey(queryKey)
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
  const isFetchingBooks = settledBooksQueryKey !== canonicalSearch

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

  // Text filters apply live: a short typing pause pushes the trimmed draft
  // into the URL-backed query. The draft is re-stored under the next route
  // key so in-progress text (including trailing spaces) survives the URL
  // change.
  useEffect(() => {
    if (
      filterDraft.title.trim() === query.title &&
      filterDraft.author.trim() === query.author &&
      filterDraft.isbn.trim() === query.isbn
    ) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      const nextQuery: CatalogQueryState = {
        ...query,
        author: filterDraft.author.trim(),
        isbn: filterDraft.isbn.trim(),
        page: 0,
        title: filterDraft.title.trim(),
      }

      setFilterDraftState({
        key: createFilterDraftKey(createCatalogFilterDraft(nextQuery)),
        value: filterDraft,
      })
      setSearchParams(catalogQueryToSearchParams(nextQuery))
    }, LIVE_FILTER_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [filterDraft, query, setSearchParams])

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
    <section className="catalog-panel" aria-label="Book catalog">
      <div className="list-card">
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
        </form>

        <div className="catalog-toolbar" aria-label="Catalog table controls">
          <CategoryFilter
            ariaLabel="Category filters"
            categories={categories}
            categoriesState={categoriesState}
            selectedCategories={query.categories}
            onToggleCategory={toggleCategory}
          />
          <div className="catalog-toolbar-status">
            {booksState.status === 'ready' && (
              // Refetch progress takes over the summary slot instead of a
              // dedicated status line, so the toolbar-to-table gap stays tight.
              <span aria-live="polite" className="toolbar-summary">
                {isFetchingBooks
                  ? 'Updating results…'
                  : formatBookWindow(booksState.value, query)}
              </span>
            )}
            {booksState.status === 'ready' && (
              <ToolbarPagination
                ariaLabel="Book pagination top"
                disabled={isFetchingBooks}
                page={booksState.value}
                query={query}
                onNextPage={() => goToPage(query.page + 1)}
                onPageSizeChange={changePageSize}
                onPreviousPage={() => goToPage(query.page - 1)}
              />
            )}
          </div>
        </div>

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
            busy={isFetchingBooks}
            hasActiveQuery={hasActiveQuery(query)}
            page={booksState.value}
            query={query}
            onClearFilters={clearFilters}
            onNextPage={() => goToPage(query.page + 1)}
            onPageChange={goToPage}
            onPageSizeChange={changePageSize}
            onPreviousPage={() => goToPage(query.page - 1)}
            onSortByField={sortByField}
          />
        )}
      </div>
    </section>
  )
}

function hasActiveQuery(query: CatalogQueryState) {
  return (
    query.title !== '' ||
    query.author !== '' ||
    query.isbn !== '' ||
    query.categories.length > 0
  )
}

function ToolbarPagination({
  ariaLabel,
  disabled,
  onNextPage,
  onPageSizeChange,
  onPreviousPage,
  page,
  query,
}: {
  ariaLabel: string
  disabled: boolean
  onNextPage: () => void
  onPageSizeChange: (size: PageSize) => void
  onPreviousPage: () => void
  page: BookPage
  query: CatalogQueryState
}) {
  const pageNumber = page.number ?? query.page
  const totalPages = page.totalPages ?? 0
  const first = page.first === true || pageNumber <= 0
  const last =
    page.last === true || (totalPages > 0 && pageNumber >= totalPages - 1)

  return (
    <PaginationControls
      ariaLabel={ariaLabel}
      disabled={disabled}
      first={first}
      last={last}
      pageNumber={pageNumber}
      querySize={query.size}
      totalPages={totalPages}
      variant="toolbar"
      onNextPage={onNextPage}
      onPageSizeChange={(size) => onPageSizeChange(size as PageSize)}
      onPreviousPage={onPreviousPage}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
    />
  )
}

function BookResults({
  busy,
  hasActiveQuery,
  onClearFilters,
  onNextPage,
  onPageChange,
  onPageSizeChange,
  onPreviousPage,
  onSortByField,
  page,
  query,
}: {
  busy: boolean
  hasActiveQuery: boolean
  onClearFilters: () => void
  onNextPage: () => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSize) => void
  onPreviousPage: () => void
  onSortByField: (field: SortField) => void
  page: BookPage
  query: CatalogQueryState
}) {
  const books = page.content ?? []
  const pageNumber = page.number ?? query.page
  const totalPages = page.totalPages ?? 0
  const first = page.first === true || pageNumber <= 0
  const last =
    page.last === true || (totalPages > 0 && pageNumber >= totalPages - 1)

  if (books.length === 0) {
    return (
      <div className="book-results">
        <StateBlock title="No catalog results" variant="empty">
          <StateMessage variant="empty">
            No books match these filters.
          </StateMessage>
          {hasActiveQuery && (
            <button
              className="secondary-button state-block-action"
              type="button"
              onClick={onClearFilters}
            >
              Clear filters
            </button>
          )}
        </StateBlock>
        <PaginationControls
          ariaLabel="Book pagination"
          disabled={busy}
          pageNumber={pageNumber}
          querySize={query.size}
          totalPages={totalPages}
          first={first}
          last={last}
          onNextPage={onNextPage}
          onPageChange={onPageChange}
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
        aria-busy={busy || undefined}
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
        disabled={busy}
        pageNumber={pageNumber}
        querySize={query.size}
        totalPages={totalPages}
        first={first}
        last={last}
        onNextPage={onNextPage}
        onPageChange={onPageChange}
        onPageSizeChange={(size) => onPageSizeChange(size as PageSize)}
        onPreviousPage={onPreviousPage}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
      />
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

function createFilterDraftKey(draft: CatalogFilterDraft) {
  return `${draft.title}\u0000${draft.author}\u0000${draft.isbn}`
}
