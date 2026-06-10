import { FormEvent, useEffect, useMemo, useState } from 'react'
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
import { IconChevronDown } from '../ui/icons'
import { PaginationControls } from '../ui/PaginationControls'
import { StateBlock } from '../ui/StateBlock'
import {
  AuditEntryDetails,
  type SelectedAuditEntry,
} from './AuditEntryDetails'
import {
  createAuditEntryKey,
  createAuditEntryLabel,
  formatActor,
  formatEnumValue,
  formatOptionalNumber,
  formatSummary,
} from './auditFormat'

export const OPERATOR_ROUTE_PATH = '/operator' as const

const LIVE_FILTER_DEBOUNCE_MS = 300
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
  const [selectedAuditEntry, setSelectedAuditEntry] =
    useState<SelectedAuditEntry | null>(null)

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

  // Filters apply live: a short typing pause pushes the trimmed draft into
  // the URL-backed query. The draft is re-stored under the next route key so
  // in-progress text (including trailing spaces) survives the URL change.
  useEffect(() => {
    if (
      filterDraft.actorLogin.trim() === query.actorLogin &&
      filterDraft.action === query.action &&
      filterDraft.targetType === query.targetType
    ) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      const nextQuery: AuditQueryState = {
        ...query,
        action: filterDraft.action,
        actorLogin: filterDraft.actorLogin.trim(),
        page: 0,
        targetType: filterDraft.targetType,
      }

      setFilterDraftState({
        key: createFilterDraftKey(createAuditFilterDraft(nextQuery)),
        value: filterDraft,
      })
      setSearchParams(auditQueryToUrlSearchParams(nextQuery))
    }, LIVE_FILTER_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [filterDraft, query, setSearchParams])

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

  function toggleDetails(entry: AuditLog, index: number) {
    setSelectedAuditEntry((current) =>
      current?.index === index ? null : { entry, index },
    )
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
      <section className="operator-section" aria-labelledby="audit-log-title">
        <div className="admin-section-heading">
          <div>
            <h2 id="audit-log-title">Audit rows</h2>
          </div>
        </div>

        <div className="workflow-group" aria-label="Audit query controls">
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
              <button type="button" className="secondary-button" onClick={clearFilters}>
                Clear
              </button>
            </div>
          </form>

          <div className="catalog-toolbar" aria-label="Audit table controls">
            <div className="catalog-toolbar-status">
              <label className="inline-sort">
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
              <span aria-live="polite" className="toolbar-summary">
                {formatAuditSummary(auditPageState)}
              </span>
              {auditPageState.status === 'ready' && (
                <AuditPaginationControls
                  ariaLabel="Audit pagination top"
                  page={auditPageState.value}
                  query={query}
                  variant="toolbar"
                  onNextPage={() =>
                    goToPage((auditPageState.value.number ?? query.page) + 1)
                  }
                  onPageSizeChange={changePageSize}
                  onPreviousPage={() =>
                    goToPage((auditPageState.value.number ?? query.page) - 1)
                  }
                />
              )}
            </div>
          </div>
        </div>

        <div className="workflow-group" aria-label="Audit results">
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
            onPageChange={goToPage}
            onPageSizeChange={changePageSize}
            onPreviousPage={() =>
              goToPage(
                auditPageState.status === 'ready'
                  ? (auditPageState.value.number ?? query.page) - 1
                  : query.page - 1,
              )
            }
            onSelectEntry={toggleDetails}
            selectedIndex={selectedAuditEntry?.index ?? null}
          />
        </div>
      </section>
    </section>
  )
}

function AuditLogResults({
  onNextPage,
  onPageChange,
  onPageSizeChange,
  onPreviousPage,
  onSelectEntry,
  query,
  selectedIndex,
  state,
}: {
  onNextPage: () => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onPreviousPage: () => void
  onSelectEntry: (entry: AuditLog, index: number) => void
  query: AuditQueryState
  selectedIndex: number | null
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
                <th className="plain-column-header audit-expand-cell" scope="col">
                  <span className="visually-hidden">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry, index) => (
                <AuditLogRow
                  entry={entry}
                  expanded={selectedIndex === index}
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
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onPreviousPage={onPreviousPage}
      />
    </div>
  )
}

function formatAuditSummary(state: LoadState<AuditLogPage>) {
  if (state.status !== 'ready') {
    return `Audit rows are ${formatLoadStatus(state.status).toLowerCase()}.`
  }

  const rowCount = state.value.numberOfElements ?? state.value.content?.length
  const totalElements = state.value.totalElements

  return `Showing ${rowCount ?? 0}${
    totalElements !== undefined ? ` of ${totalElements}` : ''
  } audit entries.`
}

function AuditLogRow({
  entry,
  expanded,
  index,
  onSelectEntry,
}: {
  entry: AuditLog
  expanded: boolean
  index: number
  onSelectEntry: (entry: AuditLog, index: number) => void
}) {
  const entryLabel = createAuditEntryLabel(entry, index)
  const detailRowId = `audit-entry-details-${index}`

  // The whole row toggles details; clicks that finish a text selection are
  // ignored so copying cell content does not collapse the row.
  function handleRowClick() {
    if (window.getSelection()?.toString()) {
      return
    }

    onSelectEntry(entry, index)
  }

  return (
    <>
      <tr className="audit-row" onClick={handleRowClick}>
        <td>{formatTimestamp(entry.createdAt)}</td>
        <td>
          {formatEnumValue(entry.targetType)}
          <span className="table-subtext">ID {formatOptionalNumber(entry.targetId)}</span>
        </td>
        <td>{formatEnumValue(entry.action)}</td>
        <td>{formatActor(entry.actorLogin)}</td>
        <td>{formatSummary(entry.summary)}</td>
        <td className="audit-expand-cell">
          <button
            aria-controls={detailRowId}
            aria-expanded={expanded}
            className="row-expand-button"
            type="button"
            aria-label={`Details for ${entryLabel}`}
            onClick={(event) => {
              event.stopPropagation()
              onSelectEntry(entry, index)
            }}
          >
            <IconChevronDown
              className={`row-expand-caret${expanded ? ' open' : ''}`}
              height={15}
              width={15}
            />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="audit-detail-row" id={detailRowId}>
          <td colSpan={6}>
            <AuditEntryDetails entry={entry} index={index} />
          </td>
        </tr>
      )}
    </>
  )
}

function AuditPaginationControls({
  ariaLabel = 'Audit pagination',
  onNextPage,
  onPageChange,
  onPageSizeChange,
  onPreviousPage,
  page,
  query,
  variant,
}: {
  ariaLabel?: string
  onNextPage: () => void
  onPageChange?: (page: number) => void
  onPageSizeChange: (size: number) => void
  onPreviousPage: () => void
  page: AuditLogPage
  query: AuditQueryState
  variant?: 'pager' | 'toolbar'
}) {
  const pageNumber = page.number ?? query.page
  const totalPages = page.totalPages ?? 0
  const first = page.first === true || pageNumber <= 0
  const last =
    page.last === true || (totalPages > 0 && pageNumber >= totalPages - 1)

  return (
    <PaginationControls
      ariaLabel={ariaLabel}
      first={first}
      last={last}
      onNextPage={onNextPage}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onPreviousPage={onPreviousPage}
      pageNumber={pageNumber}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      querySize={query.size}
      totalPages={totalPages}
      variant={variant}
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
