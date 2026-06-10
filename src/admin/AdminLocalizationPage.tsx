import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useCurrentAccount } from '../account/useCurrentAccount'
import {
  DEFAULT_LOCALIZATION_PAGE_SIZE,
  DEFAULT_LOCALIZATION_SORT,
  SUPPORTED_LOCALIZATION_LANGUAGES,
  createLocalization,
  deleteLocalization,
  fetchLocalization,
  fetchLocalizations,
  getLocalizationCoverage,
  updateLocalization,
  type LocalizationCoverageStatus,
  type LocalizationKeyCoverage,
  type LocalizationPage,
  type LocalizationRequest,
  type LocalizationResponse,
  type SupportedLocalizationLanguage,
} from '../api/localizations'
import type { SessionResponse } from '../api/session'
import { hasAdminRole } from '../auth/roles'
import {
  appendRepeatedParams,
  appendStringParam,
  parseNonNegativeInteger,
  sameValues,
  uniqueTrimmedValues,
} from '../routing/queryParams'
import {
  formatLoadStatus,
  getDisplayMessage,
  type LoadState,
  type MutationState,
} from '../ui/asyncState'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { MutationFeedback } from '../ui/MutationFeedback'
import { PaginationControls } from '../ui/PaginationControls'
import { SortToggleHeader } from '../ui/SortableColumnHeader'
import { StateBlock } from '../ui/StateBlock'
export const ADMIN_LOCALIZATION_ROUTE_PATH = '/admin/localizations' as const

const LIVE_FILTER_DEBOUNCE_MS = 300
const EMPTY_LOCALIZATIONS: readonly LocalizationResponse[] = []
const COVERAGE_HIDDEN_STORAGE_KEY = 'admin-localization-coverage-hidden'
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
type LocalizationSortField = 'messageKey' | 'language' | 'updatedAt'

type LocalizationSortDirection = 'ASC' | 'DESC'

type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

type LocalizationQueryState = {
  language: string
  messageKey: string
  page: number
  size: PageSize
  sort: readonly string[]
}

type LocalizationFilterDraft = Pick<
  LocalizationQueryState,
  'language' | 'messageKey'
>

type LocalizationFormMode =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; id: number }

type OpenLocalizationFormMode = Exclude<LocalizationFormMode, { type: 'closed' }>

type LocalizationFormDraft = {
  description: string
  language: SupportedLocalizationLanguage
  messageKey: string
  messageText: string
}

export function AdminLocalizationPage({ session }: { session: SessionResponse }) {
  const accountState = useCurrentAccount(session)

  return (
    <section
      className="admin-localization-panel"
      aria-label="Localization administration"
    >
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
          <AdminLocalizationManager session={session} />
        ) : (
          <StateBlock
            message="Admin access is required for localization management."
            title="Admin role required"
            variant="error"
          />
        ))}
    </section>
  )
}

function AdminLocalizationManager({ session }: { session: SessionResponse }) {
  const [formFocusToken, setFormFocusToken] = useState(0)
  const handledFormFocusTokenRef = useRef(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useMemo(
    () => parseLocalizationSearchParams(searchParams),
    [searchParams],
  )
  const routeFilterDraft = createLocalizationFilterDraft(query)
  const routeFilterDraftKey = createFilterDraftKey(routeFilterDraft)
  const [filterDraftState, setFilterDraftState] = useState(() => ({
    key: routeFilterDraftKey,
    value: routeFilterDraft,
  }))
  const filterDraft =
    filterDraftState.key === routeFilterDraftKey
      ? filterDraftState.value
      : routeFilterDraft
  const [localizationsState, setLocalizationsState] =
    useState<LoadState<LocalizationPage>>({
      status: 'loading',
    })
  const [refreshKey, setRefreshKey] = useState(0)
  const [formMode, setFormMode] = useState<LocalizationFormMode>({
    type: 'closed',
  })
  const [coverageHidden, setCoverageHidden] = useState(
    () => window.localStorage.getItem(COVERAGE_HIDDEN_STORAGE_KEY) === 'true',
  )
  const [formDraft, setFormDraft] = useState<LocalizationFormDraft>(() =>
    createEmptyLocalizationDraft(),
  )
  const [mutationState, setMutationState] = useState<MutationState>({
    status: 'idle',
  })
  const [pendingLocalizationDelete, setPendingLocalizationDelete] =
    useState<LocalizationResponse | null>(null)
  const deleteReturnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let ignore = false

    fetchLocalizations(localizationQueryToSearchParams(query))
      .then((page) => {
        if (!ignore) {
          setLocalizationsState({ status: 'ready', value: page })
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setLocalizationsState({
            status: 'error',
            message: getDisplayMessage(
              error,
              'Localization messages could not be loaded.',
            ),
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [query, refreshKey])

  const rows =
    localizationsState.status === 'ready'
      ? localizationsState.value.content ?? EMPTY_LOCALIZATIONS
      : EMPTY_LOCALIZATIONS
  const coverage = useMemo(
    () =>
      getLocalizationCoverage(rows, {
        languageFilter: query.language,
        loadFailed: localizationsState.status === 'error',
        messageKeyFilter: query.messageKey,
      }),
    [localizationsState.status, query.language, query.messageKey, rows],
  )
  const pageNumber =
    localizationsState.status === 'ready'
      ? localizationsState.value.number ?? query.page
      : query.page
  const totalPages =
    localizationsState.status === 'ready'
      ? localizationsState.value.totalPages ?? 0
      : 0

  function refreshLocalizations() {
    setLocalizationsState({ status: 'loading' })
    setRefreshKey((key) => key + 1)
  }

  function updateLocalizationQuery(nextQuery: LocalizationQueryState) {
    const nextSearchParams = localizationQueryToUrlSearchParams(nextQuery)

    if (nextSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(nextSearchParams)
    }
  }

  function toggleCoverageHidden() {
    setCoverageHidden((current) => {
      const next = !current

      window.localStorage.setItem(COVERAGE_HIDDEN_STORAGE_KEY, String(next))

      return next
    })
  }

  function updateFilterDraft(update: Partial<LocalizationFilterDraft>) {
    setFilterDraftState({
      key: routeFilterDraftKey,
      value: {
        ...filterDraft,
        ...update,
      },
    })
  }

  // Filters apply live: a short typing pause pushes the trimmed draft into
  // the URL-backed query. The draft is re-stored under the next route key so
  // in-progress text (including trailing spaces) survives the URL change.
  useEffect(() => {
    if (
      filterDraft.messageKey.trim() === query.messageKey &&
      filterDraft.language === query.language
    ) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      const nextQuery: LocalizationQueryState = {
        ...query,
        language: filterDraft.language,
        messageKey: filterDraft.messageKey.trim(),
        page: 0,
      }

      setFilterDraftState({
        key: createFilterDraftKey(createLocalizationFilterDraft(nextQuery)),
        value: filterDraft,
      })
      setSearchParams(localizationQueryToUrlSearchParams(nextQuery))
    }, LIVE_FILTER_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [filterDraft, query, setSearchParams])

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateLocalizationQuery({
      ...query,
      language: filterDraft.language,
      messageKey: filterDraft.messageKey.trim(),
      page: 0,
    })
  }


  function changePageSize(size: PageSize) {
    updateLocalizationQuery({
      ...query,
      page: 0,
      size,
    })
  }

  function sortByField(field: LocalizationSortField) {
    updateLocalizationQuery({
      ...query,
      page: 0,
      sort: nextLocalizationSort(query.sort, field),
    })
  }

  function goToPage(page: number) {
    updateLocalizationQuery({
      ...query,
      page: Math.max(0, page),
    })
  }

  function startCreate(messageKey?: string, language?: string) {
    setFormMode({ type: 'create' })
    setFormDraft(
      createEmptyLocalizationDraft({
        language: normalizeSupportedLanguage(language ?? query.language),
        messageKey: messageKey ?? query.messageKey,
      }),
    )
    setMutationState({ status: 'idle' })
    setFormFocusToken((token) => token + 1)
  }

  useEffect(() => {
    if (
      formFocusToken === 0 ||
      formFocusToken === handledFormFocusTokenRef.current
    ) {
      return
    }

    const messageKeyInput = document.getElementById(
      'localization-form-message-key',
    )

    if (!messageKeyInput) {
      return
    }

    handledFormFocusTokenRef.current = formFocusToken

    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

    messageKeyInput.scrollIntoView?.({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
    })
    messageKeyInput.focus({ preventScroll: true })
  }, [formFocusToken])

  async function startEdit(row: LocalizationResponse) {
    if (row.id === undefined) {
      return
    }

    setMutationState({ status: 'submitting' })

    try {
      const currentRow = await fetchLocalization(row.id)

      setFormMode({ type: 'edit', id: row.id })
      setFormDraft(createLocalizationDraft(currentRow))
      setMutationState({ status: 'idle' })
    } catch (error: unknown) {
      setMutationState({
        status: 'error',
        message: getDisplayMessage(error, 'Localization row could not be loaded.'),
      })
    }
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMutationState({ status: 'submitting' })

    try {
      const request = createLocalizationRequest(formDraft)

      if (formMode.type === 'edit') {
        const updatedLocalization = await updateLocalization(
          session,
          formMode.id,
          request,
        )

        setFormDraft(createLocalizationDraft(updatedLocalization))
        setMutationState({
          status: 'success',
          message: 'Localization updated.',
        })
        refreshLocalizations()
      } else {
        await createLocalization(session, request)

        setFormDraft(
          createEmptyLocalizationDraft({
            language: formDraft.language,
            messageKey: formDraft.messageKey,
          }),
        )
        setMutationState({
          status: 'success',
          message: 'Localization created.',
        })
        refreshLocalizations()
      }
    } catch (error: unknown) {
      setMutationState({
        status: 'error',
        message: getDisplayMessage(error, 'Localization row could not be saved.'),
      })
    }
  }

  function requestLocalizationDelete(
    row: LocalizationResponse,
    opener: HTMLElement,
  ) {
    if (row.id === undefined) {
      return
    }

    deleteReturnFocusRef.current = opener
    setPendingLocalizationDelete(row)
  }

  function closeLocalizationDeleteDialog() {
    const opener = deleteReturnFocusRef.current

    deleteReturnFocusRef.current = null
    setPendingLocalizationDelete(null)
    window.requestAnimationFrame(() => {
      if (opener?.isConnected) {
        opener.focus()
      }
    })
  }

  async function confirmLocalizationDelete() {
    const row = pendingLocalizationDelete

    closeLocalizationDeleteDialog()

    if (row?.id === undefined) {
      return
    }

    setMutationState({ status: 'submitting' })

    try {
      await deleteLocalization(session, row.id)

      if (formMode.type === 'edit' && formMode.id === row.id) {
        closeForm()
      }

      setMutationState({
        status: 'success',
        message: 'Localization deleted.',
      })
      refreshLocalizations()
    } catch (error: unknown) {
      setMutationState({
        status: 'error',
        message: getDisplayMessage(error, 'Localization row could not be deleted.'),
      })
    }
  }

  function updateDraft(update: Partial<LocalizationFormDraft>) {
    setFormDraft((current) => ({
      ...current,
      ...update,
    }))
    setMutationState({ status: 'idle' })
  }

  function closeForm() {
    setFormMode({ type: 'closed' })
    setFormDraft(createEmptyLocalizationDraft())
    setMutationState({ status: 'idle' })
  }

  const missingLocaleCount = coverage.reduce(
    (total, group) =>
      total + group.locales.filter((locale) => locale.status === 'missing').length,
    0,
  )

  return (
    <div className="admin-localization-layout">
      {coverage.length > 0 && (
        <section
          className="workflow-group coverage-widget"
          aria-labelledby="localization-coverage-title"
        >
          <div className="workflow-group-heading">
            <div>
              <h2 id="localization-coverage-title">Locale coverage</h2>
            </div>
            <div className="section-actions">
              <span className="coverage-stats">
                {coverage.length} {coverage.length === 1 ? 'key' : 'keys'} ·{' '}
                {missingLocaleCount} missing
              </span>
              <button
                type="button"
                aria-expanded={!coverageHidden}
                className="secondary-button compact-action"
                onClick={toggleCoverageHidden}
              >
                {coverageHidden ? 'Show coverage' : 'Hide coverage'}
              </button>
            </div>
          </div>

          {!coverageHidden && (
            <LocalizationCoverageTable
              coverage={coverage}
              onCreateMissing={startCreate}
            />
          )}
        </section>
      )}

      <section className="admin-section" aria-labelledby="localization-list-title">
        <div className="admin-section-heading">
          <div>
            <h2 id="localization-list-title">Localization rows</h2>
          </div>
          <div className="section-actions">
            <button
              type="button"
              aria-expanded={formMode.type === 'create'}
              className="compact-action"
              onClick={() => startCreate()}
            >
              New localization
            </button>
            <button
              type="button"
              aria-label="Refresh localizations"
              className="secondary-button compact-action"
              onClick={refreshLocalizations}
            >
              Refresh
            </button>
          </div>
        </div>

        {formMode.type === 'closed' && <MutationFeedback state={mutationState} />}

        {formMode.type === 'create' && (
          <div className="workflow-group" aria-label="Create localization panel">
            <LocalizationForm
              draft={formDraft}
              mode={formMode}
              mutationState={mutationState}
              onClose={closeForm}
              onDraftChange={updateDraft}
              onSubmit={(event) => void handleFormSubmit(event)}
            />
          </div>
        )}

        <div className="list-card">
          <form
            aria-label="Localization filters"
            className="localization-filters"
            onSubmit={handleFilterSubmit}
          >
            <label>
              <span>Message key</span>
              <input
                name="messageKey"
                type="search"
                value={filterDraft.messageKey}
                onChange={(event) =>
                  updateFilterDraft({ messageKey: event.currentTarget.value })
                }
              />
            </label>
            <label>
              <span>Language</span>
              <select
                name="language"
                value={filterDraft.language}
                onChange={(event) =>
                  updateFilterDraft({ language: event.currentTarget.value })
                }
              >
                <option value="">All languages</option>
                {SUPPORTED_LOCALIZATION_LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </label>
          </form>

          <div
            className="catalog-toolbar"
            aria-label="Localization table controls"
          >
            <div className="catalog-toolbar-status">
              <span aria-live="polite" className="toolbar-summary">
                {formatLocalizationSummary(localizationsState)}
              </span>
              {localizationsState.status === 'ready' && (
                <PaginationControls
                  ariaLabel="Localization pagination top"
                  first={
                    localizationsState.value.first === true || pageNumber <= 0
                  }
                  last={
                    localizationsState.value.last === true ||
                    (totalPages > 0 && pageNumber >= totalPages - 1)
                  }
                  pageNumber={pageNumber}
                  querySize={query.size}
                  totalPages={totalPages}
                  variant="toolbar"
                  onNextPage={() => goToPage(pageNumber + 1)}
                  onPageSizeChange={(size) => changePageSize(size as PageSize)}
                  onPreviousPage={() => goToPage(pageNumber - 1)}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                />
              )}
            </div>
          </div>

          {localizationsState.status === 'loading' && (
            <StateBlock
              message="Loading localizations..."
              title="Loading localization rows"
              variant="loading"
            />
          )}

          {localizationsState.status === 'error' && (
            <StateBlock
              message={localizationsState.message}
              title="Localization rows could not be loaded"
              variant="error"
            />
          )}

          {localizationsState.status === 'ready' &&
            (rows.length > 0 ? (
              <LocalizationResults
                editingId={formMode.type === 'edit' ? formMode.id : null}
                rows={rows}
                sort={query.sort}
                onDeleteLocalization={requestLocalizationDelete}
                onEditLocalization={(row) => void startEdit(row)}
                onSortByField={sortByField}
                renderEditForm={() =>
                  formMode.type === 'edit' ? (
                    <LocalizationForm
                      draft={formDraft}
                      mode={formMode}
                      mutationState={mutationState}
                      onClose={closeForm}
                      onDraftChange={updateDraft}
                      onSubmit={(event) => void handleFormSubmit(event)}
                    />
                  ) : null
                }
              />
            ) : (
              <StateBlock
                message="No localization rows match these filters."
                title="No localization rows found"
                variant="empty"
              />
            ))}

          {localizationsState.status === 'ready' && (
            <PaginationControls
              ariaLabel="Localization pagination"
              first={localizationsState.value.first === true || pageNumber <= 0}
              last={
                localizationsState.value.last === true ||
                (totalPages > 0 && pageNumber >= totalPages - 1)
              }
              pageNumber={pageNumber}
              querySize={query.size}
              totalPages={totalPages}
              onNextPage={() => goToPage(pageNumber + 1)}
              onPageChange={goToPage}
              onPageSizeChange={(size) => changePageSize(size as PageSize)}
              onPreviousPage={() => goToPage(pageNumber - 1)}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
          )}
        </div>
      </section>

      {pendingLocalizationDelete !== null && (
        <ConfirmDialog
          confirmLabel="Delete localization"
          message={`Delete ${createLocalizationLabel(pendingLocalizationDelete)}?`}
          title="Confirm deletion"
          onCancel={closeLocalizationDeleteDialog}
          onConfirm={() => void confirmLocalizationDelete()}
        />
      )}
    </div>
  )
}

function LocalizationCoverageTable({
  coverage,
  onCreateMissing,
}: {
  coverage: readonly LocalizationKeyCoverage[]
  onCreateMissing: (messageKey: string, language: string) => void
}) {
  if (coverage.length === 0) {
    return null
  }

  return (
    <div className="catalog-table-scroll">
      <table className="catalog-table localization-coverage-table">
        <caption>Localization coverage</caption>
        <thead>
          <tr>
            <th className="plain-column-header" scope="col">
              Message key
            </th>
            <th className="plain-column-header" scope="col">
              Status
            </th>
            {SUPPORTED_LOCALIZATION_LANGUAGES.map((language) => (
              <th className="plain-column-header" key={language} scope="col">
                {language}
              </th>
            ))}
            <th className="plain-column-header" scope="col">
              Missing locales
            </th>
          </tr>
        </thead>
        <tbody>
          {coverage.map((group) => (
            <tr key={group.messageKey}>
              <th scope="row">{group.messageKey}</th>
              <td>
                <CoverageStatus status={group.status} />
              </td>
              {group.locales.map((locale) => (
                <td key={locale.language}>
                  {locale.status === 'missing' ? (
                    <button
                      className="localization-locale-button missing"
                      type="button"
                      aria-label={`Add ${locale.language} for ${group.messageKey}`}
                      onClick={() =>
                        onCreateMissing(group.messageKey, locale.language)
                      }
                    >
                      Add {locale.language}
                    </button>
                  ) : (
                    <CoverageStatus status={locale.status} />
                  )}
                </td>
              ))}
              <td>{formatMissingLocales(group)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatLocalizationSummary(state: LoadState<LocalizationPage>) {
  if (state.status !== 'ready') {
    return `Localization rows are ${formatLoadStatus(state.status).toLowerCase()}.`
  }

  const totalRows = state.value.totalElements
  const rowCount = state.value.numberOfElements ?? state.value.content?.length

  return `Showing ${rowCount ?? 0}${
    totalRows !== undefined ? ` of ${totalRows}` : ''
  } localization rows.`
}

function LocalizationResults({
  editingId,
  onDeleteLocalization,
  onEditLocalization,
  onSortByField,
  renderEditForm,
  rows,
  sort,
}: {
  editingId: number | null
  onDeleteLocalization: (row: LocalizationResponse, opener: HTMLElement) => void
  onEditLocalization: (row: LocalizationResponse) => void
  onSortByField: (field: LocalizationSortField) => void
  renderEditForm: () => ReactNode
  rows: readonly LocalizationResponse[]
  sort: readonly string[]
}) {
  return (
    <div className="catalog-table-scroll">
      <table className="catalog-table localization-rows-table">
        <caption className="visually-hidden">Localization rows</caption>
        <thead>
          <tr>
            <SortToggleHeader
              direction={getLocalizationSortDirection(sort, 'messageKey')}
              label="Message key"
              onSort={() => onSortByField('messageKey')}
            />
            <SortToggleHeader
              direction={getLocalizationSortDirection(sort, 'language')}
              label="Language"
              onSort={() => onSortByField('language')}
            />
            <th className="plain-column-header" scope="col">
              Message
            </th>
            <th className="plain-column-header" scope="col">
              Description
            </th>
            <SortToggleHeader
              direction={getLocalizationSortDirection(sort, 'updatedAt')}
              label="Updated"
              onSort={() => onSortByField('updatedAt')}
            />
            <th className="plain-column-header" scope="col">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const editing = row.id !== undefined && row.id === editingId

            return (
              <LocalizationRow
                editing={editing}
                key={row.id ?? `${row.messageKey}-${row.language}-${row.messageText}`}
                row={row}
                onDeleteLocalization={onDeleteLocalization}
                onEditLocalization={onEditLocalization}
                renderEditForm={renderEditForm}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function LocalizationRow({
  editing,
  onDeleteLocalization,
  onEditLocalization,
  renderEditForm,
  row,
}: {
  editing: boolean
  onDeleteLocalization: (row: LocalizationResponse, opener: HTMLElement) => void
  onEditLocalization: (row: LocalizationResponse) => void
  renderEditForm: () => ReactNode
  row: LocalizationResponse
}) {
  const label = createLocalizationLabel(row)
  const editRowId = `localization-edit-row-${row.id ?? 'unsaved'}`

  return (
    <>
      <tr>
        <th scope="row">{row.messageKey ?? 'Unknown key'}</th>
        <td>{row.language ?? 'Unknown'}</td>
        <td>{row.messageText?.trim() ? row.messageText : 'Blank message'}</td>
        <td>{row.description?.trim() ? row.description : 'No description'}</td>
        <td>{row.updatedAt ?? 'Unknown'}</td>
        <td>
          <div className="row-actions">
            <button
              type="button"
              aria-controls={editing ? editRowId : undefined}
              aria-expanded={editing}
              className="secondary-button"
              aria-label={`Edit ${label}`}
              onClick={() => onEditLocalization(row)}
            >
              Edit
            </button>
            <button
              type="button"
              className="danger-button"
              aria-label={`Delete ${label}`}
              onClick={(event) => onDeleteLocalization(row, event.currentTarget)}
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
      {editing && (
        <tr className="localization-edit-row" id={editRowId}>
          <td colSpan={6}>{renderEditForm()}</td>
        </tr>
      )}
    </>
  )
}

function LocalizationForm({
  draft,
  mode,
  mutationState,
  onClose,
  onDraftChange,
  onSubmit,
}: {
  draft: LocalizationFormDraft
  mode: OpenLocalizationFormMode
  mutationState: MutationState
  onClose: () => void
  onDraftChange: (update: Partial<LocalizationFormDraft>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const submitting = mutationState.status === 'submitting'
  const editing = mode.type === 'edit'

  return (
    <form
      className="localization-management-form"
      aria-label={editing ? 'Edit localization' : 'Create localization'}
      onSubmit={onSubmit}
    >
      <div className="form-heading-row">
        <div>
          <h3 id="localization-form-title">
            {editing ? 'Edit localization' : 'Create localization'}
          </h3>
        </div>
        <div className="section-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={submitting}
            onClick={onClose}
          >
            {editing ? 'Cancel edit' : 'Close'}
          </button>
        </div>
      </div>

      <div className="admin-form-grid localization-form-grid">
        <label>
          <span>Message key</span>
          <input
            id="localization-form-message-key"
            required
            value={draft.messageKey}
            onChange={(event) =>
              onDraftChange({ messageKey: event.currentTarget.value })
            }
          />
        </label>
        <label>
          <span>Language</span>
          <select
            required
            value={draft.language}
            onChange={(event) =>
              onDraftChange({
                language: event.currentTarget
                  .value as SupportedLocalizationLanguage,
              })
            }
          >
            {SUPPORTED_LOCALIZATION_LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Description</span>
          <input
            value={draft.description}
            onChange={(event) =>
              onDraftChange({ description: event.currentTarget.value })
            }
          />
        </label>
      </div>

      <label className="localization-message-field">
        <span>Message text</span>
        <textarea
          required
          rows={5}
          value={draft.messageText}
          onChange={(event) =>
            onDraftChange({ messageText: event.currentTarget.value })
          }
        />
      </label>

      <div className="admin-action-row">
        <button type="submit" disabled={submitting}>
          {submitting
            ? 'Saving localization...'
            : editing
              ? 'Save localization'
              : 'Create localization'}
        </button>
      </div>

      <MutationFeedback state={mutationState} />
    </form>
  )
}

function CoverageStatus({ status }: { status: LocalizationCoverageStatus }) {
  return <span className={`coverage-pill ${status}`}>{status}</span>
}

const DEFAULT_LOCALIZATION_QUERY: LocalizationQueryState = {
  language: '',
  messageKey: '',
  page: 0,
  size: DEFAULT_LOCALIZATION_PAGE_SIZE as PageSize,
  sort: DEFAULT_LOCALIZATION_SORT,
}

function parseLocalizationSearchParams(
  searchParams: URLSearchParams,
): LocalizationQueryState {
  const sort = uniqueTrimmedValues(searchParams.getAll('sort'))

  return {
    language: normalizeQueryLanguage(searchParams.get('language')),
    messageKey: searchParams.get('messageKey')?.trim() ?? '',
    page: parseNonNegativeInteger(searchParams.get('page'), 0),
    size: parsePageSize(searchParams.get('size')),
    sort: sort.length > 0 ? sort : DEFAULT_LOCALIZATION_QUERY.sort,
  }
}

function localizationQueryToUrlSearchParams(query: LocalizationQueryState) {
  const searchParams = new URLSearchParams()

  appendStringParam(searchParams, 'messageKey', query.messageKey)
  appendStringParam(searchParams, 'language', query.language)

  if (query.page > 0) {
    searchParams.set('page', String(query.page))
  }

  if (query.size !== DEFAULT_LOCALIZATION_QUERY.size) {
    searchParams.set('size', String(query.size))
  }

  if (!sameValues(query.sort, DEFAULT_LOCALIZATION_QUERY.sort)) {
    appendRepeatedParams(searchParams, 'sort', query.sort)
  }

  return searchParams
}

function localizationQueryToSearchParams(query: LocalizationQueryState) {
  return {
    language: query.language,
    messageKey: query.messageKey,
    page: query.page,
    size: query.size,
    sort: query.sort,
  }
}

function createLocalizationFilterDraft(
  query: LocalizationQueryState,
): LocalizationFilterDraft {
  return {
    language: query.language,
    messageKey: query.messageKey,
  }
}

function createEmptyLocalizationDraft(
  overrides: Partial<LocalizationFormDraft> = {},
): LocalizationFormDraft {
  return {
    description: '',
    language: 'en',
    messageKey: '',
    messageText: '',
    ...overrides,
  }
}

function createLocalizationDraft(
  row: LocalizationResponse,
): LocalizationFormDraft {
  return {
    description: row.description ?? '',
    language: normalizeSupportedLanguage(row.language),
    messageKey: row.messageKey ?? '',
    messageText: row.messageText ?? '',
  }
}

function createLocalizationRequest(
  draft: LocalizationFormDraft,
): LocalizationRequest {
  return {
    messageKey: draft.messageKey.trim(),
    language: draft.language,
    messageText: draft.messageText.trim(),
    description: draft.description.trim() || undefined,
  }
}

function formatMissingLocales(group: LocalizationKeyCoverage) {
  const missingLocales = group.locales
    .filter((locale) => locale.status === 'missing')
    .map((locale) => locale.language)

  return missingLocales.length > 0 ? missingLocales.join(', ') : 'None'
}

function createLocalizationLabel(row: LocalizationResponse) {
  return `${row.messageKey ?? 'unknown'} ${row.language ?? 'unknown'}`
}

// Header sorts keep composite criteria so equal values stay deterministic:
// message-key sorts break ties by language, and the other fields break ties
// by message key.
function buildLocalizationSort(
  field: LocalizationSortField,
  direction: LocalizationSortDirection,
): readonly string[] {
  return field === 'messageKey'
    ? [`messageKey,${direction}`, 'language,ASC']
    : [`${field},${direction}`, 'messageKey,ASC']
}

function getLocalizationSortDirection(
  sort: readonly string[],
  field: LocalizationSortField,
): LocalizationSortDirection | undefined {
  const [property, direction] = (sort[0] ?? '').split(',')

  return property === field && (direction === 'ASC' || direction === 'DESC')
    ? direction
    : undefined
}

function nextLocalizationSort(
  sort: readonly string[],
  field: LocalizationSortField,
): readonly string[] {
  const nextDirection: LocalizationSortDirection =
    getLocalizationSortDirection(sort, field) === 'ASC' ? 'DESC' : 'ASC'

  return buildLocalizationSort(field, nextDirection)
}

function normalizeSupportedLanguage(
  language: string | undefined,
): SupportedLocalizationLanguage {
  const normalized = language?.trim().toLowerCase() ?? ''

  return SUPPORTED_LOCALIZATION_LANGUAGES.includes(
    normalized as SupportedLocalizationLanguage,
  )
    ? (normalized as SupportedLocalizationLanguage)
    : 'en'
}

function normalizeQueryLanguage(language: string | null) {
  const normalized = language?.trim().toLowerCase() ?? ''

  return SUPPORTED_LOCALIZATION_LANGUAGES.includes(
    normalized as SupportedLocalizationLanguage,
  )
    ? normalized
    : ''
}

function parsePageSize(value: string | null): PageSize {
  const parsed = parseNonNegativeInteger(value, DEFAULT_LOCALIZATION_QUERY.size)

  return PAGE_SIZE_OPTIONS.includes(parsed as PageSize)
    ? (parsed as PageSize)
    : DEFAULT_LOCALIZATION_QUERY.size
}

function createFilterDraftKey(draft: LocalizationFilterDraft) {
  return `${draft.messageKey}\u0000${draft.language}`
}
