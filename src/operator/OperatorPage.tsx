import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  DEFAULT_AUDIT_PAGE,
  DEFAULT_AUDIT_PAGE_SIZE,
  DEFAULT_AUDIT_SORT,
  fetchAuditLogs,
  type AuditAction,
  type AuditLog,
  type AuditLogPage,
  type AuditTargetType,
} from '../api/operator'
import type { SessionResponse } from '../api/session'
import {
  appendRepeatedParams,
  appendStringParam,
  parseNonNegativeInteger,
  parsePositiveInteger,
  sameValues,
  trimmedValues,
} from '../routing/queryParams'
import {
  formatLoadStatus,
  getDisplayMessage,
  type LoadState,
} from '../ui/asyncState'
import { formatTimestamp } from '../ui/format'
import { PaginationControls } from '../ui/PaginationControls'
import { StateBlock } from '../ui/StateBlock'
import { AuditDetailsPanel } from './AuditDetailsPanel'
import {
  createAuditEntryKey,
  createAuditEntryLabel,
  formatEnumValue,
  formatOptionalNumber,
} from './auditFormat'

export const OPERATOR_ROUTE_PATH = '/operator' as const

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
const EMPTY_AUDIT_ROWS: readonly AuditLog[] = []

const AUDIT_TARGET_TYPE_LABELS: Record<AuditTargetType, string> = {
  AUTHENTICATION: 'Authentication',
  BOOK: 'Book',
  CATEGORY: 'Category',
  LOCALIZATION_MESSAGE: 'Localization message',
  USER_ACCOUNT: 'User account',
}

const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: 'Create',
  DELETE: 'Delete',
  LOGIN_FAILURE: 'Login failure',
  LOGIN_SUCCESS: 'Login success',
  LOGOUT: 'Logout',
  SESSION_REJECTION: 'Session rejection',
  UPDATE: 'Update',
}

const AUDIT_TARGET_TYPES = Object.keys(
  AUDIT_TARGET_TYPE_LABELS,
) as AuditTargetType[]
const AUDIT_ACTIONS = Object.keys(AUDIT_ACTION_LABELS) as AuditAction[]

const SORT_OPTIONS = [
  {
    label: 'Newest id first',
    sort: DEFAULT_AUDIT_SORT,
    value: DEFAULT_AUDIT_SORT.join('|'),
  },
  {
    label: 'Newest timestamp first',
    sort: ['createdAt,DESC', 'id,DESC'],
    value: 'createdAt,DESC|id,DESC',
  },
  {
    label: 'Oldest timestamp first',
    sort: ['createdAt,ASC', 'id,ASC'],
    value: 'createdAt,ASC|id,ASC',
  },
  {
    label: 'Actor login A-Z',
    sort: ['actorLogin,ASC', 'createdAt,DESC'],
    value: 'actorLogin,ASC|createdAt,DESC',
  },
  {
    label: 'Target type A-Z',
    sort: ['targetType,ASC', 'createdAt,DESC'],
    value: 'targetType,ASC|createdAt,DESC',
  },
] as const

type AuditQueryState = {
  action: AuditAction | ''
  actorLogin: string
  page: number
  size: number
  sort: readonly string[]
  targetType: AuditTargetType | ''
}

type AuditFilterDraft = Pick<
  AuditQueryState,
  'action' | 'actorLogin' | 'targetType'
>

export function OperatorPage({ session }: { session: SessionResponse }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useMemo(() => parseAuditSearchParams(searchParams), [searchParams])
  const routeFilterDraft = createAuditFilterDraft(query)
  const routeFilterDraftKey = createFilterDraftKey(routeFilterDraft)
  const [filterDraftState, setFilterDraftState] = useState(() => ({
    key: routeFilterDraftKey,
    value: routeFilterDraft,
  }))
  const filterDraft =
    filterDraftState.key === routeFilterDraftKey
      ? filterDraftState.value
      : routeFilterDraft
  const [auditPageState, setAuditPageState] = useState<LoadState<AuditLogPage>>({
    status: 'loading',
  })
  const [selectedAuditEntry, setSelectedAuditEntry] = useState<AuditLog | null>(
    null,
  )
  const detailsReturnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (session.authenticated !== true) {
      return undefined
    }

    let ignore = false

    fetchAuditLogs(auditQueryToSearchParams(query))
      .then((page) => {
        if (!ignore) {
          setAuditPageState({ status: 'ready', value: page })
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setAuditPageState({
            status: 'error',
            message: getDisplayMessage(error, 'Audit logs could not be loaded.'),
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [query, session])

  function updateAuditQuery(nextQuery: AuditQueryState) {
    const nextSearchParams = auditQueryToUrlSearchParams(nextQuery)

    if (nextSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(nextSearchParams)
    }
  }

  function updateFilterDraft(update: Partial<AuditFilterDraft>) {
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
    updateAuditQuery({
      ...query,
      action: filterDraft.action,
      actorLogin: filterDraft.actorLogin.trim(),
      page: 0,
      targetType: filterDraft.targetType,
    })
  }

  function clearFilters() {
    updateFilterDraft(createAuditFilterDraft(DEFAULT_AUDIT_QUERY))
    updateAuditQuery(DEFAULT_AUDIT_QUERY)
  }

  function changePageSize(size: number) {
    updateAuditQuery({
      ...query,
      page: 0,
      size,
    })
  }

  function changeSort(value: string) {
    const option = SORT_OPTIONS.find((item) => item.value === value)
    const customSort = value
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean)
    const nextSort =
      option?.sort ?? (customSort.length > 0 ? customSort : DEFAULT_AUDIT_SORT)

    updateAuditQuery({
      ...query,
      page: 0,
      sort: nextSort,
    })
  }

  function goToPage(page: number) {
    updateAuditQuery({
      ...query,
      page: Math.max(0, page),
    })
  }

  function openDetails(entry: AuditLog, opener: HTMLElement) {
    detailsReturnFocusRef.current = opener
    setSelectedAuditEntry(entry)
  }

  function closeDetails() {
    const opener = detailsReturnFocusRef.current

    setSelectedAuditEntry(null)
    window.requestAnimationFrame(() => opener?.focus())
  }

  if (session.authenticated !== true) {
    return (
      <section className="operator-panel" aria-labelledby="operator-title">
        <div className="section-heading">
          <p className="eyebrow">Operator</p>
          <h2 id="operator-title">Operator audit</h2>
          <p className="section-description">
            Inspect read-only operational and audit evidence for an
            authenticated session.
          </p>
        </div>
        <StateBlock
          message="Sign in is required for operator audit access."
          title="Sign in required"
          variant="error"
        />
      </section>
    )
  }

  return (
    <section className="operator-panel" aria-label="Operator audit">
      <div className="operator-layout">
        <section className="operator-section" aria-labelledby="audit-log-title">
          <div className="admin-section-heading">
            <div>
              <p className="eyebrow">Audit log</p>
              <h2 id="audit-log-title">Audit rows</h2>
              <p className="section-description">
                Review audit entries with filters, sorting, and pagination.
              </p>
            </div>
          </div>

          <div className="workflow-group" aria-labelledby="audit-search-title">
            <div className="workflow-group-heading">
              <div>
                <h3 id="audit-search-title">Find audit entries</h3>
                <p className="section-description">
                  Keep URL-backed filters, sort, and page size aligned with
                  the audit query.
                </p>
              </div>
            </div>

            <form
              aria-label="Audit filters"
              className="operator-filters"
              onSubmit={handleFilterSubmit}
            >
              <label>
                <span>Target type</span>
                <select
                  name="targetType"
                  value={filterDraft.targetType}
                  onChange={(event) =>
                    updateFilterDraft({
                      targetType: event.currentTarget.value as AuditTargetType | '',
                    })
                  }
                >
                  <option value="">All targets</option>
                  {AUDIT_TARGET_TYPES.map((targetType) => (
                    <option key={targetType} value={targetType}>
                      {AUDIT_TARGET_TYPE_LABELS[targetType]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Action</span>
                <select
                  name="action"
                  value={filterDraft.action}
                  onChange={(event) =>
                    updateFilterDraft({
                      action: event.currentTarget.value as AuditAction | '',
                    })
                  }
                >
                  <option value="">All actions</option>
                  {AUDIT_ACTIONS.map((action) => (
                    <option key={action} value={action}>
                      {AUDIT_ACTION_LABELS[action]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Actor login</span>
                <input
                  name="actorLogin"
                  type="search"
                  value={filterDraft.actorLogin}
                  onChange={(event) =>
                    updateFilterDraft({ actorLogin: event.currentTarget.value })
                  }
                />
              </label>
              <div className="catalog-filter-actions">
                <button type="submit">Search audit logs</button>
                <button type="button" className="secondary-button" onClick={clearFilters}>
                  Clear
                </button>
              </div>
            </form>

            <div className="operator-controls" aria-label="Audit table controls">
              <label>
                <span>Sort by</span>
                <select
                  value={getSortOptionValue(query.sort)}
                  onChange={(event) => changeSort(event.currentTarget.value)}
                >
                  {isCustomSort(query.sort) && (
                    <option value={query.sort.join('|')}>Custom sort</option>
                  )}
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
                    changePageSize(Number(event.currentTarget.value))
                  }
                >
                  {!PAGE_SIZE_OPTIONS.includes(query.size as PageSizeOption) && (
                    <option value={query.size}>{query.size}</option>
                  )}
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <AuditWorkflowSummary
              query={query}
              selectedAuditEntry={selectedAuditEntry}
              state={auditPageState}
            />
          </div>

          <div className="workflow-group" aria-labelledby="audit-review-title">
            <div className="workflow-group-heading">
              <div>
                <h3 id="audit-review-title">Review audit rows</h3>
                <p className="section-description">
                  Open read-only details from the pageable audit table.
                </p>
              </div>
            </div>
            <AuditLogResults
              query={query}
              state={auditPageState}
              onNextPage={() =>
                goToPage(
                  auditPageState.status === 'ready'
                    ? (auditPageState.value.number ?? query.page) + 1
                    : query.page + 1,
                )
              }
              onPageSizeChange={changePageSize}
              onPreviousPage={() =>
                goToPage(
                  auditPageState.status === 'ready'
                    ? (auditPageState.value.number ?? query.page) - 1
                    : query.page - 1,
                )
              }
              onSelectEntry={openDetails}
            />
          </div>
        </section>

        <AuditDetailsPanel
          entry={selectedAuditEntry}
          onCloseDetails={closeDetails}
        />
      </div>
    </section>
  )
}

function AuditLogResults({
  onNextPage,
  onPageSizeChange,
  onPreviousPage,
  onSelectEntry,
  query,
  state,
}: {
  onNextPage: () => void
  onPageSizeChange: (size: number) => void
  onPreviousPage: () => void
  onSelectEntry: (entry: AuditLog, opener: HTMLElement) => void
  query: AuditQueryState
  state: LoadState<AuditLogPage>
}) {
  if (state.status === 'loading') {
    return (
      <StateBlock
        message="Loading audit logs..."
        title="Loading audit rows"
        variant="loading"
      />
    )
  }

  if (state.status === 'error') {
    return (
      <StateBlock
        message={state.message}
        title="Audit rows unavailable"
        variant="error"
      />
    )
  }

  const page = state.value
  const rows = page.content ?? EMPTY_AUDIT_ROWS

  return (
    <div className="audit-results">
      {rows.length === 0 ? (
        <StateBlock
          message="No audit entries match these filters."
          title="No audit rows found"
          variant="empty"
        />
      ) : (
        <div
          aria-label="Scrollable operator audit table"
          className="catalog-table-scroll"
          role="region"
          tabIndex={0}
        >
          <table className="catalog-table operator-audit-table">
            <caption className="visually-hidden">Operator audit rows</caption>
            <thead>
              <tr>
                <th className="plain-column-header" scope="col">
                  Created
                </th>
                <th className="plain-column-header" scope="col">
                  Target
                </th>
                <th className="plain-column-header" scope="col">
                  Action
                </th>
                <th className="plain-column-header" scope="col">
                  Actor
                </th>
                <th className="plain-column-header" scope="col">
                  Summary
                </th>
                <th className="plain-column-header" scope="col">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry, index) => (
                <AuditLogRow
                  entry={entry}
                  index={index}
                  key={createAuditEntryKey(entry, index)}
                  onSelectEntry={onSelectEntry}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AuditPaginationControls
        page={page}
        query={query}
        onNextPage={onNextPage}
        onPageSizeChange={onPageSizeChange}
        onPreviousPage={onPreviousPage}
      />
    </div>
  )
}

function AuditWorkflowSummary({
  query,
  selectedAuditEntry,
  state,
}: {
  query: AuditQueryState
  selectedAuditEntry: AuditLog | null
  state: LoadState<AuditLogPage>
}) {
  const activeFilters = getAuditFilterSummary(query)
  const page = state.status === 'ready' ? state.value : null
  const rowCount = page?.numberOfElements ?? page?.content?.length
  const totalElements = page?.totalElements

  return (
    <div className="catalog-summary admin-workflow-summary" aria-live="polite">
      <p>
        {page
          ? `Showing ${rowCount ?? 0}${
              totalElements !== undefined ? ` of ${totalElements}` : ''
            } audit entries.`
          : `Audit rows are ${formatLoadStatus(state.status).toLowerCase()}.`}
      </p>
      <dl
        className="catalog-query-details compact-query-details"
        aria-label="Active audit workflow"
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
          <dt>Page</dt>
          <dd>{query.page + 1}</dd>
        </div>
        <div>
          <dt>Page size</dt>
          <dd>{query.size}</dd>
        </div>
        <div>
          <dt>Selected</dt>
          <dd>
            {selectedAuditEntry !== null
              ? createAuditEntryLabel(selectedAuditEntry, 0)
              : 'None'}
          </dd>
        </div>
      </dl>
    </div>
  )
}

function AuditLogRow({
  entry,
  index,
  onSelectEntry,
}: {
  entry: AuditLog
  index: number
  onSelectEntry: (entry: AuditLog, opener: HTMLElement) => void
}) {
  const entryLabel = createAuditEntryLabel(entry, index)

  return (
    <tr>
      <td>{formatTimestamp(entry.createdAt)}</td>
      <td>
        {formatEnumValue(entry.targetType)}
        <span className="table-subtext">ID {formatOptionalNumber(entry.targetId)}</span>
      </td>
      <td>{formatEnumValue(entry.action)}</td>
      <td>{entry.actorLogin?.trim() ? entry.actorLogin : 'Unknown actor'}</td>
      <td>{entry.summary?.trim() ? entry.summary : 'No summary'}</td>
      <td>
        <button
          className="secondary-button"
          type="button"
          aria-label={`View ${entryLabel}`}
          onClick={(event) => onSelectEntry(entry, event.currentTarget)}
        >
          View
        </button>
      </td>
    </tr>
  )
}

function AuditPaginationControls({
  onNextPage,
  onPageSizeChange,
  onPreviousPage,
  page,
  query,
}: {
  onNextPage: () => void
  onPageSizeChange: (size: number) => void
  onPreviousPage: () => void
  page: AuditLogPage
  query: AuditQueryState
}) {
  const pageNumber = page.number ?? query.page
  const pageSize = page.size ?? query.size
  const totalPages = page.totalPages ?? 0
  const first = page.first === true || pageNumber <= 0
  const last =
    page.last === true || (totalPages > 0 && pageNumber >= totalPages - 1)

  return (
    <PaginationControls
      ariaLabel="Audit pagination"
      first={first}
      last={last}
      onNextPage={onNextPage}
      onPageSizeChange={onPageSizeChange}
      onPreviousPage={onPreviousPage}
      pageNumber={pageNumber}
      pageSize={pageSize}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      querySize={query.size}
      totalPages={totalPages}
    />
  )
}

const DEFAULT_AUDIT_QUERY: AuditQueryState = {
  action: '',
  actorLogin: '',
  page: DEFAULT_AUDIT_PAGE,
  size: DEFAULT_AUDIT_PAGE_SIZE,
  sort: DEFAULT_AUDIT_SORT,
  targetType: '',
}

type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]

function parseAuditSearchParams(searchParams: URLSearchParams): AuditQueryState {
  const sort = trimmedValues(searchParams.getAll('sort'))

  return {
    action: normalizeAuditAction(searchParams.get('action')),
    actorLogin: searchParams.get('actorLogin')?.trim() ?? '',
    page: parseNonNegativeInteger(searchParams.get('page'), DEFAULT_AUDIT_PAGE),
    size: parsePositiveInteger(searchParams.get('size'), DEFAULT_AUDIT_PAGE_SIZE),
    sort: sort.length > 0 ? sort : DEFAULT_AUDIT_SORT,
    targetType: normalizeAuditTargetType(searchParams.get('targetType')),
  }
}

function auditQueryToUrlSearchParams(query: AuditQueryState) {
  const searchParams = new URLSearchParams()

  appendStringParam(searchParams, 'targetType', query.targetType)
  appendStringParam(searchParams, 'action', query.action)
  appendStringParam(searchParams, 'actorLogin', query.actorLogin)

  if (query.page > DEFAULT_AUDIT_PAGE) {
    searchParams.set('page', String(query.page))
  }

  if (query.size !== DEFAULT_AUDIT_PAGE_SIZE) {
    searchParams.set('size', String(query.size))
  }

  if (!sameValues(query.sort, DEFAULT_AUDIT_SORT)) {
    appendRepeatedParams(searchParams, 'sort', query.sort, { unique: false })
  }

  return searchParams
}

function auditQueryToSearchParams(query: AuditQueryState) {
  return {
    action: query.action,
    actorLogin: query.actorLogin,
    page: query.page,
    size: query.size,
    sort: query.sort,
    targetType: query.targetType,
  }
}

function createAuditFilterDraft(query: AuditQueryState): AuditFilterDraft {
  return {
    action: query.action,
    actorLogin: query.actorLogin,
    targetType: query.targetType,
  }
}

function normalizeAuditTargetType(value: string | null): AuditTargetType | '' {
  const normalized = value?.trim() ?? ''

  return AUDIT_TARGET_TYPES.includes(normalized as AuditTargetType)
    ? (normalized as AuditTargetType)
    : ''
}

function normalizeAuditAction(value: string | null): AuditAction | '' {
  const normalized = value?.trim() ?? ''

  return AUDIT_ACTIONS.includes(normalized as AuditAction)
    ? (normalized as AuditAction)
    : ''
}

function getAuditFilterSummary(query: AuditQueryState) {
  const filters: string[] = []

  if (query.targetType) {
    filters.push(`Target: ${formatEnumValue(query.targetType)}`)
  }

  if (query.action) {
    filters.push(`Action: ${formatEnumValue(query.action)}`)
  }

  if (query.actorLogin) {
    filters.push(`Actor: ${query.actorLogin}`)
  }

  return filters
}

function isCustomSort(sort: readonly string[]) {
  const value = sort.join('|')

  return !SORT_OPTIONS.some((option) => option.value === value)
}

function getSortOptionValue(sort: readonly string[]) {
  return sort.join('|')
}

function createFilterDraftKey(draft: AuditFilterDraft) {
  return `${draft.targetType}\u0000${draft.action}\u0000${draft.actorLogin}`
}
