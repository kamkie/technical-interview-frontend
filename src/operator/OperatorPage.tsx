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
import { useI18n } from '../i18n/useI18n'
import {
  createLoadError,
  getLoadErrorMessage,
  type LoadState,
} from '../ui/asyncState'
import { formatTimestamp } from '../ui/format'
import { IconChevronDown } from '../ui/icons'
import { PaginationControls } from '../ui/PaginationControls'
import { SortToggleHeader } from '../ui/SortableColumnHeader'
import { StateBlock } from '../ui/StateBlock'
import { AuditEntryDetails } from './AuditEntryDetails'
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

type AuditSortField = 'createdAt' | 'targetType' | 'action' | 'actorLogin'

type AuditSortDirection = 'ASC' | 'DESC'

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
  const { t } = useI18n()
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
  // The expansion is positional, so it is stored under the search string it
  // was made for; a query change (page, filter, or sort) would otherwise
  // leave an arbitrary row on the new result expanded.
  const currentSearch = searchParams.toString()
  const [selectionState, setSelectionState] = useState<{
    index: number
    key: string
  } | null>(null)
  const selectedAuditIndex =
    selectionState !== null && selectionState.key === currentSearch
      ? selectionState.index
      : null

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
          setAuditPageState(
            createLoadError(error, 'Audit logs could not be loaded.'),
          )
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


  function changePageSize(size: number) {
    updateAuditQuery({
      ...query,
      page: 0,
      size,
    })
  }

  function sortByField(field: AuditSortField) {
    updateAuditQuery({
      ...query,
      page: 0,
      sort: nextAuditSort(query.sort, field),
    })
  }

  function goToPage(page: number) {
    updateAuditQuery({
      ...query,
      page: Math.max(0, page),
    })
  }

  function toggleDetails(index: number) {
    setSelectionState((current) =>
      current?.key === currentSearch && current.index === index
        ? null
        : { index, key: currentSearch },
    )
  }

  if (session.authenticated !== true) {
    return (
      <section className="operator-panel" aria-labelledby="operator-title">
        <div className="section-heading">
          <p className="eyebrow">{t('ui.operator.eyebrow')}</p>
          <h2 id="operator-title">{t('ui.operator.title')}</h2>
          <p className="section-description">{t('ui.operator.description')}</p>
        </div>
        <StateBlock
          message={t('ui.operator.sign-in-message')}
          title={t('ui.operator.sign-in-title')}
          variant="error"
        />
      </section>
    )
  }

  // A permission-denied audit response means no filter combination can
  // produce results, so the filter controls present disabled with the
  // denied state instead of inviting dead-end input.
  const accessDenied =
    auditPageState.status === 'error' &&
    (auditPageState.httpStatus === 401 || auditPageState.httpStatus === 403)

  return (
    <section className="operator-panel" aria-label="Operator audit">
      <section className="operator-section" aria-labelledby="audit-log-title">
        <div className="admin-section-heading">
          <div>
            <h2 id="audit-log-title">Audit rows</h2>
          </div>
        </div>

        <div className="list-card" aria-label="Audit query controls">
          <form
            aria-label="Audit filters"
            className="operator-filters"
            onSubmit={handleFilterSubmit}
          >
            <label>
              <span>Target type</span>
              <select
                disabled={accessDenied}
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
                disabled={accessDenied}
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
                disabled={accessDenied}
                name="actorLogin"
                type="search"
                value={filterDraft.actorLogin}
                onChange={(event) =>
                  updateFilterDraft({ actorLogin: event.currentTarget.value })
                }
              />
            </label>
          </form>

          <div className="catalog-toolbar" aria-label="Audit table controls">
            <div className="catalog-toolbar-status">
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
            onSortByField={sortByField}
            selectedIndex={selectedAuditIndex}
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
  onSortByField,
  query,
  selectedIndex,
  state,
}: {
  onNextPage: () => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onPreviousPage: () => void
  onSelectEntry: (index: number) => void
  onSortByField: (field: AuditSortField) => void
  query: AuditQueryState
  selectedIndex: number | null
  state: LoadState<AuditLogPage>
}) {
  const { t } = useI18n()

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
        message={getLoadErrorMessage(t, state)}
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
                <SortToggleHeader
                  direction={getAuditSortDirection(query.sort, 'createdAt')}
                  label="Created"
                  onSort={() => onSortByField('createdAt')}
                />
                <SortToggleHeader
                  direction={getAuditSortDirection(query.sort, 'targetType')}
                  label="Target"
                  onSort={() => onSortByField('targetType')}
                />
                <SortToggleHeader
                  direction={getAuditSortDirection(query.sort, 'action')}
                  label="Action"
                  onSort={() => onSortByField('action')}
                />
                <SortToggleHeader
                  direction={getAuditSortDirection(query.sort, 'actorLogin')}
                  label="Actor"
                  onSort={() => onSortByField('actorLogin')}
                />
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
  if (state.status === 'error') {
    return 'Audit rows need attention.'
  }

  if (state.status === 'loading') {
    return 'Audit rows are loading.'
  }

  const rowCount = state.value.numberOfElements ?? state.value.content?.length ?? 0
  const total = state.value.totalElements ?? rowCount
  const label = `${total} ${total === 1 ? 'audit entry' : 'audit entries'}`

  if (total <= 0 || rowCount <= 0) {
    return label
  }

  const page = state.value.number ?? 0
  const size = state.value.size ?? rowCount
  const start = page * size + 1
  const end = Math.min(start + rowCount - 1, total)

  return `Showing ${start}-${end} of ${label}`
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
  onSelectEntry: (index: number) => void
}) {
  const { t } = useI18n()
  const entryLabel = createAuditEntryLabel(entry, index)
  const detailRowId = `audit-entry-details-${index}`

  // The whole row toggles details; clicks that finish a text selection are
  // ignored so copying cell content does not collapse the row.
  function handleRowClick() {
    if (window.getSelection()?.toString()) {
      return
    }

    onSelectEntry(index)
  }

  return (
    <>
      <tr className="audit-row" onClick={handleRowClick}>
        <td>{formatTimestamp(entry.createdAt, t('ui.common.unknown'))}</td>
        <td>
          {formatEnumValue(entry.targetType, t('ui.common.unknown'))}
          <span className="table-subtext">
            ID {formatOptionalNumber(entry.targetId, t('ui.common.unavailable'))}
          </span>
        </td>
        <td>{formatEnumValue(entry.action, t('ui.common.unknown'))}</td>
        <td>{formatActor(entry.actorLogin, t('ui.operator.unknown-actor'))}</td>
        <td>{formatSummary(entry.summary, t('ui.operator.no-summary'))}</td>
        <td className="audit-expand-cell">
          <button
            aria-controls={detailRowId}
            aria-expanded={expanded}
            className="row-expand-button"
            type="button"
            aria-label={`Details for ${entryLabel}`}
            onClick={(event) => {
              event.stopPropagation()
              onSelectEntry(index)
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

// Header sorts keep composite criteria so equal values stay deterministic:
// timestamp sorts carry an id tiebreaker in the same direction, and the
// other fields fall back to newest first within equal values.
function buildAuditSort(
  field: AuditSortField,
  direction: AuditSortDirection,
): readonly string[] {
  return field === 'createdAt'
    ? [`createdAt,${direction}`, `id,${direction}`]
    : [`${field},${direction}`, 'createdAt,DESC']
}

function getAuditSortDirection(
  sort: readonly string[],
  field: AuditSortField,
): AuditSortDirection | undefined {
  const [property, direction] = (sort[0] ?? '').split(',')

  return property === field && (direction === 'ASC' || direction === 'DESC')
    ? direction
    : undefined
}

function nextAuditSort(
  sort: readonly string[],
  field: AuditSortField,
): readonly string[] {
  const nextDirection: AuditSortDirection =
    getAuditSortDirection(sort, field) === 'ASC' ? 'DESC' : 'ASC'

  return buildAuditSort(field, nextDirection)
}

function createFilterDraftKey(draft: AuditFilterDraft) {
  return `${draft.targetType}\u0000${draft.action}\u0000${draft.actorLogin}`
}
