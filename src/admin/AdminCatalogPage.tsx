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
import { useI18n, type UiTranslate } from '../i18n/useI18n'
import {
  createLoadError,
  getApiDisplayMessage,
  getLoadErrorMessage,
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
  const { t } = useI18n()
  const accountState = useCurrentAccount(session)

  return (
    <section className="admin-catalog-panel" aria-label={t('ui.route.admin-catalog.title')}>
      {accountState.status === 'loading' && (
        <StateBlock
          message={t('ui.admin.access-loading-message')}
          title={t('ui.admin.access-loading-title')}
          variant="loading"
        />
      )}

      {accountState.status === 'error' && (
        <StateBlock
          message={accountState.message}
          title={t('ui.admin.access-error-title')}
          variant="error"
        />
      )}

      {accountState.status === 'ready' &&
        (hasAdminRole(accountState.value) ? (
          <AdminCatalogManager session={session} />
        ) : (
          <StateBlock
            message={t('ui.admin-catalog.access-message')}
            title={t('ui.admin.role-required-title')}
            variant="error"
          />
        ))}
    </section>
  )
}

function AdminCatalogManager({ session }: { session: SessionResponse }) {
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSection = parseCatalogSection(searchParams)
  const querySearch = useMemo(() => {
    const params = new URLSearchParams(searchParams)

    params.delete(CATALOG_TAB_PARAM)

    return params.toString()
  }, [searchParams])
  const canonicalQuerySearch = useMemo(
    () =>
      catalogQueryToSearchParams(
        parseCatalogSearchParams(new URLSearchParams(querySearch)),
      ).toString(),
    [querySearch],
  )
  // Parsing from the canonical string keeps the query identity stable across
  // the canonicalization rewrite below, so the books effect fetches once.
  const query = useMemo(
    () => parseCatalogSearchParams(new URLSearchParams(canonicalQuerySearch)),
    [canonicalQuerySearch],
  )
  const currentSearch = searchParams.toString()
  const canonicalSearch = useMemo(() => {
    const params = new URLSearchParams(canonicalQuerySearch)

    appendCatalogSectionParam(params, activeSection)

    return params.toString()
  }, [activeSection, canonicalQuerySearch])
  const [categoriesState, setCategoriesState] = useState<LoadState<Category[]>>({
    status: 'loading',
  })
  const [booksState, setBooksState] = useState<LoadState<BookPage>>({
    status: 'loading',
  })
  const [booksRefreshKey, setBooksRefreshKey] = useState(0)
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
  const [categoryFormOpen, setCategoryFormOpen] = useState(false)
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
          setCategoriesState(
            createLoadError(error, 'Categories could not be loaded.'),
          )
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
          setBooksState(createLoadError(error, 'Books could not be loaded.'))
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

    // The year was previously coerced to 0 on unparseable input instead of
    // surfacing a validation error before the request.
    const publicationYear = parsePublicationYear(bookDraft.publicationYear)

    if (publicationYear === undefined) {
      setBookMutationState({
        status: 'error',
        message: t('ui.admin-catalog.year-invalid'),
      })

      return
    }

    setBookMutationState({ status: 'submitting' })

    try {
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
          message: t('ui.admin-catalog.book-updated'),
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
          message: t('ui.admin-catalog.book-created'),
        })
        refreshBooks()
      }
    } catch (error: unknown) {
      setBookMutationState({
        status: 'error',
        message: getApiDisplayMessage(
          t,
          error,
          t('ui.admin-catalog.book-save-failed'),
        ),
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
        message: getApiDisplayMessage(
          t,
          error,
          t('ui.admin-catalog.book-load-failed'),
        ),
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
        message: t('ui.admin-catalog.book-reloaded'),
      })
    } catch (error: unknown) {
      setBookMutationState({
        status: 'error',
        message: getApiDisplayMessage(
          t,
          error,
          t('ui.admin-catalog.book-reload-failed'),
        ),
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

      // Deleting the last row of a later page steps back one page, which
      // refetches; otherwise the row is removed from the loaded page locally.
      const lastRowOnLaterPage =
        booksState.status === 'ready' &&
        (booksState.value.content ?? []).length <= 1 &&
        query.page > 0

      if (lastRowOnLaterPage) {
        goToPage(query.page - 1)
      } else {
        setBooksState((current) =>
          current.status === 'ready'
            ? {
                status: 'ready',
                value: removeBookFromPage(current.value, bookId),
              }
            : current,
        )
      }

      setBookMutationState({
        status: 'success',
        message: t('ui.admin-catalog.book-deleted'),
      })
    } catch (error: unknown) {
      setBookMutationState({
        status: 'error',
        message: getApiDisplayMessage(
          t,
          error,
          t('ui.admin-catalog.book-delete-failed'),
        ),
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

  function openCategoryCreate() {
    setCategoryDraft('')
    setCategoryFormOpen(true)
    setCategoryMutationState({ status: 'idle' })
  }

  function closeCategoryCreate() {
    setCategoryDraft('')
    setCategoryFormOpen(false)
    setCategoryMutationState({ status: 'idle' })
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
        message: t('ui.admin-catalog.category-created'),
      })
    } catch (error: unknown) {
      setCategoryMutationState({
        status: 'error',
        message: getApiDisplayMessage(
          t,
          error,
          t('ui.admin-catalog.category-create-failed'),
        ),
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
        message: t('ui.admin-catalog.category-updated'),
      })
      refreshBooks()
    } catch (error: unknown) {
      setCategoryMutationState({
        status: 'error',
        message: getApiDisplayMessage(
          t,
          error,
          t('ui.admin-catalog.category-update-failed'),
        ),
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
        message: t('ui.admin-catalog.category-deleted'),
      })
      refreshBooks()
    } catch (error: unknown) {
      setCategoryMutationState({
        status: 'error',
        message: getApiDisplayMessage(
          t,
          error,
          t('ui.admin-catalog.category-delete-failed'),
        ),
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
            <h2 id="admin-books-title">{t('ui.admin-catalog.books-title')}</h2>
          </div>
          <div className="section-actions">
            <button
              type="button"
              aria-controls={
                bookFormMode.type === 'create' ? 'admin-book-create-form' : undefined
              }
              aria-expanded={bookFormMode.type === 'create'}
              className="compact-action"
              onClick={openBookCreate}
            >
              {t('ui.admin-catalog.new-book')}
            </button>
          </div>
        </div>

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
            aria-label={t('ui.admin-catalog.filters-label')}
            className="catalog-filters"
            onSubmit={handleFilterSubmit}
          >
            <label>
              <span>{t('ui.catalog.title')}</span>
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
              <span>{t('ui.catalog.author')}</span>
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
              <span>{t('ui.catalog.isbn')}</span>
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

          <div className="catalog-toolbar" aria-label={t('ui.admin-catalog.toolbar-label')}>
            <CategoryFilter
              ariaLabel={t('ui.admin-catalog.category-filters-label')}
              categories={namedCategories}
              categoriesState={categoriesState}
              selectedCategories={query.categories}
              onToggleCategory={toggleFilterCategory}
            />
            <div className="catalog-toolbar-status">
              {/* Mutation feedback borrows the fixed-height toolbar row while
                  the form is closed, so messages never shift the table. */}
              {bookFormMode.type === 'closed' && (
                <MutationFeedback state={bookMutationState} />
              )}
              {booksState.status === 'ready' && (
                <span aria-live="polite" className="toolbar-summary">
                  {formatBookWindow(t, booksState.value, query)}
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
              message={t('ui.catalog.loading-message')}
              title={t('ui.admin-catalog.books-loading-title')}
              variant="loading"
            />
          )}

          {booksState.status === 'error' && (
            <StateBlock
              message={getLoadErrorMessage(t, booksState)}
              title={t('ui.admin-catalog.books-error-title')}
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
            confirmLabel={t('ui.admin-catalog.delete-book')}
            message={t('ui.admin-catalog.delete-message', {
              label:
                pendingBookDelete.title ??
                t('ui.admin-catalog.book-number', { id: pendingBookDelete.id ?? '' }),
            })}
            title={t('ui.common.confirm-deletion')}
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
            <h2 id="admin-categories-title">
              {t('ui.admin-catalog.categories-title')}
            </h2>
          </div>
          <div className="section-actions">
            <button
              type="button"
              aria-controls={
                categoryFormOpen ? 'admin-category-create-form' : undefined
              }
              aria-expanded={categoryFormOpen}
              className="compact-action"
              onClick={openCategoryCreate}
            >
              {t('ui.admin-catalog.new-category')}
            </button>
          </div>
        </div>

        {/* The create form stays collapsed behind New category, matching the
            books tab's create flow. */}
        {categoryFormOpen && (
          <form
            className="category-create-form"
            aria-label={t('ui.admin-catalog.create-category')}
            id="admin-category-create-form"
            onSubmit={(event) => void handleCategoryCreate(event)}
          >
            <div className="form-heading-row">
              <div>
                <h3>{t('ui.admin-catalog.create-category')}</h3>
                <p className="form-context">
                  {t('ui.admin-catalog.create-category-hint')}
                </p>
              </div>
              <div className="section-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={categoryMutationState.status === 'submitting'}
                  onClick={closeCategoryCreate}
                >
                  {t('ui.common.close')}
                </button>
              </div>
            </div>

            <label>
              <span>{t('ui.admin-catalog.category-name')}</span>
              <input
                required
                value={categoryDraft}
                onChange={(event) => {
                  setCategoryDraft(event.currentTarget.value)
                  setCategoryMutationState({ status: 'idle' })
                }}
              />
            </label>

            <div className="admin-action-row">
              <button
                type="submit"
                disabled={categoryMutationState.status === 'submitting'}
              >
                {t('ui.admin-catalog.create-category')}
              </button>
            </div>

            <MutationFeedback state={categoryMutationState} />
          </form>
        )}

        {categoriesState.status === 'loading' && (
          <StateBlock
            message={t('ui.catalog.categories-loading')}
            title={t('ui.admin-catalog.categories-loading-title')}
            variant="loading"
          />
        )}

        {categoriesState.status === 'error' && (
          <StateBlock
            message={getLoadErrorMessage(t, categoriesState)}
            title={t('ui.admin-catalog.categories-error-title')}
            variant="error"
          />
        )}

        {categoriesState.status === 'ready' && (
          <CategoryManagementSection
            categories={categoriesState.value}
            feedback={
              // While the create form is open it owns the feedback line, so
              // messages do not render twice.
              categoryFormOpen ? null : (
                <MutationFeedback state={categoryMutationState} />
              )
            }
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
            confirmLabel={t('ui.admin-catalog.delete-category')}
            message={t('ui.admin-catalog.delete-message', {
              label:
                pendingCategoryDelete.name ??
                t('ui.admin-catalog.category-number', {
                  id: pendingCategoryDelete.id ?? '',
                }),
            })}
            title={t('ui.common.confirm-deletion')}
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
        ariaLabel={t('ui.admin-catalog.sections-label')}
        idPrefix="admin-catalog"
        onTabChange={changeSection}
        tabs={[
          { id: 'books', label: t('ui.admin-catalog.books-tab'), panel: booksPanel },
          {
            id: 'categories',
            label: t('ui.admin-catalog.categories-tab'),
            panel: categoriesPanel,
          },
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
  const { t } = useI18n()
  const pageNumber = page.number ?? query.page
  const totalPages = page.totalPages ?? 0
  const first = page.first === true || pageNumber <= 0
  const last =
    page.last === true || (totalPages > 0 && pageNumber >= totalPages - 1)

  return (
    <PaginationControls
      ariaLabel={t('ui.admin-catalog.book-pagination-top-label')}
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
  const { t } = useI18n()
  const submitting = mutationState.status === 'submitting'
  const editing = mode.type === 'edit'
  const formTitle = editing
    ? t('ui.admin-catalog.edit-book')
    : t('ui.admin-catalog.create-book')

  return (
    <form
      className={`book-management-form ${editing ? 'editing-book-form' : 'create-book-form'}`}
      aria-label={formTitle}
      data-mode={mode.type}
      id={editing ? undefined : 'admin-book-create-form'}
      onSubmit={onSubmit}
    >
      <div className="form-heading-row">
        <div>
          <h3>{formTitle}</h3>
          <p className="form-context">
            {editing
              ? t('ui.admin-catalog.version-context', { version: mode.version })
              : t('ui.admin-catalog.create-book-hint')}
          </p>
        </div>
        <div className="section-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={submitting}
          >
            {editing ? t('ui.admin-catalog.cancel-edit') : t('ui.common.close')}
          </button>
        </div>
      </div>

      <div className="admin-form-grid">
        <label>
          <span>{t('ui.admin-catalog.book-title')}</span>
          <input
            required
            value={draft.title}
            onChange={(event) => onDraftChange({ title: event.currentTarget.value })}
          />
        </label>
        <label>
          <span>{t('ui.admin-catalog.book-author')}</span>
          <input
            required
            value={draft.author}
            onChange={(event) => onDraftChange({ author: event.currentTarget.value })}
          />
        </label>
        <label>
          <span>{t('ui.admin-catalog.book-isbn')}</span>
          <input
            required
            disabled={editing}
            value={draft.isbn}
            onChange={(event) => onDraftChange({ isbn: event.currentTarget.value })}
          />
        </label>
        <label>
          <span>{t('ui.catalog.publication-year')}</span>
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
        <legend>{t('ui.admin-catalog.book-categories')}</legend>
        {categories.length === 0 && (
          <p className="session-message muted">
            {t('ui.catalog.categories-empty')}
          </p>
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
          {submitting
            ? t('ui.admin-catalog.saving-book')
            : editing
              ? t('ui.admin-catalog.save-book')
              : t('ui.admin-catalog.create-book')}
        </button>
        {editing && mutationState.status === 'error' && (
          <button
            type="button"
            className="secondary-button"
            onClick={onReloadBook}
          >
            {t('ui.admin-catalog.reload-book')}
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
  const { t } = useI18n()
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
          message={t('ui.catalog.empty-message')}
          title={t('ui.admin-catalog.books-empty-title')}
          variant="empty"
        />
        <PaginationControls
          ariaLabel={t('ui.admin-catalog.book-pagination-label')}
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
        aria-label={t('ui.admin-catalog.books-region-label')}
        className="catalog-table-scroll"
        role="region"
        tabIndex={0}
      >
        <table className="catalog-table admin-books-table">
          <caption className="visually-hidden">
            {t('ui.admin-catalog.books-caption')}
          </caption>
          <thead>
            <tr>
              <SortableColumnHeader
                field="title"
                label={t('ui.catalog.title')}
                query={query}
                onSortByField={onSortByField}
              />
              <SortableColumnHeader
                field="author"
                label={t('ui.catalog.author')}
                query={query}
                onSortByField={onSortByField}
              />
              <SortableColumnHeader
                field="publicationYear"
                label={t('ui.catalog.publication-year')}
                query={query}
                onSortByField={onSortByField}
              />
              <SortableColumnHeader
                field="isbn"
                label={t('ui.catalog.isbn')}
                query={query}
                onSortByField={onSortByField}
              />
              <th className="plain-column-header" scope="col">
                {t('ui.catalog.categories')}
              </th>
              <th className="plain-column-header admin-books-actions-header" scope="col">
                {t('ui.common.actions')}
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
        ariaLabel={t('ui.admin-catalog.book-pagination-label')}
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
  const { t } = useI18n()
  const title = book.title ?? t('ui.catalog.untitled-book')
  const editRowId = `book-edit-row-${book.id ?? 'unsaved'}`
  const categories = (book.categories ?? [])
    .map((category) => category.name)
    .filter(Boolean)

  return (
    <>
      <tr>
        <th scope="row">{title}</th>
        <td>{book.author ?? t('ui.catalog.unknown-author')}</td>
        <td>{book.publicationYear ?? t('ui.common.unknown')}</td>
        <td>{book.isbn ?? t('ui.common.unknown')}</td>
        <td>{categories.length > 0 ? categories.join(', ') : t('ui.common.none')}</td>
        <td className="admin-books-actions-cell">
          <div
            aria-label={t('ui.admin-catalog.actions-for', { title })}
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
              aria-label={t('ui.common.edit-label', { label: title })}
              onClick={() => onEditBook(book)}
            >
              {editing ? t('ui.admin-catalog.editing') : t('ui.common.edit')}
            </button>
            <button
              type="button"
              className="danger-button admin-books-action-button"
              aria-label={t('ui.common.delete-label', { label: title })}
              onClick={(event) => onDeleteBook(book, event.currentTarget)}
            >
              {t('ui.common.delete')}
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
  feedback,
  ...listProps
}: CategoryListProps & {
  categories: readonly Category[]
  feedback: ReactNode
}) {
  const { t } = useI18n()
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
        aria-label={t('ui.admin-catalog.category-filters-label')}
        className="admin-list-filters"
        onSubmit={(event) => event.preventDefault()}
      >
        <label>
          <span>{t('ui.admin-catalog.name')}</span>
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

      <div className="catalog-toolbar" aria-label={t('ui.admin-catalog.category-toolbar-label')}>
        <div className="catalog-toolbar-status">
          {/* Mutation feedback borrows the fixed-height toolbar row so
              messages never shift the table. */}
          {feedback}
          <span aria-live="polite" className="toolbar-summary">
            {formatCategoryWindow(t, filteredCategories.length, currentPage, size)}
          </span>
          <PaginationControls
            ariaLabel={t('ui.admin-catalog.category-pagination-top-label')}
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
        ariaLabel={t('ui.admin-catalog.category-pagination-label')}
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

function formatCategoryWindow(
  t: UiTranslate,
  total: number,
  page: number,
  size: number,
) {
  const label = t(
    total === 1
      ? 'ui.admin-catalog.category-count-one'
      : 'ui.admin-catalog.category-count-many',
    { count: total },
  )

  if (total <= 0) {
    return label
  }

  const start = page * size + 1
  const end = Math.min((page + 1) * size, total)

  return t('ui.common.window-summary', { start, end, total: label })
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
  const { t } = useI18n()

  if (categories.length === 0) {
    return hasCategories ? (
      <StateBlock
        message={t('ui.admin-catalog.categories-no-match-message')}
        title={t('ui.admin-catalog.categories-no-match-title')}
        variant="empty"
      />
    ) : (
      <StateBlock
        message={t('ui.catalog.categories-empty')}
        title={t('ui.admin-catalog.categories-empty-title')}
        variant="empty"
      />
    )
  }

  return (
    <div
      aria-label={t('ui.admin-catalog.categories-region-label')}
      className="catalog-table-scroll"
      role="region"
      tabIndex={0}
    >
      <table className="catalog-table admin-categories-table">
        <caption className="visually-hidden">
          {t('ui.admin-catalog.categories-caption')}
        </caption>
        <thead>
          <tr>
            <SortToggleHeader
              direction={sortDirection}
              label={t('ui.admin-catalog.name')}
              onSort={onToggleSort}
            />
            <th
              className="plain-column-header admin-categories-actions-header"
              scope="col"
            >
              {t('ui.common.actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => {
            const label =
              category.name ??
              t('ui.admin-catalog.category-fallback', {
                id: category.id ?? 'unknown',
              })
            const editing =
              category.id !== undefined && editState?.id === category.id

            return (
              <tr key={category.id ?? label}>
                <th scope="row">
                  {editing ? (
                    <input
                      aria-label={t('ui.admin-catalog.name-for', { label })}
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
                          aria-label={t('ui.admin-catalog.save-category')}
                          onClick={() => onSaveCategory(category)}
                        >
                          {t('ui.common.save')}
                        </button>
                        <button
                          type="button"
                          aria-label={t('ui.admin-catalog.cancel-category-edit')}
                          className="secondary-button"
                          onClick={onCancelEdit}
                        >
                          {t('ui.common.cancel')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="secondary-button"
                          aria-label={t('ui.common.edit-label', { label })}
                          onClick={() => onEditCategory(category)}
                        >
                          {t('ui.common.edit')}
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          aria-label={t('ui.common.delete-label', { label })}
                          onClick={(event) =>
                            onDeleteCategory(category, event.currentTarget)
                          }
                        >
                          {t('ui.common.delete')}
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
  const trimmed = value.trim()

  if (!trimmed) {
    return undefined
  }

  const parsed = Number(trimmed)

  return Number.isInteger(parsed) ? parsed : undefined
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
  const pageSize = page.size ?? 0

  return {
    ...page,
    content,
    numberOfElements: content.length,
    totalElements,
    // Keep the pager honest when the removal empties the trailing page.
    totalPages:
      pageSize > 0 ? Math.ceil(totalElements / pageSize) : page.totalPages,
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

function formatBookWindow(
  t: UiTranslate,
  page: BookPage,
  query: CatalogQueryState,
) {
  const totalElements = page.totalElements ?? 0
  const numberOfElements = page.numberOfElements ?? page.content?.length ?? 0

  if (totalElements <= 0 || numberOfElements <= 0) {
    return formatBookCount(t, totalElements)
  }

  const pageNumber = page.number ?? query.page
  const pageSize = page.size ?? query.size
  const start = pageNumber * pageSize + 1
  const end = Math.min(start + numberOfElements - 1, totalElements)

  return t('ui.common.window-summary', {
    start,
    end,
    total: formatBookCount(t, totalElements),
  })
}

function formatBookCount(t: UiTranslate, count: number) {
  return t(
    count === 1 ? 'ui.catalog.book-count-one' : 'ui.catalog.book-count-many',
    { count },
  )
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
