import { FormEvent, useEffect, useMemo, useState } from 'react'

import {
  DEFAULT_BOOK_PAGE_SIZE,
  DEFAULT_BOOK_SORT,
  fetchBooks,
  fetchCategories,
  type Book,
  type BookPage,
  type Category,
} from '../api/catalog'

type LoadState<T> =
  | { status: 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'error'; message: string }

type BookFilters = {
  title: string
  author: string
  categories: readonly string[]
  page: number
}

const initialFilters: BookFilters = {
  title: '',
  author: '',
  categories: [],
  page: 0,
}

export function CatalogPanel() {
  const [categoriesState, setCategoriesState] = useState<LoadState<Category[]>>({
    status: 'loading',
  })
  const [booksState, setBooksState] = useState<LoadState<BookPage>>({
    status: 'loading',
  })
  const [filters, setFilters] = useState<BookFilters>(initialFilters)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftAuthor, setDraftAuthor] = useState('')

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

    fetchBooks({
      title: filters.title,
      author: filters.author,
      category: filters.categories,
      page: filters.page,
      size: DEFAULT_BOOK_PAGE_SIZE,
      sort: DEFAULT_BOOK_SORT,
    })
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
  }, [filters])

  const categories =
    categoriesState.status === 'ready' ? categoriesState.value : []
  const activeCategoryCount = filters.categories.length

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilters((current) => ({
      ...current,
      author: draftAuthor.trim(),
      page: 0,
      title: draftTitle.trim(),
    }))
  }

  function clearFilters() {
    setDraftAuthor('')
    setDraftTitle('')
    setFilters(initialFilters)
  }

  function toggleCategory(categoryName: string) {
    setFilters((current) => {
      const categories = current.categories.includes(categoryName)
        ? current.categories.filter((name) => name !== categoryName)
        : [...current.categories, categoryName]

      return {
        ...current,
        categories,
        page: 0,
      }
    })
  }

  function goToPage(page: number) {
    setFilters((current) => ({
      ...current,
      page: Math.max(0, page),
    }))
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
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
          />
        </label>
        <label>
          <span>Author</span>
          <input
            name="author"
            type="search"
            value={draftAuthor}
            onChange={(event) => setDraftAuthor(event.target.value)}
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
        selectedCategories={filters.categories}
        onToggleCategory={toggleCategory}
      />

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
          onPreviousPage={() => goToPage(filters.page - 1)}
          onNextPage={() => goToPage(filters.page + 1)}
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
  onPreviousPage,
  page,
}: {
  onNextPage: () => void
  onPreviousPage: () => void
  page: BookPage
}) {
  const books = page.content ?? []
  const pageNumber = page.number ?? 0
  const totalPages = page.totalPages ?? 0

  if (books.length === 0) {
    return <p className="session-message muted">No books match these filters.</p>
  }

  return (
    <div className="book-results">
      <div className="book-list">
        {books.map((book) => (
          <BookRow book={book} key={book.id ?? `${book.title}-${book.isbn}`} />
        ))}
      </div>

      <div className="pagination-controls" aria-label="Book pagination">
        <button type="button" disabled={page.first === true} onClick={onPreviousPage}>
          Previous
        </button>
        <span>
          Page {pageNumber + 1}
          {totalPages > 0 ? ` of ${totalPages}` : ''}
        </span>
        <button type="button" disabled={page.last === true} onClick={onNextPage}>
          Next
        </button>
      </div>
    </div>
  )
}

function BookRow({ book }: { book: Book }) {
  const categories = (book.categories ?? [])
    .map((category) => category.name)
    .filter(Boolean)

  return (
    <article className="book-row">
      <div>
        <h3>{book.title ?? 'Untitled book'}</h3>
        <p>{book.author ?? 'Unknown author'}</p>
      </div>
      <dl>
        <div>
          <dt>Year</dt>
          <dd>{book.publicationYear ?? 'Unknown'}</dd>
        </div>
        <div>
          <dt>ISBN</dt>
          <dd>{book.isbn ?? 'Unknown'}</dd>
        </div>
        <div>
          <dt>Categories</dt>
          <dd>{categories.length > 0 ? categories.join(', ') : 'None'}</dd>
        </div>
      </dl>
    </article>
  )
}

function getDisplayMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
