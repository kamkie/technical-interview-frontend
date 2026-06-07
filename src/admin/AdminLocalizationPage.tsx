import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  fetchCurrentAccount,
  type UserAccount,
} from '../api/account'
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
import { MutationFeedback } from '../ui/MutationFeedback'
import { PaginationControls } from '../ui/PaginationControls'
import { StateBlock } from '../ui/StateBlock'

export const ADMIN_LOCALIZATION_ROUTE_PATH = '/admin/localizations' as const

const EMPTY_LOCALIZATIONS: readonly LocalizationResponse[] = []
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
const SORT_OPTIONS = [
  {
    label: 'Message key A-Z',
    sort: ['messageKey,ASC', 'language,ASC'],
    value: 'messageKey,ASC|language,ASC',
  },
  {
    label: 'Message key Z-A',
    sort: ['messageKey,DESC', 'language,ASC'],
    value: 'messageKey,DESC|language,ASC',
  },
  {
    label: 'Language A-Z',
    sort: ['language,ASC', 'messageKey,ASC'],
    value: 'language,ASC|messageKey,ASC',
  },
  {
    label: 'Recently updated',
    sort: ['updatedAt,DESC', 'messageKey,ASC'],
    value: 'updatedAt,DESC|messageKey,ASC',
  },
] as const

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
  | { type: 'create' }
  | { type: 'edit'; id: number }

type LocalizationFormDraft = {
  description: string
  language: SupportedLocalizationLanguage
  messageKey: string
  messageText: string
}

export function AdminLocalizationPage({ session }: { session: SessionResponse }) {
  const [accountState, setAccountState] = useState<LoadState<UserAccount>>({
    status: 'loading',
  })

  useEffect(() => {
    let ignore = false

    fetchCurrentAccount(session)
      .then((account) => {
        if (!ignore) {
          setAccountState({ status: 'ready', value: account })
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setAccountState({
            status: 'error',
            message: getDisplayMessage(
              error,
              'Admin account details could not be loaded.',
            ),
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [session])

  return (
    <section
      className="admin-localization-panel"
      aria-labelledby="admin-localization-title"
    >
      <div className="section-heading">
        <p className="eyebrow">Admin localizations</p>
        <h2 id="admin-localization-title">Localization management</h2>
        <p className="section-description">
          Maintain localized messages by key and language while reviewing
          translated text as content.
        </p>
      </div>

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
    type: 'create',
  })
  const [formDraft, setFormDraft] = useState<LocalizationFormDraft>(() =>
    createEmptyLocalizationDraft(),
  )
  const [mutationState, setMutationState] = useState<MutationState>({
    status: 'idle',
  })

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
  const pageSize =
    localizationsState.status === 'ready'
      ? localizationsState.value.size ?? query.size
      : query.size
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

  function updateFilterDraft(update: Partial<LocalizationFilterDraft>) {
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
    updateLocalizationQuery({
      ...query,
      language: filterDraft.language,
      messageKey: filterDraft.messageKey.trim(),
      page: 0,
    })
  }

  function clearFilters() {
    const defaultQuery = DEFAULT_LOCALIZATION_QUERY

    updateFilterDraft(createLocalizationFilterDraft(defaultQuery))
    updateLocalizationQuery(defaultQuery)
  }

  function changePageSize(size: PageSize) {
    updateLocalizationQuery({
      ...query,
      page: 0,
      size,
    })
  }

  function changeSort(value: string) {
    const option = SORT_OPTIONS.find((item) => item.value === value)

    updateLocalizationQuery({
      ...query,
      page: 0,
      sort: option?.sort ?? DEFAULT_LOCALIZATION_QUERY.sort,
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
  }

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

  async function deleteVisibleLocalization(row: LocalizationResponse) {
    if (row.id === undefined) {
      return
    }

    const label = createLocalizationLabel(row)

    if (!window.confirm(`Delete ${label}?`)) {
      return
    }

    setMutationState({ status: 'submitting' })

    try {
      await deleteLocalization(session, row.id)

      if (formMode.type === 'edit' && formMode.id === row.id) {
        cancelEdit()
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

  function cancelEdit() {
    setFormMode({ type: 'create' })
    setFormDraft(createEmptyLocalizationDraft())
    setMutationState({ status: 'idle' })
  }

  return (
    <div className="admin-localization-layout">
      <div
        className="route-state-panel"
        aria-label="Localization status summary"
      >
        <div>
          <span className="state-label">Current task</span>
          <span className="state-value">Maintain localized messages</span>
        </div>
        <div>
          <span className="state-label">Message state</span>
          <span className="state-value">
            {formatLoadStatus(localizationsState.status)}
          </span>
        </div>
        <div>
          <span className="state-label">Coverage</span>
          <span className="state-value">
            {coverage.length > 0 ? 'Coverage visible' : 'No coverage rows'}
          </span>
        </div>
        <div>
          <span className="state-label">Primary actions</span>
          <span className="state-value">Create, edit, delete</span>
        </div>
      </div>

      <section className="admin-section" aria-labelledby="localization-list-title">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Messages</p>
            <h3 id="localization-list-title">Localization rows</h3>
            <p className="section-description">
              Filter by message key or language and review the matching
              localized text.
            </p>
          </div>
          <div className="section-actions">
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

        <div className="workflow-group" aria-labelledby="localization-search-title">
          <div className="workflow-group-heading">
            <div>
              <h4 id="localization-search-title">Find message rows</h4>
              <p className="section-description">
                Narrow by stable key and locale before editing individual rows.
              </p>
            </div>
          </div>

          <form className="localization-filters" onSubmit={handleFilterSubmit}>
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
            <div className="catalog-filter-actions">
              <button type="submit">Search</button>
              <button type="button" className="secondary-button" onClick={clearFilters}>
                Clear
              </button>
            </div>
          </form>

          <div
            className="localization-controls"
            aria-label="Localization table controls"
          >
            <label>
              <span>Sort by</span>
              <select
                value={getSortOptionValue(query.sort)}
                onChange={(event) => changeSort(event.currentTarget.value)}
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
                onChange={(event) =>
                  changePageSize(Number(event.currentTarget.value) as PageSize)
                }
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <LocalizationWorkflowSummary
            coverage={coverage}
            page={
              localizationsState.status === 'ready'
                ? localizationsState.value
                : null
            }
            query={query}
            state={localizationsState.status}
          />
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

        <div className="workflow-group" aria-labelledby="localization-coverage-title">
          <div className="workflow-group-heading">
            <div>
              <h4 id="localization-coverage-title">Review locale coverage</h4>
              <p className="section-description">
                Scan supported locales and create missing rows from stable
                message keys.
              </p>
            </div>
          </div>

          <LocalizationCoverageTable
            coverage={coverage}
            onCreateMissing={startCreate}
          />
        </div>

        {localizationsState.status === 'ready' &&
          (rows.length > 0 ? (
            <div className="workflow-group" aria-labelledby="localization-row-title">
              <div className="workflow-group-heading">
                <div>
                  <h4 id="localization-row-title">Operate on rows</h4>
                  <p className="section-description">
                    Edit or delete one backend row at a time.
                  </p>
                </div>
              </div>
              <LocalizationResults
                rows={rows}
                onDeleteLocalization={(row) => void deleteVisibleLocalization(row)}
                onEditLocalization={(row) => void startEdit(row)}
              />
            </div>
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
            pageSize={pageSize}
            querySize={query.size}
            totalPages={totalPages}
            onNextPage={() => goToPage(pageNumber + 1)}
            onPageSizeChange={(size) => changePageSize(size as PageSize)}
            onPreviousPage={() => goToPage(pageNumber - 1)}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        )}
      </section>

      <section className="admin-section" aria-labelledby="localization-form-title">
        <LocalizationForm
          draft={formDraft}
          mode={formMode}
          mutationState={mutationState}
          onCancelEdit={cancelEdit}
          onDraftChange={updateDraft}
          onSubmit={(event) => void handleFormSubmit(event)}
        />
      </section>
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
                      onClick={() =>
                        onCreateMissing(group.messageKey, locale.language)
                      }
                    >
                      Add {group.messageKey} {locale.language}
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

function LocalizationWorkflowSummary({
  coverage,
  page,
  query,
  state,
}: {
  coverage: readonly LocalizationKeyCoverage[]
  page: LocalizationPage | null
  query: LocalizationQueryState
  state: LoadState<LocalizationPage>['status']
}) {
  const activeFilters = getLocalizationFilterSummary(query)
  const totalRows = page?.totalElements
  const rowCount = page?.numberOfElements ?? page?.content?.length
  const missingLocaleCount =
    state === 'error'
      ? undefined
      : coverage.reduce(
          (total, group) =>
            total +
            group.locales.filter((locale) => locale.status === 'missing').length,
          0,
        )

  return (
    <div className="catalog-summary admin-workflow-summary" aria-live="polite">
      <p>
        {page
          ? `Showing ${rowCount ?? 0}${
              totalRows !== undefined ? ` of ${totalRows}` : ''
            } localization rows.`
          : `Localization rows are ${formatLoadStatus(state).toLowerCase()}.`}
      </p>
      <dl
        className="catalog-query-details compact-query-details"
        aria-label="Active localization workflow"
      >
        <div>
          <dt>Filters</dt>
          <dd>{activeFilters.length > 0 ? activeFilters.join(' / ') : 'None'}</dd>
        </div>
        <div>
          <dt>Sort</dt>
          <dd>{query.sort.join(' / ')}</dd>
        </div>
        <div>
          <dt>Page size</dt>
          <dd>{query.size}</dd>
        </div>
        <div>
          <dt>Coverage keys</dt>
          <dd>{state === 'error' ? 'Unknown' : coverage.length}</dd>
        </div>
        <div>
          <dt>Missing locales</dt>
          <dd>{missingLocaleCount ?? 'Unknown'}</dd>
        </div>
      </dl>
    </div>
  )
}

function LocalizationResults({
  onDeleteLocalization,
  onEditLocalization,
  rows,
}: {
  onDeleteLocalization: (row: LocalizationResponse) => void
  onEditLocalization: (row: LocalizationResponse) => void
  rows: readonly LocalizationResponse[]
}) {
  return (
    <div className="catalog-table-scroll">
      <table className="catalog-table localization-rows-table">
        <caption className="visually-hidden">Localization rows</caption>
        <thead>
          <tr>
            <th className="plain-column-header" scope="col">
              Message key
            </th>
            <th className="plain-column-header" scope="col">
              Language
            </th>
            <th className="plain-column-header" scope="col">
              Message
            </th>
            <th className="plain-column-header" scope="col">
              Description
            </th>
            <th className="plain-column-header" scope="col">
              Updated
            </th>
            <th className="plain-column-header" scope="col">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <LocalizationRow
              key={row.id ?? `${row.messageKey}-${row.language}-${row.messageText}`}
              row={row}
              onDeleteLocalization={onDeleteLocalization}
              onEditLocalization={onEditLocalization}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LocalizationRow({
  onDeleteLocalization,
  onEditLocalization,
  row,
}: {
  onDeleteLocalization: (row: LocalizationResponse) => void
  onEditLocalization: (row: LocalizationResponse) => void
  row: LocalizationResponse
}) {
  const label = createLocalizationLabel(row)

  return (
    <tr>
      <th scope="row">{row.messageKey ?? 'Unknown key'}</th>
      <td>{row.language ?? 'Unknown'}</td>
      <td>{row.messageText?.trim() ? row.messageText : 'Blank message'}</td>
      <td>{row.description?.trim() ? row.description : 'No description'}</td>
      <td>{row.updatedAt ?? 'Unknown'}</td>
      <td>
        <div className="row-actions">
          <button type="button" onClick={() => onEditLocalization(row)}>
            Edit {label}
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={() => onDeleteLocalization(row)}
          >
            Delete {label}
          </button>
        </div>
      </td>
    </tr>
  )
}

function LocalizationForm({
  draft,
  mode,
  mutationState,
  onCancelEdit,
  onDraftChange,
  onSubmit,
}: {
  draft: LocalizationFormDraft
  mode: LocalizationFormMode
  mutationState: MutationState
  onCancelEdit: () => void
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
          <p className="section-description">
            Use message keys and supported language codes for each row.
          </p>
        </div>
        {editing && (
          <div className="section-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={submitting}
              onClick={onCancelEdit}
            >
              Cancel edit
            </button>
          </div>
        )}
      </div>

      <div className="admin-form-grid localization-form-grid">
        <label>
          <span>Message key</span>
          <input
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

function getSortOptionValue(sort: readonly string[]) {
  const value = sort.join('|')

  return SORT_OPTIONS.some((option) => option.value === value)
    ? value
    : SORT_OPTIONS[0].value
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

function getLocalizationFilterSummary(query: LocalizationQueryState) {
  const filters: string[] = []

  if (query.messageKey) {
    filters.push(`Message key: ${query.messageKey}`)
  }

  if (query.language) {
    filters.push(`Language: ${query.language}`)
  }

  return filters
}

function createFilterDraftKey(draft: LocalizationFilterDraft) {
  return `${draft.messageKey}\u0000${draft.language}`
}
