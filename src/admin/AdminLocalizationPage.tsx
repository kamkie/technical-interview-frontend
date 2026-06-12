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
import { useI18n, type UiTranslate } from '../i18n/useI18n'
import {
  appendRepeatedParams,
  appendStringParam,
  parseNonNegativeInteger,
  sameValues,
  uniqueTrimmedValues,
} from '../routing/queryParams'
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
  const { t } = useI18n()
  const accountState = useCurrentAccount(session)

  return (
    <section
      className="admin-localization-panel"
      aria-label={t('ui.admin-localization.panel-label')}
    >
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
          <AdminLocalizationManager session={session} />
        ) : (
          <StateBlock
            message={t('ui.admin-localization.access-message')}
            title={t('ui.admin.role-required-title')}
            variant="error"
          />
        ))}
    </section>
  )
}

function AdminLocalizationManager({ session }: { session: SessionResponse }) {
  const { t } = useI18n()
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
          setLocalizationsState(
            createLoadError(error, 'Localization messages could not be loaded.'),
          )
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
        message: getApiDisplayMessage(
          t,
          error,
          t('ui.admin-localization.row-load-failed'),
        ),
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
          message: t('ui.admin-localization.updated-success'),
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
          message: t('ui.admin-localization.created-success'),
        })
        refreshLocalizations()
      }
    } catch (error: unknown) {
      setMutationState({
        status: 'error',
        message: getApiDisplayMessage(
          t,
          error,
          t('ui.admin-localization.row-save-failed'),
        ),
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
        message: t('ui.admin-localization.deleted-success'),
      })
      refreshLocalizations()
    } catch (error: unknown) {
      setMutationState({
        status: 'error',
        message: getApiDisplayMessage(
          t,
          error,
          t('ui.admin-localization.row-delete-failed'),
        ),
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
  // Coverage is derived from the fetched rows only. When that view is
  // partial — rows still loading, more pages, or a language filter that
  // narrows the rows — a locale shown as missing may exist on the server,
  // so the create shortcuts are suppressed in favor of plain status pills.
  const coverageViewPartial =
    query.language !== '' ||
    localizationsState.status !== 'ready' ||
    (localizationsState.value.totalPages ?? 0) > 1

  return (
    <div className="admin-localization-layout">
      {coverage.length > 0 && (
        <section
          className="workflow-group coverage-widget"
          aria-labelledby="localization-coverage-title"
        >
          <div className="workflow-group-heading">
            <div>
              <h2 id="localization-coverage-title">
                {t('ui.admin-localization.coverage-title')}
              </h2>
            </div>
            <div className="section-actions">
              <span className="coverage-stats">
                {t('ui.admin-localization.coverage-stats', {
                  keys: t(
                    coverage.length === 1
                      ? 'ui.admin-localization.key-count-one'
                      : 'ui.admin-localization.key-count-many',
                    { count: coverage.length },
                  ),
                  missing: missingLocaleCount,
                })}
              </span>
              <button
                type="button"
                aria-expanded={!coverageHidden}
                className="secondary-button compact-action"
                onClick={toggleCoverageHidden}
              >
                {coverageHidden
                  ? t('ui.admin-localization.show-coverage')
                  : t('ui.admin-localization.hide-coverage')}
              </button>
            </div>
          </div>

          {!coverageHidden && (
            <>
              {coverageViewPartial && (
                <p className="session-message muted">
                  {t('ui.admin-localization.coverage-partial-hint')}
                </p>
              )}
              <LocalizationCoverageTable
                coverage={coverage}
                createMissingEnabled={!coverageViewPartial}
                onCreateMissing={startCreate}
              />
            </>
          )}
        </section>
      )}

      <section className="admin-section" aria-labelledby="localization-list-title">
        <div className="admin-section-heading">
          <div>
            <h2 id="localization-list-title">
              {t('ui.admin-localization.rows-title')}
            </h2>
          </div>
          <div className="section-actions">
            <button
              type="button"
              aria-controls={
                formMode.type === 'create' ? 'localization-create-panel' : undefined
              }
              aria-expanded={formMode.type === 'create'}
              className="compact-action"
              onClick={() => startCreate()}
            >
              {t('ui.admin-localization.new-localization')}
            </button>
          </div>
        </div>

        {formMode.type === 'closed' && <MutationFeedback state={mutationState} />}

        {formMode.type === 'create' && (
          <div
            aria-label={t('ui.admin-localization.create-panel-label')}
            className="workflow-group"
            id="localization-create-panel"
          >
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
            aria-label={t('ui.admin-localization.filters-label')}
            className="localization-filters"
            onSubmit={handleFilterSubmit}
          >
            <label>
              <span>{t('ui.admin-localization.message-key')}</span>
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
              <span>{t('ui.admin-localization.language')}</span>
              <select
                name="language"
                value={filterDraft.language}
                onChange={(event) =>
                  updateFilterDraft({ language: event.currentTarget.value })
                }
              >
                <option value="">{t('ui.admin-localization.all-languages')}</option>
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
            aria-label={t('ui.admin-localization.toolbar-label')}
          >
            <div className="catalog-toolbar-status">
              <span aria-live="polite" className="toolbar-summary">
                {formatLocalizationSummary(t, localizationsState)}
              </span>
              {localizationsState.status === 'ready' && (
                <PaginationControls
                  ariaLabel={t('ui.admin-localization.pagination-top-label')}
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
              message={t('ui.admin-localization.loading-message')}
              title={t('ui.admin-localization.loading-title')}
              variant="loading"
            />
          )}

          {localizationsState.status === 'error' && (
            <StateBlock
              message={getLoadErrorMessage(t, localizationsState)}
              title={t('ui.admin-localization.error-title')}
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
                message={t('ui.admin-localization.empty-message')}
                title={t('ui.admin-localization.empty-title')}
                variant="empty"
              />
            ))}

          {localizationsState.status === 'ready' && (
            <PaginationControls
              ariaLabel={t('ui.admin-localization.pagination-label')}
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
          confirmLabel={t('ui.admin-localization.delete-localization')}
          message={t('ui.admin-localization.delete-message', {
            label: createLocalizationLabel(pendingLocalizationDelete),
          })}
          title={t('ui.common.confirm-deletion')}
          onCancel={closeLocalizationDeleteDialog}
          onConfirm={() => void confirmLocalizationDelete()}
        />
      )}
    </div>
  )
}

function LocalizationCoverageTable({
  coverage,
  createMissingEnabled,
  onCreateMissing,
}: {
  coverage: readonly LocalizationKeyCoverage[]
  createMissingEnabled: boolean
  onCreateMissing: (messageKey: string, language: string) => void
}) {
  const { t } = useI18n()

  if (coverage.length === 0) {
    return null
  }

  return (
    <div
      aria-label={t('ui.admin-localization.coverage-region-label')}
      className="catalog-table-scroll"
      role="region"
      tabIndex={0}
    >
      <table className="catalog-table localization-coverage-table">
        <caption>{t('ui.admin-localization.coverage-caption')}</caption>
        <thead>
          <tr>
            <th className="plain-column-header" scope="col">
              {t('ui.admin-localization.message-key')}
            </th>
            <th className="plain-column-header" scope="col">
              {t('ui.admin-localization.status')}
            </th>
            {SUPPORTED_LOCALIZATION_LANGUAGES.map((language) => (
              <th className="plain-column-header" key={language} scope="col">
                {language}
              </th>
            ))}
            <th className="plain-column-header" scope="col">
              {t('ui.admin-localization.missing-locales')}
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
                  {locale.status === 'missing' && createMissingEnabled ? (
                    <button
                      className="localization-locale-button missing"
                      type="button"
                      aria-label={t('ui.admin-localization.add-locale-label', {
                        language: locale.language,
                        messageKey: group.messageKey,
                      })}
                      onClick={() =>
                        onCreateMissing(group.messageKey, locale.language)
                      }
                    >
                      {t('ui.admin-localization.add-locale', {
                        language: locale.language,
                      })}
                    </button>
                  ) : (
                    <CoverageStatus status={locale.status} />
                  )}
                </td>
              ))}
              <td>{formatMissingLocales(group, t)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatLocalizationSummary(
  t: UiTranslate,
  state: LoadState<LocalizationPage>,
) {
  if (state.status !== 'ready') {
    return t(
      state.status === 'error'
        ? 'ui.admin-localization.rows-status-error'
        : 'ui.admin-localization.rows-status-loading',
    )
  }

  const rowCount = state.value.numberOfElements ?? state.value.content?.length ?? 0
  const total = state.value.totalElements ?? rowCount
  const label = t(
    total === 1
      ? 'ui.admin-localization.row-count-one'
      : 'ui.admin-localization.row-count-many',
    { count: total },
  )

  if (total <= 0 || rowCount <= 0) {
    return label
  }

  const page = state.value.number ?? 0
  const size = state.value.size ?? rowCount
  const start = page * size + 1
  const end = Math.min(start + rowCount - 1, total)

  return t('ui.common.window-summary', { start, end, total: label })
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
  const { t } = useI18n()

  return (
    <div
      aria-label={t('ui.admin-localization.rows-region-label')}
      className="catalog-table-scroll"
      role="region"
      tabIndex={0}
    >
      <table className="catalog-table localization-rows-table">
        <caption className="visually-hidden">
          {t('ui.admin-localization.rows-title')}
        </caption>
        <thead>
          <tr>
            <SortToggleHeader
              direction={getLocalizationSortDirection(sort, 'messageKey')}
              label={t('ui.admin-localization.message-key')}
              onSort={() => onSortByField('messageKey')}
            />
            <SortToggleHeader
              direction={getLocalizationSortDirection(sort, 'language')}
              label={t('ui.admin-localization.language')}
              onSort={() => onSortByField('language')}
            />
            <th className="plain-column-header" scope="col">
              {t('ui.admin-localization.message')}
            </th>
            <th className="plain-column-header" scope="col">
              {t('ui.admin-localization.description')}
            </th>
            <SortToggleHeader
              direction={getLocalizationSortDirection(sort, 'updatedAt')}
              label={t('ui.admin-localization.updated')}
              onSort={() => onSortByField('updatedAt')}
            />
            <th className="plain-column-header row-actions-cell" scope="col">
              {t('ui.common.actions')}
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
  const { t } = useI18n()
  const label = createLocalizationLabel(row)
  const editRowId = `localization-edit-row-${row.id ?? 'unsaved'}`

  return (
    <>
      <tr>
        <th scope="row">
          {row.messageKey ?? t('ui.admin-localization.unknown-key')}
        </th>
        <td>{row.language ?? t('ui.common.unknown')}</td>
        <td>
          {row.messageText?.trim()
            ? row.messageText
            : t('ui.admin-localization.blank-message')}
        </td>
        <td>
          {row.description?.trim()
            ? row.description
            : t('ui.admin-localization.no-description')}
        </td>
        <td>{row.updatedAt ?? t('ui.common.unknown')}</td>
        <td className="row-actions-cell">
          <div className="row-actions">
            <button
              type="button"
              aria-controls={editing ? editRowId : undefined}
              aria-expanded={editing}
              className="secondary-button"
              aria-label={t('ui.common.edit-label', { label })}
              onClick={() => onEditLocalization(row)}
            >
              {t('ui.common.edit')}
            </button>
            <button
              type="button"
              className="danger-button"
              aria-label={t('ui.common.delete-label', { label })}
              onClick={(event) => onDeleteLocalization(row, event.currentTarget)}
            >
              {t('ui.common.delete')}
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
  const { t } = useI18n()
  const submitting = mutationState.status === 'submitting'
  const editing = mode.type === 'edit'
  const formTitle = editing
    ? t('ui.admin-localization.edit-localization')
    : t('ui.admin-localization.create-localization')

  return (
    <form
      className="localization-management-form"
      aria-label={formTitle}
      onSubmit={onSubmit}
    >
      <div className="form-heading-row">
        <div>
          <h3 id="localization-form-title">{formTitle}</h3>
        </div>
        <div className="section-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={submitting}
            onClick={onClose}
          >
            {editing
              ? t('ui.admin-localization.cancel-edit')
              : t('ui.common.close')}
          </button>
        </div>
      </div>

      <div className="admin-form-grid localization-form-grid">
        <label>
          <span>{t('ui.admin-localization.message-key')}</span>
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
          <span>{t('ui.admin-localization.language')}</span>
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
          <span>{t('ui.admin-localization.description')}</span>
          <input
            value={draft.description}
            onChange={(event) =>
              onDraftChange({ description: event.currentTarget.value })
            }
          />
        </label>
      </div>

      <label className="localization-message-field">
        <span>{t('ui.admin-localization.message-text')}</span>
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
            ? t('ui.admin-localization.saving-localization')
            : editing
              ? t('ui.admin-localization.save-localization')
              : t('ui.admin-localization.create-localization')}
        </button>
      </div>

      <MutationFeedback state={mutationState} />
    </form>
  )
}

function CoverageStatus({ status }: { status: LocalizationCoverageStatus }) {
  const { t } = useI18n()

  return (
    <span className={`coverage-pill ${status}`}>
      {t(`ui.coverage.${status}`)}
    </span>
  )
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

function formatMissingLocales(group: LocalizationKeyCoverage, t: UiTranslate) {
  const missingLocales = group.locales
    .filter((locale) => locale.status === 'missing')
    .map((locale) => locale.language)

  return missingLocales.length > 0
    ? missingLocales.join(', ')
    : t('ui.common.none')
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
