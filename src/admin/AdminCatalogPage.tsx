import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  createBook,
  createCategory,
  deleteBook,
  deleteCategory,
  fetchBook,
  fetchBooks,
  fetchCategories,
  updateBook,
  updateCategory,
  type Book,
  type BookPage,
  type Category,
} from '../api/catalog'
import { useCurrentAccount } from '../account/useCurrentAccount'
import type { SessionResponse } from '../api/session'
import { hasAdminRole } from '../auth/roles'
import { CategoryFilter } from '../catalog/CategoryFilter'
import {
  PAGE_SIZE_OPTIONS,
  catalogQueryToBookSearchParams,
  catalogQueryToSearchParams,
  createCatalogFilterDraft,
  nextSortForField,
  parseCatalogSearchParams,
  type CatalogFilterDraft,
  type CatalogQueryState,
  type PageSize,
  type SortDirection,
  type SortField,
  type SortValue,
} from '../catalog/catalogQuery'
import {
  getDisplayMessage,
  type LoadState,
  type MutationState,
} from '../ui/asyncState'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { MutationFeedback } from '../ui/MutationFeedback'
import { PaginationControls } from '../ui/PaginationControls'
import { SortableColumnHeader, SortToggleHeader } from '../ui/SortableColumnHeader'
import { StateBlock } from '../ui/StateBlock'
import { Tabs } from '../ui/Tabs'

export const ADMIN_CATALOG_ROUTE_PATH = '/admin/catalog' as const
const LIVE_FILTER_DEBOUNCE_MS = 300
const EMPTY_CATEGORIES: readonly Category[] = []
const CATALOG_TAB_PARAM = 'tab'
const CATALOG_SECTIONS = ['books', 'categories'] as const
const DEFAULT_CATALOG_SECTION: CatalogSection = 'books'

type CatalogSection = (typeof CATALOG_SECTIONS)[number]

type BookFormMode =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; bookId: number; version: number }

type OpenBookFormMode = Exclude<BookFormMode, { type: 'closed' }>

type BookFormDraft = {
  author: string
  categories: readonly string[]
  isbn: string
  publicationYear: string
  title: string
}

type CategoryEditState = {
  id: number
  name: string
}

export function AdminCatalogPage({ session }: { session: SessionResponse }) {
  const accountState = useCurrentAccount(session)

  return (
    <section className="admin-catalog-panel" aria-label="Catalog administration">
      {accountState.status === 'loading' && (
        <StateBlock
          message="Loading admin access..."
          title="Checking admin access"
          variant="loading"
        />
      )}

      {accountState.status === 'error' && (
        <StateBlock
          message={accountState.message}
          title="Admin access unavailable"
          variant="error"
        />
      )}

      {accountState.status === 'ready' &&
        (hasAdminRole(accountState.value) ? (
          <AdminCatalogManager session={session} />
        ) : (
          <StateBlock
            message="Admin access is required for catalog management."
            title="Admin role required"
            variant="error"
          />
        ))}
    </section>
  )
}

function AdminCatalogManager({ session }: { session: SessionResponse }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSection = parseCatalogSection(searchParams)
  const querySearch = useMemo(() => {
    const params = new URLSearchParams(searchParams)

    params.delete(CATALOG_TAB_PARAM)

    return params.toString()
  }, [searchParams])
  const query = useMemo(
    () => parseCatalogSearchParams(new URLSearchParams(querySearch)),
    [querySearch],
  )
  const currentSearch = searchParams.toString()
  const canonicalSearch = useMemo(() => {
    const params = catalogQueryToSearchParams(query)

    appendCatalogSectionParam(params, activeSection)

    return params.toString()
  }, [activeSection, query])
  const [categoriesState, setCategoriesState] = useState<LoadState<Category[]>>({
    status: 'loading',
  })
  const [booksState, setBooksState] = useState<LoadState<BookPage>>({
    status: 'loading',
  })
  const [booksRefreshKey, setBooksRefreshKey] = useState(0)
  const [categoriesRefreshKey, setCategoriesRefreshKey] = useState(0)
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
  const [bookDraft, setBookDraft] = useState<BookFormDraft>(() =>
    createEmptyBookDraft(),
  )
  const [bookFormMode, setBookFormMode] = useState<BookFormMode>({
    type: 'closed',
  })
  const [bookMutationState, setBookMutationState] = useState<MutationState>({
    status: 'idle',
  })
  const [categoryDraft, setCategoryDraft] = useState('')
  const [categoryEditState, setCategoryEditState] =
    useState<CategoryEditState | null>(null)
  const [categoryMutationState, setCategoryMutationState] =
    useState<MutationState>({
      status: 'idle',
    })
  const [pendingBookDelete, setPendingBookDelete] = useState<Book | null>(null)
  const [pendingCategoryDelete, setPendingCategoryDelete] =
    useState<Category | null>(null)
  // Only one confirm dialog can be open at a time, so book and category
  // deletes share the focus-return target.
  const deleteReturnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let ignore = false

    fetchCategories()
      .then((categories) => {
        if (!ignore) {
          setCategoriesState({
            status: 'ready',
            value: sortCategories(categories),
          })
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
  }, [categoriesRefreshKey])

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
  }, [booksRefreshKey, query])

  const categories =
    categoriesState.status === 'ready' ? categoriesState.value : EMPTY_CATEGORIES
  const namedCategories = useMemo(
    () =>
      categories.filter(
        (category): category is Category & { name: string } =>
          Boolean(category.name),
      ),
    [categories],
  )
  useEffect(() => {
    if (canonicalSearch !== currentSearch) {
      setSearchParams(new URLSearchParams(canonicalSearch), { replace: true })
    }
  }, [canonicalSearch, currentSearch, setSearchParams])

  function refreshBooks() {
    setBooksState({ status: 'loading' })
    setBooksRefreshKey((key) => key + 1)
  }

  function refreshCategories() {
    setCategoriesState({ status: 'loading' })
    setCategoriesRefreshKey((key) => key + 1)
  }

  function updateCatalogQuery(nextQuery: CatalogQueryState) {
    const nextSearchParams = catalogQueryToSearchParams(nextQuery)

    appendCatalogSectionParam(nextSearchParams, activeSection)

    if (nextSearchParams.toString() !== currentSearch) {
      setSearchParams(nextSearchParams)
    }
  }

  function changeSection(sectionId: string) {
    const nextSearchParams = catalogQueryToSearchParams(query)

    appendCatalogSectionParam(nextSearchParams, normalizeCatalogSection(sectionId))

    if (nextSearchParams.toString() !== currentSearch) {
      setSearchParams(nextSearchParams, { replace: true })
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
      const nextSearchParams = catalogQueryToSearchParams(nextQuery)

      appendCatalogSectionParam(nextSearchParams, activeSection)
      setFilterDraftState({
        key: createFilterDraftKey(createCatalogFilterDraft(nextQuery)),
        value: filterDraft,
      })
      setSearchParams(nextSearchParams)
    }, LIVE_FILTER_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [activeSection, filterDraft, query, setSearchParams])

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

  function toggleFilterCategory(categoryName: string) {
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

  function updateBookDraft(update: Partial<BookFormDraft>) {
    setBookDraft((current) => ({
      ...current,
      ...update,
    }))
    setBookMutationState({ status: 'idle' })
  }

  function toggleBookCategory(categoryName: string) {
    setBookDraft((current) => {
      const categories = current.categories.includes(categoryName)
        ? current.categories.filter((name) => name !== categoryName)
        : [...current.categories, categoryName]

      return {
        ...current,
        categories,
      }
    })
    setBookMutationState({ status: 'idle' })
  }

  async function handleBookSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBookMutationState({ status: 'submitting' })

    try {
      const publicationYear = parsePublicationYear(bookDraft.publicationYear)

      if (bookFormMode.type === 'edit') {
        const updatedBook = await updateBook(
          session,
          bookFormMode.bookId,
          {
            author: bookDraft.author.trim(),
            categories: [...bookDraft.categories],
            publicationYear,
            title: bookDraft.title.trim(),
            version: bookFormMode.version,
          },
        )

        setBooksState((current) =>
          current.status === 'ready'
            ? {
                status: 'ready',
                value: replaceBookInPage(current.value, updatedBook),
              }
            : current,
        )
        setBookDraft(createEmptyBookDraft())
        setBookFormMode({ type: 'closed' })
        setBookMutationState({
          status: 'success',
          message: 'Book updated.',
        })
      } else {
        await createBook(session, {
          author: bookDraft.author.trim(),
          categories: [...bookDraft.categories],
          isbn: bookDraft.isbn.trim(),
          publicationYear,
          title: bookDraft.title.trim(),
        })

        setBookDraft(createEmptyBookDraft())
        setBookMutationState({
          status: 'success',
          message: 'Book created.',
        })
        refreshBooks()
      }
    } catch (error: unknown) {
      setBookMutationState({
        status: 'error',
        message: getDisplayMessage(error, 'Book could not be saved.'),
      })
    }
  }

  async function startBookEdit(book: Book) {
    if (book.id === undefined) {
      return
    }

    setBookMutationState({ status: 'submitting' })

    try {
      const currentBook = await fetchBook(book.id)

      setBookDraft(createBookDraft(currentBook))
      setBookFormMode({
        type: 'edit',
        bookId: book.id,
        version: getEditableBookVersion(currentBook),
      })
      setBookMutationState({ status: 'idle' })
    } catch (error: unknown) {
      setBookMutationState({
        status: 'error',
        message: getDisplayMessage(error, 'Book could not be loaded.'),
      })
    }
  }

  async function reloadEditingBook() {
    if (bookFormMode.type !== 'edit') {
      return
    }

    setBookMutationState({ status: 'submitting' })

    try {
      const currentBook = await fetchBook(bookFormMode.bookId)

      setBookDraft(createBookDraft(currentBook))
      setBookFormMode({
        type: 'edit',
        bookId: bookFormMode.bookId,
        version: getEditableBookVersion(currentBook),
      })
      setBookMutationState({
        status: 'success',
        message: 'Book reloaded.',
      })
    } catch (error: unknown) {
      setBookMutationState({
        status: 'error',
        message: getDisplayMessage(error, 'Book could not be reloaded.'),
      })
    }
  }

  function requestBookDelete(book: Book, opener: HTMLElement) {
    if (book.id === undefined) {
      return
    }

    deleteReturnFocusRef.current = opener
    setPendingBookDelete(book)
  }

  function closeBookDeleteDialog() {
    const opener = deleteReturnFocusRef.current

    deleteReturnFocusRef.current = null
    setPendingBookDelete(null)
    window.requestAnimationFrame(() => {
      if (opener?.isConnected) {
        opener.focus()
      }
    })
  }

  async function confirmBookDelete() {
    const book = pendingBookDelete

    closeBookDeleteDialog()

    if (book?.id === undefined) {
      return
    }

    const bookId = book.id

    setBookMutationState({ status: 'submitting' })

    try {
      await deleteBook(session, book.id)

      if (bookFormMode.type === 'edit' && bookFormMode.bookId === bookId) {
        setBookDraft(createEmptyBookDraft())
        setBookFormMode({ type: 'closed' })
      }

      setBooksState((current) => {
        if (current.status !== 'ready') {
          return current
        }

        const content = current.value.content ?? []

        if (content.length <= 1 && query.page > 0) {
          goToPage(query.page - 1)

          return current
        }

        return {
          status: 'ready',
          value: removeBookFromPage(current.value, bookId),
        }
      })
      setBookMutationState({
        status: 'success',
        message: 'Book deleted.',
      })
    } catch (error: unknown) {
      setBookMutationState({
        status: 'error',
        message: getDisplayMessage(error, 'Book could not be deleted.'),
      })
    }
  }

  function openBookCreate() {
    setBookDraft(createEmptyBookDraft())
    setBookFormMode({ type: 'create' })
    setBookMutationState({ status: 'idle' })
  }

  function closeBookForm() {
    setBookDraft(createEmptyBookDraft())
    setBookFormMode({ type: 'closed' })
    setBookMutationState({ status: 'idle' })
  }

  async function handleCategoryCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCategoryMutationState({ status: 'submitting' })

    try {
      const createdCategory = await createCategory(session, {
        name: categoryDraft.trim(),
      })

      setCategoriesState((current) =>
        current.status === 'ready'
          ? {
              status: 'ready',
              value: upsertCategory(current.value, createdCategory),
            }
          : current,
      )
      setCategoryDraft('')
      setCategoryMutationState({
        status: 'success',
        message: 'Category created.',
      })
    } catch (error: unknown) {
      setCategoryMutationState({
        status: 'error',
        message: getDisplayMessage(error, 'Category could not be created.'),
      })
    }
  }

  async function saveCategoryEdit(category: Category) {
    if (category.id === undefined || categoryEditState === null) {
      return
    }

    const previousName = category.name

    setCategoryMutationState({ status: 'submitting' })

    try {
      const updatedCategory = await updateCategory(session, category.id, {
        name: categoryEditState.name.trim(),
      })

      setCategoriesState((current) =>
        current.status === 'ready'
          ? {
              status: 'ready',
              value: upsertCategory(current.value, updatedCategory),
            }
          : current,
      )
      syncRenamedCategory(previousName, updatedCategory.name)
      setCategoryEditState(null)
      setCategoryMutationState({
        status: 'success',
        message: 'Category updated.',
      })
      refreshBooks()
    } catch (error: unknown) {
      setCategoryMutationState({
        status: 'error',
        message: getDisplayMessage(error, 'Category could not be updated.'),
      })
    }
  }

  function requestCategoryDelete(category: Category, opener: HTMLElement) {
    if (category.id === undefined) {
      return
    }

    deleteReturnFocusRef.current = opener
    setPendingCategoryDelete(category)
  }

  function closeCategoryDeleteDialog() {
    const opener = deleteReturnFocusRef.current

    deleteReturnFocusRef.current = null
    setPendingCategoryDelete(null)
    window.requestAnimationFrame(() => {
      if (opener?.isConnected) {
        opener.focus()
      }
    })
  }

  async function confirmCategoryDelete() {
    const category = pendingCategoryDelete

    closeCategoryDeleteDialog()

    if (category?.id === undefined) {
      return
    }

    setCategoryMutationState({ status: 'submitting' })

    try {
      await deleteCategory(session, category.id)

      setCategoriesState((current) =>
        current.status === 'ready'
          ? {
              status: 'ready',
              value: current.value.filter((item) => item.id !== category.id),
            }
          : current,
      )
      removeCategoryFromLocalState(category.name)
      setCategoryMutationState({
        status: 'success',
        message: 'Category deleted.',
      })
      refreshBooks()
    } catch (error: unknown) {
      setCategoryMutationState({
        status: 'error',
        message: getDisplayMessage(error, 'Category could not be deleted.'),
      })
    }
  }

  function syncRenamedCategory(
    previousName: string | undefined,
    nextName: string | undefined,
  ) {
    if (!previousName || !nextName) {
      return
    }

    setBookDraft((current) => ({
      ...current,
      categories: current.categories.map((name) =>
        name === previousName ? nextName : name,
      ),
    }))

    if (query.categories.includes(previousName)) {
      updateCatalogQuery({
        ...query,
        categories: query.categories.map((name) =>
          name === previousName ? nextName : name,
        ),
        page: 0,
      })
    }
  }

  function removeCategoryFromLocalState(categoryName: string | undefined) {
    if (!categoryName) {
      return
    }

    setBookDraft((current) => ({
      ...current,
      categories: current.categories.filter((name) => name !== categoryName),
    }))

    if (query.categories.includes(categoryName)) {
      updateCatalogQuery({
        ...query,
        categories: query.categories.filter((name) => name !== categoryName),
        page: 0,
      })
    }

    if (categoryEditState?.name === categoryName) {
      setCategoryEditState(null)
    }
  }

  const booksPanel = (
    <section className="admin-section" aria-labelledby="admin-books-title">
        <div className="admin-section-heading">
          <div>
            <h2 id="admin-books-title">Book management</h2>
          </div>
          <div className="section-actions">
            <button
              type="button"
              aria-expanded={bookFormMode.type === 'create'}
              className="compact-action"
              onClick={openBookCreate}
            >
              New book
            </button>
            <button
              type="button"
              aria-label="Refresh books"
              className="secondary-button compact-action"
              onClick={refreshBooks}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Feedback surfaces here while the form is closed, so edit-row saves
            and deletes stay visible after their form collapses. */}
        {bookFormMode.type === 'closed' && (
          <MutationFeedback state={bookMutationState} />
        )}

        {/* The create form stays collapsed until requested; edits expand
            inline beneath their table row instead of using this slot. */}
        {bookFormMode.type === 'create' && (
          <BookManagementForm
            categories={namedCategories}
            draft={bookDraft}
            mode={bookFormMode}
            mutationState={bookMutationState}
            onClose={closeBookForm}
            onDraftChange={updateBookDraft}
            onReloadBook={() => void reloadEditingBook()}
            onSubmit={(event) => void handleBookSubmit(event)}
            onToggleCategory={toggleBookCategory}
          />
        )}

        <div className="list-card">
          <form
            aria-label="Admin book filters"
            className="catalog-filters"
            onSubmit={handleFilterSubmit}
          >
            <label>
              <span>Title</span>
              <input
                name="title"
                type="search"
                value={filterDraft.title}
                onChange={(event) =>
                  updateFilterDraft({ title: event.target.value })
                }
              />
            </label>
            <label>
              <span>Author</span>
              <input
                name="author"
                type="search"
                value={filterDraft.author}
                onChange={(event) =>
                  updateFilterDraft({ author: event.target.value })
                }
              />
            </label>
            <label>
              <span>ISBN</span>
              <input
                name="isbn"
                type="search"
                value={filterDraft.isbn}
                onChange={(event) =>
                  updateFilterDraft({ isbn: event.target.value })
                }
              />
            </label>
          </form>

          <div className="catalog-toolbar" aria-label="Admin book table controls">
            <CategoryFilter
              ariaLabel="Admin category filters"
              categories={namedCategories}
              categoriesState={categoriesState}
              selectedCategories={query.categories}
              onToggleCategory={toggleFilterCategory}
            />
            <div className="catalog-toolbar-status">
              {booksState.status === 'ready' && (
                <span aria-live="polite" className="toolbar-summary">
                  {formatBookWindow(booksState.value, query)}
                </span>
              )}
              {booksState.status === 'ready' && (
                <AdminToolbarPagination
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
              title="Loading managed books"
              variant="loading"
            />
          )}

          {booksState.status === 'error' && (
            <StateBlock
              message={booksState.message}
              title="Books could not be loaded"
              variant="error"
            />
          )}

          {booksState.status === 'ready' && (
            <AdminBookResults
              editingBookId={bookFormMode.type === 'edit' ? bookFormMode.bookId : null}
              page={booksState.value}
              query={query}
              renderEditForm={() =>
                bookFormMode.type === 'edit' ? (
                  <BookManagementForm
                    categories={namedCategories}
                    draft={bookDraft}
                    mode={bookFormMode}
                    mutationState={bookMutationState}
                    onClose={closeBookForm}
                    onDraftChange={updateBookDraft}
                    onReloadBook={() => void reloadEditingBook()}
                    onSubmit={(event) => void handleBookSubmit(event)}
                    onToggleCategory={toggleBookCategory}
                  />
                ) : null
              }
              onDeleteBook={requestBookDelete}
              onEditBook={(book) => void startBookEdit(book)}
              onNextPage={() => goToPage(query.page + 1)}
              onPageChange={goToPage}
              onPageSizeChange={changePageSize}
              onPreviousPage={() => goToPage(query.page - 1)}
              onSortByField={sortByField}
            />
          )}
        </div>

        {pendingBookDelete !== null && (
          <ConfirmDialog
            confirmLabel="Delete book"
            message={`Delete ${
              pendingBookDelete.title ?? `book ${pendingBookDelete.id}`
            }?`}
            title="Confirm deletion"
            onCancel={closeBookDeleteDialog}
            onConfirm={() => void confirmBookDelete()}
          />
        )}
      </section>
  )

  const categoriesPanel = (
      <section className="admin-section" aria-labelledby="admin-categories-title">
        <div className="admin-section-heading">
          <div>
            <h2 id="admin-categories-title">Category management</h2>
          </div>
          <div className="section-actions">
            <button
              type="button"
              aria-label="Refresh categories"
              className="secondary-button compact-action"
              onClick={refreshCategories}
            >
              Refresh
            </button>
          </div>
        </div>

        <form
          className="category-create-form"
          aria-label="Create category"
          onSubmit={(event) => void handleCategoryCreate(event)}
        >
          <label htmlFor="new-category-name">Category name</label>
          <input
            id="new-category-name"
            value={categoryDraft}
            onChange={(event) => {
              setCategoryDraft(event.currentTarget.value)
              setCategoryMutationState({ status: 'idle' })
            }}
          />
          <button type="submit" disabled={categoryMutationState.status === 'submitting'}>
            Create category
          </button>
        </form>

        <MutationFeedback state={categoryMutationState} />

        {categoriesState.status === 'loading' && (
          <StateBlock
            message="Loading categories..."
            title="Loading managed categories"
            variant="loading"
          />
        )}

        {categoriesState.status === 'error' && (
          <StateBlock
            message={categoriesState.message}
            title="Categories could not be loaded"
            variant="error"
          />
        )}

        {categoriesState.status === 'ready' && (
          <CategoryManagementSection
            categories={categoriesState.value}
            editState={categoryEditState}
            onCancelEdit={() => setCategoryEditState(null)}
            onDeleteCategory={requestCategoryDelete}
            onEditCategory={(category) => {
              if (category.id !== undefined) {
                setCategoryEditState({
                  id: category.id,
                  name: category.name ?? '',
                })
                setCategoryMutationState({ status: 'idle' })
              }
            }}
            onEditNameChange={(name) =>
              setCategoryEditState((current) =>
                current === null
                  ? current
                  : {
                      ...current,
                      name,
                    },
              )
            }
            onSaveCategory={(category) => void saveCategoryEdit(category)}
          />
        )}

        {pendingCategoryDelete !== null && (
          <ConfirmDialog
            confirmLabel="Delete category"
            message={`Delete ${
              pendingCategoryDelete.name ??
              `category ${pendingCategoryDelete.id}`
            }?`}
            title="Confirm deletion"
            onCancel={closeCategoryDeleteDialog}
            onConfirm={() => void confirmCategoryDelete()}
          />
        )}
      </section>
  )

  return (
    <div className="admin-catalog-layout">
      <Tabs
        activeTab={activeSection}
        ariaLabel="Catalog administration sections"
        idPrefix="admin-catalog"
        onTabChange={changeSection}
        tabs={[
          { id: 'books', label: 'Books', panel: booksPanel },
          { id: 'categories', label: 'Categories', panel: categoriesPanel },
        ]}
      />
    </div>
  )
}

function AdminToolbarPagination({
  onNextPage,
  onPageSizeChange,
  onPreviousPage,
  page,
  query,
}: {
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
      ariaLabel="Admin book pagination top"
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

function BookManagementForm({
  categories,
  draft,
  mode,
  mutationState,
  onClose,
  onDraftChange,
  onReloadBook,
  onSubmit,
  onToggleCategory,
}: {
  categories: readonly (Category & { name: string })[]
  draft: BookFormDraft
  mode: OpenBookFormMode
  mutationState: MutationState
  onClose: () => void
  onDraftChange: (update: Partial<BookFormDraft>) => void
  onReloadBook: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onToggleCategory: (categoryName: string) => void
}) {
  const submitting = mutationState.status === 'submitting'
  const editing = mode.type === 'edit'

  return (
    <form
      className={`book-management-form ${editing ? 'editing-book-form' : 'create-book-form'}`}
      aria-label={editing ? 'Edit book' : 'Create book'}
      data-mode={mode.type}
      onSubmit={onSubmit}
    >
      <div className="form-heading-row">
        <div>
          <h3>{editing ? 'Edit book' : 'Create book'}</h3>
          <p className="form-context">
            {editing
              ? `Updating loaded version ${mode.version}`
              : 'New books are saved with the selected categories.'}
          </p>
        </div>
        <div className="section-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={submitting}
          >
            {editing ? 'Cancel edit' : 'Close'}
          </button>
        </div>
      </div>

      <div className="admin-form-grid">
        <label>
          <span>Book title</span>
          <input
            required
            value={draft.title}
            onChange={(event) => onDraftChange({ title: event.currentTarget.value })}
          />
        </label>
        <label>
          <span>Book author</span>
          <input
            required
            value={draft.author}
            onChange={(event) => onDraftChange({ author: event.currentTarget.value })}
          />
        </label>
        <label>
          <span>Book ISBN</span>
          <input
            required
            disabled={editing}
            value={draft.isbn}
            onChange={(event) => onDraftChange({ isbn: event.currentTarget.value })}
          />
        </label>
        <label>
          <span>Publication year</span>
          <input
            required
            inputMode="numeric"
            type="number"
            value={draft.publicationYear}
            onChange={(event) =>
              onDraftChange({ publicationYear: event.currentTarget.value })
            }
          />
        </label>
      </div>

      <fieldset className="admin-checkbox-group">
        <legend>Book categories</legend>
        {categories.length === 0 && (
          <p className="session-message muted">No categories available.</p>
        )}
        {categories.map((category) => (
          <label key={category.id ?? category.name}>
            <input
              type="checkbox"
              checked={draft.categories.includes(category.name)}
              onChange={() => onToggleCategory(category.name)}
            />
            <span>{category.name}</span>
          </label>
        ))}
      </fieldset>

      <div className="admin-action-row">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving book...' : editing ? 'Save book' : 'Create book'}
        </button>
        {editing && mutationState.status === 'error' && (
          <button
            type="button"
            className="secondary-button"
            onClick={onReloadBook}
          >
            Reload book
          </button>
        )}
      </div>

      <MutationFeedback state={mutationState} />
    </form>
  )
}

function AdminBookResults({
  editingBookId,
  onDeleteBook,
  onEditBook,
  onNextPage,
  onPageChange,
  onPageSizeChange,
  onPreviousPage,
  onSortByField,
  page,
  query,
  renderEditForm,
}: {
  editingBookId: number | null
  onDeleteBook: (book: Book, opener: HTMLElement) => void
  onEditBook: (book: Book) => void
  onNextPage: () => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSize) => void
  onPreviousPage: () => void
  onSortByField: (field: SortField) => void
  page: BookPage
  query: CatalogQueryState
  renderEditForm: () => ReactNode
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
        <StateBlock
          message="No books match these filters."
          title="No managed books found"
          variant="empty"
        />
        <PaginationControls
          ariaLabel="Admin book pagination"
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
        aria-label="Scrollable admin books table"
        className="catalog-table-scroll"
        role="region"
        tabIndex={0}
      >
        <table className="catalog-table admin-books-table">
          <caption className="visually-hidden">Admin books</caption>
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
              <th className="plain-column-header admin-books-actions-header" scope="col">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <AdminBookRow
                book={book}
                editing={book.id !== undefined && book.id === editingBookId}
                key={book.id ?? `${book.title}-${book.isbn}`}
                renderEditForm={renderEditForm}
                onDeleteBook={onDeleteBook}
                onEditBook={onEditBook}
              />
            ))}
          </tbody>
        </table>
      </div>

      <PaginationControls
        ariaLabel="Admin book pagination"
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

function AdminBookRow({
  book,
  editing,
  onDeleteBook,
  onEditBook,
  renderEditForm,
}: {
  book: Book
  editing: boolean
  onDeleteBook: (book: Book, opener: HTMLElement) => void
  onEditBook: (book: Book) => void
  renderEditForm: () => ReactNode
}) {
  const title = book.title ?? 'Untitled book'
  const editRowId = `book-edit-row-${book.id ?? 'unsaved'}`
  const categories = (book.categories ?? [])
    .map((category) => category.name)
    .filter(Boolean)

  return (
    <>
      <tr>
        <th scope="row">{title}</th>
        <td>{book.author ?? 'Unknown author'}</td>
        <td>{book.publicationYear ?? 'Unknown'}</td>
        <td>{book.isbn ?? 'Unknown'}</td>
        <td>{categories.length > 0 ? categories.join(', ') : 'None'}</td>
        <td className="admin-books-actions-cell">
          <div
            aria-label={`Actions for ${title}`}
            className="row-actions admin-books-row-actions"
            role="group"
          >
            <button
              type="button"
              aria-controls={editing ? editRowId : undefined}
              aria-expanded={editing}
              className={`admin-books-action-button secondary-button ${
                editing ? 'selected-row-action' : ''
              }`}
              aria-label={`Edit ${title}`}
              onClick={() => onEditBook(book)}
            >
              {editing ? 'Editing' : 'Edit'}
            </button>
            <button
              type="button"
              className="danger-button admin-books-action-button"
              aria-label={`Delete ${title}`}
              onClick={(event) => onDeleteBook(book, event.currentTarget)}
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
      {editing && (
        <tr className="book-edit-row" id={editRowId}>
          <td colSpan={6}>{renderEditForm()}</td>
        </tr>
      )}
    </>
  )
}

const CATEGORY_PAGE_SIZE_OPTIONS = [10, 20, 50] as const

type CategoryPageSize = (typeof CATEGORY_PAGE_SIZE_OPTIONS)[number]

type CategoryListProps = {
  editState: CategoryEditState | null
  onCancelEdit: () => void
  onDeleteCategory: (category: Category, opener: HTMLElement) => void
  onEditCategory: (category: Category) => void
  onEditNameChange: (name: string) => void
  onSaveCategory: (category: Category) => void
}

// The categories contract returns the full list without paging parameters,
// so filtering, sorting, and pagination happen client-side over that list.
function CategoryManagementSection({
  categories,
  ...listProps
}: CategoryListProps & { categories: readonly Category[] }) {
  const [filterText, setFilterText] = useState('')
  const [sortDirection, setSortDirection] = useState<SortDirection>('ASC')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState<CategoryPageSize>(10)

  const filteredCategories = useMemo(() => {
    const text = filterText.trim().toLocaleLowerCase()
    const matched = text
      ? categories.filter((category) =>
          (category.name ?? '').toLocaleLowerCase().includes(text),
        )
      : [...categories]
    const factor = sortDirection === 'DESC' ? -1 : 1

    return matched.sort(
      (left, right) =>
        factor *
        (left.name ?? '').localeCompare(right.name ?? '', undefined, {
          sensitivity: 'base',
        }),
    )
  }, [categories, filterText, sortDirection])

  const totalPages = Math.ceil(filteredCategories.length / size)
  const currentPage = Math.min(page, Math.max(totalPages - 1, 0))
  const pageCategories = filteredCategories.slice(
    currentPage * size,
    (currentPage + 1) * size,
  )
  const firstPage = currentPage <= 0
  const lastPage = totalPages === 0 || currentPage >= totalPages - 1

  return (
    <div className="list-card">
      <form
        aria-label="Admin category filters"
        className="admin-list-filters"
        onSubmit={(event) => event.preventDefault()}
      >
        <label>
          <span>Name</span>
          <input
            name="categoryName"
            type="search"
            value={filterText}
            onChange={(event) => {
              setFilterText(event.currentTarget.value)
              setPage(0)
            }}
          />
        </label>
      </form>

      <div className="catalog-toolbar" aria-label="Admin category table controls">
        <div className="catalog-toolbar-status">
          <span aria-live="polite" className="toolbar-summary">
            {formatCategoryWindow(filteredCategories.length, currentPage, size)}
          </span>
          <PaginationControls
            ariaLabel="Admin category pagination top"
            first={firstPage}
            last={lastPage}
            pageNumber={currentPage}
            querySize={size}
            totalPages={totalPages}
            variant="toolbar"
            onNextPage={() => setPage(currentPage + 1)}
            onPageSizeChange={(nextSize) => {
              setSize(nextSize as CategoryPageSize)
              setPage(0)
            }}
            onPreviousPage={() => setPage(Math.max(currentPage - 1, 0))}
            pageSizeOptions={CATEGORY_PAGE_SIZE_OPTIONS}
          />
        </div>
      </div>

      <CategoryManagementList
        categories={pageCategories}
        hasCategories={categories.length > 0}
        sortDirection={sortDirection}
        onToggleSort={() => {
          setSortDirection((current) => (current === 'ASC' ? 'DESC' : 'ASC'))
          setPage(0)
        }}
        {...listProps}
      />

      <PaginationControls
        ariaLabel="Admin category pagination"
        first={firstPage}
        last={lastPage}
        pageNumber={currentPage}
        querySize={size}
        totalPages={totalPages}
        onNextPage={() => setPage(currentPage + 1)}
        onPageChange={(nextPage) => setPage(Math.max(0, nextPage))}
        onPageSizeChange={(nextSize) => {
          setSize(nextSize as CategoryPageSize)
          setPage(0)
        }}
        onPreviousPage={() => setPage(Math.max(currentPage - 1, 0))}
        pageSizeOptions={CATEGORY_PAGE_SIZE_OPTIONS}
      />
    </div>
  )
}

function formatCategoryWindow(total: number, page: number, size: number) {
  const label = `${total} ${total === 1 ? 'category' : 'categories'}`

  if (total <= 0) {
    return label
  }

  const start = page * size + 1
  const end = Math.min((page + 1) * size, total)

  return `Showing ${start}-${end} of ${label}`
}

function CategoryManagementList({
  categories,
  editState,
  hasCategories,
  onCancelEdit,
  onDeleteCategory,
  onEditCategory,
  onEditNameChange,
  onSaveCategory,
  onToggleSort,
  sortDirection,
}: CategoryListProps & {
  categories: readonly Category[]
  hasCategories: boolean
  onToggleSort: () => void
  sortDirection: SortDirection
}) {
  if (categories.length === 0) {
    return hasCategories ? (
      <StateBlock
        message="No categories match this filter."
        title="No matching categories"
        variant="empty"
      />
    ) : (
      <StateBlock
        message="No categories available."
        title="No managed categories"
        variant="empty"
      />
    )
  }

  return (
    <div
      aria-label="Scrollable admin categories table"
      className="catalog-table-scroll"
      role="region"
      tabIndex={0}
    >
      <table className="catalog-table admin-categories-table">
        <caption className="visually-hidden">Admin categories</caption>
        <thead>
          <tr>
            <SortToggleHeader
              direction={sortDirection}
              label="Name"
              onSort={onToggleSort}
            />
            <th
              className="plain-column-header admin-categories-actions-header"
              scope="col"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => {
            const label = category.name ?? `Category ${category.id ?? 'unknown'}`
            const editing =
              category.id !== undefined && editState?.id === category.id

            return (
              <tr key={category.id ?? label}>
                <th scope="row">
                  {editing ? (
                    <input
                      aria-label={`Name for ${label}`}
                      value={editState.name}
                      onChange={(event) =>
                        onEditNameChange(event.currentTarget.value)
                      }
                    />
                  ) : (
                    label
                  )}
                </th>
                <td className="admin-categories-actions-cell">
                  <div className="row-actions">
                    {editing ? (
                      <>
                        <button
                          type="button"
                          aria-label="Save category"
                          onClick={() => onSaveCategory(category)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          aria-label="Cancel category edit"
                          className="secondary-button"
                          onClick={onCancelEdit}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="secondary-button"
                          aria-label={`Edit ${label}`}
                          onClick={() => onEditCategory(category)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          aria-label={`Delete ${label}`}
                          onClick={(event) =>
                            onDeleteCategory(category, event.currentTarget)
                          }
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function createEmptyBookDraft(): BookFormDraft {
  return {
    author: '',
    categories: [],
    isbn: '',
    publicationYear: '',
    title: '',
  }
}

function createBookDraft(book: Book): BookFormDraft {
  return {
    author: book.author ?? '',
    categories: (book.categories ?? [])
      .map((category) => category.name)
      .filter((name): name is string => Boolean(name)),
    isbn: book.isbn ?? '',
    publicationYear:
      book.publicationYear === undefined ? '' : String(book.publicationYear),
    title: book.title ?? '',
  }
}

function parsePublicationYear(value: string) {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

function getEditableBookVersion(book: Book) {
  if (book.version === undefined || !Number.isFinite(book.version)) {
    throw new Error(
      'Book cannot be edited until the backend returns its current version.',
    )
  }

  return book.version
}

function replaceBookInPage(page: BookPage, updatedBook: Book): BookPage {
  return {
    ...page,
    content: (page.content ?? []).map((book) =>
      book.id === updatedBook.id ? updatedBook : book,
    ),
  }
}

function removeBookFromPage(page: BookPage, bookId: number): BookPage {
  const content = (page.content ?? []).filter((book) => book.id !== bookId)
  const totalElements = Math.max(0, (page.totalElements ?? content.length) - 1)

  return {
    ...page,
    content,
    numberOfElements: content.length,
    totalElements,
  }
}

function upsertCategory(categories: readonly Category[], category: Category) {
  const existing = categories.some((item) => item.id === category.id)
  const nextCategories = existing
    ? categories.map((item) => (item.id === category.id ? category : item))
    : [...categories, category]

  return sortCategories(nextCategories)
}

function sortCategories(categories: readonly Category[]) {
  return [...categories].sort((left, right) =>
    (left.name ?? '').localeCompare(right.name ?? ''),
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

function normalizeCatalogSection(value: string | null | undefined): CatalogSection {
  const normalized = value?.trim() ?? ''

  return CATALOG_SECTIONS.includes(normalized as CatalogSection)
    ? (normalized as CatalogSection)
    : DEFAULT_CATALOG_SECTION
}

function parseCatalogSection(searchParams: URLSearchParams) {
  return normalizeCatalogSection(searchParams.get(CATALOG_TAB_PARAM))
}

function appendCatalogSectionParam(
  searchParams: URLSearchParams,
  section: CatalogSection,
) {
  if (section !== DEFAULT_CATALOG_SECTION) {
    searchParams.set(CATALOG_TAB_PARAM, section)
  }
}

function createFilterDraftKey(draft: CatalogFilterDraft) {
  return `${draft.title}\u0000${draft.author}\u0000${draft.isbn}`
}
