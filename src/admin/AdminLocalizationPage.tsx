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

type LoadState<T> =
  | { status: 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'error'; message: string }

type MutationState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

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
      </div>

      {accountState.status === 'loading' && (
        <p className="session-message" role="status">
          Loading admin access...
        </p>
      )}

      {accountState.status === 'error' && (
        <p className="session-message error" role="alert">
          {accountState.message}
        </p>
      )}

      {accountState.status === 'ready' &&
        (hasAdminRole(accountState.value) ? (
          <AdminLocalizationManager session={session} />
        ) : (
          <p className="session-message error" role="alert">
            Admin access is required for localization management.
          </p>
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

        patchVisibleLocalizations(updatedLocalization)
        setFormDraft(createLocalizationDraft(updatedLocalization))
        setMutationState({
          status: 'success',
          message: 'Localization updated.',
        })
      } else {
        const createdLocalization = await createLocalization(session, request)

        patchVisibleLocalizations(createdLocalization)
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
      removeVisibleLocalization(row.id)

      if (formMode.type === 'edit' && formMode.id === row.id) {
        cancelEdit()
      }

      setMutationState({
        status: 'success',
        message: 'Localization deleted.',
      })
    } catch (error: unknown) {
      setMutationState({
        status: 'error',
        message: getDisplayMessage(error, 'Localization row could not be deleted.'),
      })
    }
  }

  function patchVisibleLocalizations(row: LocalizationResponse) {
    setLocalizationsState((current) => {
      if (current.status !== 'ready') {
        return current
      }

      if (!matchesLocalizationQuery(row, query)) {
        return {
          status: 'ready',
          value: removeLocalizationFromPage(current.value, row.id),
        }
      }

      return {
        status: 'ready',
        value: upsertLocalizationInPage(current.value, row),
      }
    })
  }

  function removeVisibleLocalization(id: number) {
    setLocalizationsState((current) =>
      current.status === 'ready'
        ? {
            status: 'ready',
            value: removeLocalizationFromPage(current.value, id),
          }
        : current,
    )
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
      <section className="admin-section" aria-labelledby="localization-list-title">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Messages</p>
            <h3 id="localization-list-title">Localization rows</h3>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={refreshLocalizations}
          >
            Refresh localizations
          </button>
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

        {localizationsState.status === 'loading' && (
          <p className="session-message" role="status">
            Loading localizations...
          </p>
        )}

        {localizationsState.status === 'error' && (
          <p className="session-message error" role="alert">
            {localizationsState.message}
          </p>
        )}

        <LocalizationCoverageTable
          coverage={coverage}
          onCreateMissing={startCreate}
        />

        {localizationsState.status === 'ready' &&
          (rows.length > 0 ? (
            <LocalizationResults
              rows={rows}
              onDeleteLocalization={(row) => void deleteVisibleLocalization(row)}
              onEditLocalization={(row) => void startEdit(row)}
            />
          ) : (
            <p className="session-message muted">
              No localization rows match these filters.
            </p>
          ))}

        {localizationsState.status === 'ready' && (
          <PaginationControls
            first={localizationsState.value.first === true}
            last={localizationsState.value.last === true}
            pageNumber={pageNumber}
            pageSize={pageSize}
            querySize={query.size}
            totalPages={totalPages}
            onNextPage={() => goToPage(pageNumber + 1)}
            onPageSizeChange={changePageSize}
            onPreviousPage={() => goToPage(pageNumber - 1)}
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
        <h3 id="localization-form-title">
          {editing ? 'Edit localization' : 'Create localization'}
        </h3>
        {editing && (
          <button
            type="button"
            className="secondary-button"
            disabled={submitting}
            onClick={onCancelEdit}
          >
            Cancel edit
          </button>
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
    <div className="pagination-controls" aria-label="Localization pagination">
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

function CoverageStatus({ status }: { status: LocalizationCoverageStatus }) {
  return <span className={`coverage-pill ${status}`}>{status}</span>
}

function MutationFeedback({ state }: { state: MutationState }) {
  if (state.status === 'success') {
    return (
      <p className="session-message" role="status">
        {state.message}
      </p>
    )
  }

  if (state.status === 'error') {
    return (
      <p className="session-message error" role="alert">
        {state.message}
      </p>
    )
  }

  return null
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

  appendString(searchParams, 'messageKey', query.messageKey)
  appendString(searchParams, 'language', query.language)

  if (query.page > 0) {
    searchParams.set('page', String(query.page))
  }

  if (query.size !== DEFAULT_LOCALIZATION_QUERY.size) {
    searchParams.set('size', String(query.size))
  }

  if (!sameValues(query.sort, DEFAULT_LOCALIZATION_QUERY.sort)) {
    appendRepeated(searchParams, 'sort', query.sort)
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

function upsertLocalizationInPage(
  page: LocalizationPage,
  row: LocalizationResponse,
): LocalizationPage {
  const content = page.content ?? []
  const existing = row.id !== undefined && content.some((item) => item.id === row.id)
  const nextContent = existing
    ? content.map((item) => (item.id === row.id ? row : item))
    : [...content, row]

  return {
    ...page,
    content: nextContent,
    numberOfElements: nextContent.length,
    totalElements: existing ? page.totalElements : (page.totalElements ?? content.length) + 1,
  }
}

function removeLocalizationFromPage(
  page: LocalizationPage,
  id: number | undefined,
): LocalizationPage {
  if (id === undefined) {
    return page
  }

  const content = (page.content ?? []).filter((row) => row.id !== id)
  const removed = content.length !== (page.content ?? []).length

  return {
    ...page,
    content,
    numberOfElements: content.length,
    totalElements: removed
      ? Math.max(0, (page.totalElements ?? content.length) - 1)
      : page.totalElements,
  }
}

function matchesLocalizationQuery(
  row: LocalizationResponse,
  query: LocalizationQueryState,
) {
  const messageKey = row.messageKey?.trim()
  const language = row.language?.trim().toLowerCase()

  if (query.messageKey && messageKey !== query.messageKey) {
    return false
  }

  if (query.language && language !== query.language) {
    return false
  }

  return true
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

function parseNonNegativeInteger(value: string | null, fallback: number) {
  if (value === null || value.trim() === '') {
    return fallback
  }

  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

function parsePageSize(value: string | null): PageSize {
  const parsed = parseNonNegativeInteger(value, DEFAULT_LOCALIZATION_QUERY.size)

  return PAGE_SIZE_OPTIONS.includes(parsed as PageSize)
    ? (parsed as PageSize)
    : DEFAULT_LOCALIZATION_QUERY.size
}

function uniqueTrimmedValues(values: readonly string[]) {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const value of values) {
    const trimmed = value.trim()

    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed)
      normalized.push(trimmed)
    }
  }

  return normalized
}

function appendString(
  searchParams: URLSearchParams,
  name: string,
  value: string,
) {
  const trimmed = value.trim()

  if (trimmed) {
    searchParams.set(name, trimmed)
  }
}

function appendRepeated(
  searchParams: URLSearchParams,
  name: string,
  values: readonly string[],
) {
  for (const value of uniqueTrimmedValues(values)) {
    searchParams.append(name, value)
  }
}

function sameValues(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function hasAdminRole(account: UserAccount) {
  return (account.roles ?? []).includes('ADMIN')
}

function getDisplayMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function createFilterDraftKey(draft: LocalizationFilterDraft) {
  return `${draft.messageKey}\u0000${draft.language}`
}
