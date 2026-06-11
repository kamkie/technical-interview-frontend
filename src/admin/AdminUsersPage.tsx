import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import {
  publishAccountUpdate,
  useCurrentAccount,
} from '../account/useCurrentAccount'
import type { UserAccount } from '../api/account'
import {
  MANAGED_ADMIN_USER_ROLES,
  fetchAdminUsers,
  replaceAdminUserRoles,
  replaceAdminUserStatus,
  type AdminUserAccount,
  type AdminUserAccountStatus,
  type AdminUserRole,
  type AdminUserRoleGrant,
  type AdminUserRoleUpdateRequest,
  type AdminUserStatusUpdateRequest,
} from '../api/adminUsers'
import type { SessionResponse } from '../api/session'
import { hasAdminRole } from '../auth/roles'
import { useI18n, type UiTranslate } from '../i18n/useI18n'
import {
  getDisplayMessage,
  type LoadState,
  type MutationState,
} from '../ui/asyncState'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { formatTimestamp } from '../ui/format'
import { IconChevronDown } from '../ui/icons'
import { MutationFeedback } from '../ui/MutationFeedback'
import { PaginationControls } from '../ui/PaginationControls'
import { SortToggleHeader } from '../ui/SortableColumnHeader'
import { StateBlock } from '../ui/StateBlock'

export const ADMIN_USERS_ROUTE_PATH = '/admin/users' as const
export const ADMIN_USER_DETAIL_ROUTE_PATH = `${ADMIN_USERS_ROUTE_PATH}/:id` as const

const EMPTY_USERS: readonly AdminUserAccount[] = []
const LIVE_FILTER_DEBOUNCE_MS = 300

// The contract returns the full user list without paging parameters, so
// filtering, sorting, and pagination happen client-side over that list. The
// state is URL-backed because list and detail are separate routes and the
// query must survive selecting a user.
const USERS_PAGE_SIZE_OPTIONS = [10, 20, 50] as const

type UsersPageSize = (typeof USERS_PAGE_SIZE_OPTIONS)[number]

type UsersSortField = 'user' | 'provider' | 'email' | 'lastLogin'

type UsersSortDirection = 'ASC' | 'DESC'

type UsersSortValue = `${UsersSortField},${UsersSortDirection}`

type AdminUsersListQuery = {
  page: number
  q: string
  role: '' | AdminUserRole
  size: UsersPageSize
  sort: UsersSortValue
  status: '' | AdminUserAccountStatus
}

const DEFAULT_USERS_QUERY: AdminUsersListQuery = {
  page: 0,
  q: '',
  role: '',
  size: 10,
  sort: 'user,ASC',
  status: '',
}

const ACCOUNT_STATUS_FILTERS = ['ACTIVE', 'BLOCKED'] as const satisfies readonly AdminUserAccountStatus[]

const USERS_SORT_FIELDS: readonly UsersSortField[] = [
  'user',
  'provider',
  'email',
  'lastLogin',
]

type RoleDraft = {
  reason: string
  roles: AdminUserRole[]
}

export function AdminUsersPage({ session }: { session: SessionResponse }) {
  const { t } = useI18n()
  const accountState = useCurrentAccount(
    session.authenticated === true ? session : null,
  )

  if (session.authenticated !== true) {
    return (
      <section className="admin-user-panel" aria-labelledby="admin-users-title">
        <div className="section-heading">
          <p className="eyebrow">{t('ui.admin-users.eyebrow')}</p>
          <h2 id="admin-users-title">{t('ui.admin-users.management-title')}</h2>
          <p className="section-description">
            {t('ui.admin-users.sign-in-required-hint')}
          </p>
        </div>
        <StateBlock
          message={t('ui.admin-users.sign-in-message')}
          title={t('ui.admin-users.sign-in-title')}
          variant="error"
        />
      </section>
    )
  }

  return (
    <section className="admin-user-panel" aria-label={t('ui.route.admin-users.title')}>
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
          <AdminUsersManager
            currentAccount={accountState.value}
            session={session}
          />
        ) : (
          <StateBlock
            message={t('ui.admin-users.access-message')}
            title={t('ui.admin.role-required-title')}
            variant="error"
          />
        ))}
    </section>
  )
}

function AdminUsersManager({
  currentAccount,
  session,
}: {
  currentAccount: UserAccount
  session: SessionResponse
}) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedRouteId = params.id?.trim() ?? ''
  const listQuery = useMemo(
    () => parseAdminUsersSearchParams(searchParams),
    [searchParams],
  )
  const [usersState, setUsersState] = useState<LoadState<AdminUserAccount[]>>({
    status: 'loading',
  })
  const [refreshKey, setRefreshKey] = useState(0)
  const [roleMutationState, setRoleMutationState] = useState<MutationState>({
    status: 'idle',
  })
  const [statusMutationState, setStatusMutationState] = useState<MutationState>({
    status: 'idle',
  })
  const [pendingSelfDemotion, setPendingSelfDemotion] = useState<{
    request: AdminUserRoleUpdateRequest
    user: AdminUserAccount
  } | null>(null)
  const selfDemotionReturnFocusRef = useRef<HTMLElement | null>(null)
  const [filterDraftState, setFilterDraftState] = useState(() => ({
    key: listQuery.q,
    value: listQuery.q,
  }))
  const filterDraft =
    filterDraftState.key === listQuery.q ? filterDraftState.value : listQuery.q

  // The search applies live: a short typing pause pushes the trimmed text
  // into the URL-backed query, mirroring the list-page filter behavior.
  useEffect(() => {
    if (filterDraft.trim() === listQuery.q) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      const nextQuery: AdminUsersListQuery = {
        ...listQuery,
        page: 0,
        q: filterDraft.trim(),
      }

      setFilterDraftState({ key: nextQuery.q, value: filterDraft })
      setSearchParams(adminUsersQueryToSearchParams(nextQuery))
    }, LIVE_FILTER_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [filterDraft, listQuery, setSearchParams])

  useEffect(() => {
    let ignore = false

    fetchAdminUsers()
      .then((users) => {
        if (!ignore) {
          setUsersState({ status: 'ready', value: users })
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setUsersState({
            status: 'error',
            message: getDisplayMessage(error, 'Admin users could not be loaded.'),
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [refreshKey])

  const users =
    usersState.status === 'ready' ? usersState.value : EMPTY_USERS
  const selectedUser = useMemo(
    () => findUserByRouteId(users, selectedRouteId),
    [selectedRouteId, users],
  )
  const filteredUsers = useMemo(
    () => filterAndSortUsers(users, listQuery),
    [listQuery, users],
  )
  const totalPages = Math.ceil(filteredUsers.length / listQuery.size)
  const currentPage = Math.min(listQuery.page, Math.max(totalPages - 1, 0))
  const pageUsers = filteredUsers.slice(
    currentPage * listQuery.size,
    (currentPage + 1) * listQuery.size,
  )
  const firstPage = currentPage <= 0
  const lastPage = totalPages === 0 || currentPage >= totalPages - 1
  // Details expand inline under the selected row; the standalone panel below
  // the list only covers selections whose row is not on the current page,
  // such as deep links into a filtered or paginated-away view.
  const selectedUserVisible =
    selectedUser !== null && pageUsers.includes(selectedUser)

  function updateListQuery(nextQuery: AdminUsersListQuery) {
    const nextSearch = adminUsersQueryToSearchParams(nextQuery)

    if (nextSearch.toString() !== searchParams.toString()) {
      setSearchParams(nextSearch)
    }
  }

  function goToPage(page: number) {
    updateListQuery({ ...listQuery, page: Math.max(0, page) })
  }

  function sortByField(field: UsersSortField) {
    updateListQuery({
      ...listQuery,
      page: 0,
      sort: nextUsersSort(listQuery.sort, field),
    })
  }

  function refreshUsers() {
    setUsersState({ status: 'loading' })
    setRefreshKey((key) => key + 1)
  }

  function selectUser(user: AdminUserAccount) {
    if (user.id === undefined) {
      return
    }

    setRoleMutationState({ status: 'idle' })
    setStatusMutationState({ status: 'idle' })
    // Keep the list query in the URL so the filtered view survives selection.
    // Selecting the already-open user collapses its inline detail row.
    navigate({
      pathname:
        String(user.id) === selectedRouteId
          ? ADMIN_USERS_ROUTE_PATH
          : getAdminUserDetailPath(user.id),
      search: searchParams.toString(),
    })
  }

  function handleReplaceRoles(
    user: AdminUserAccount,
    request: AdminUserRoleUpdateRequest,
  ) {
    if (user.id === undefined) {
      setRoleMutationState({
        status: 'error',
        message: t('ui.admin-users.persisted-id-required'),
      })

      return
    }

    if (!request.reason.trim()) {
      setRoleMutationState({
        status: 'error',
        message: t('ui.admin-users.reason-required'),
      })

      return
    }

    // Dropping ADMIN from the signed-in account closes the admin workflows
    // immediately, so it needs an explicit confirmation first.
    const selfDemotion =
      user.id === currentAccount.id &&
      (user.roles ?? []).includes('ADMIN') &&
      !request.roles.includes('ADMIN')

    if (selfDemotion) {
      selfDemotionReturnFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      setPendingSelfDemotion({ request, user })

      return
    }

    void submitRoleReplacement(user, request)
  }

  function closeSelfDemotionDialog() {
    const opener = selfDemotionReturnFocusRef.current

    selfDemotionReturnFocusRef.current = null
    setPendingSelfDemotion(null)
    window.requestAnimationFrame(() => {
      if (opener?.isConnected) {
        opener.focus()
      }
    })
  }

  function confirmSelfDemotion() {
    const pending = pendingSelfDemotion

    closeSelfDemotionDialog()

    if (pending) {
      void submitRoleReplacement(pending.user, pending.request)
    }
  }

  async function submitRoleReplacement(
    user: AdminUserAccount,
    request: AdminUserRoleUpdateRequest,
  ) {
    if (user.id === undefined) {
      return
    }

    setRoleMutationState({ status: 'submitting' })

    try {
      const updatedUser = await replaceAdminUserRoles(session, user.id, request)

      setUsersState((current) =>
        current.status === 'ready'
          ? {
              status: 'ready',
              value: upsertUser(current.value, updatedUser),
            }
          : current,
      )

      // Replacing the signed-in account's own roles must reach the shared
      // account cache so navigation and admin gates react immediately.
      if (updatedUser.id !== undefined && updatedUser.id === currentAccount.id) {
        publishAccountUpdate(session, {
          ...currentAccount,
          roles: updatedUser.roles,
          updatedAt: updatedUser.updatedAt,
        })
      }

      setRoleMutationState({
        status: 'success',
        message: t('ui.admin-users.roles-updated'),
      })
    } catch (error: unknown) {
      setRoleMutationState({
        status: 'error',
        message: getDisplayMessage(error, t('ui.admin-users.roles-update-failed')),
      })
    }
  }

  function handleReplaceStatus(
    user: AdminUserAccount,
    request: AdminUserStatusUpdateRequest,
  ) {
    if (user.id === undefined) {
      setStatusMutationState({
        status: 'error',
        message: t('ui.admin-users.persisted-id-required'),
      })

      return
    }

    if (!request.reason.trim()) {
      setStatusMutationState({
        status: 'error',
        message: t('ui.admin-users.reason-required'),
      })

      return
    }

    void submitStatusReplacement(user, request)
  }

  async function submitStatusReplacement(
    user: AdminUserAccount,
    request: AdminUserStatusUpdateRequest,
  ) {
    if (user.id === undefined) {
      return
    }

    setStatusMutationState({ status: 'submitting' })

    try {
      const updatedUser = await replaceAdminUserStatus(session, user.id, request)

      setUsersState((current) =>
        current.status === 'ready'
          ? {
              status: 'ready',
              value: upsertUser(current.value, updatedUser),
            }
          : current,
      )

      setStatusMutationState({
        status: 'success',
        message: t('ui.admin-users.status-updated'),
      })
    } catch (error: unknown) {
      setStatusMutationState({
        status: 'error',
        message: getDisplayMessage(error, t('ui.admin-users.status-update-failed')),
      })
    }
  }

  return (
    <div className="admin-users-layout">
      <section className="admin-section" aria-labelledby="admin-users-list-title">
        <div className="admin-section-heading">
          <div>
            <h2 id="admin-users-list-title">{t('ui.admin-users.list-title')}</h2>
            <p className="section-description">
              {t('ui.admin-users.list-description')}
            </p>
          </div>
          <div className="section-actions">
            <button
              type="button"
              aria-label={t('ui.admin-users.refresh-label')}
              className="secondary-button compact-action"
              onClick={refreshUsers}
            >
              {t('ui.common.refresh')}
            </button>
          </div>
        </div>

        <div className="list-card">
          <form
            aria-label={t('ui.admin-users.filters-label')}
            className="admin-list-filters"
            onSubmit={(event) => event.preventDefault()}
          >
            <label>
              <span>{t('ui.admin-users.search')}</span>
              <input
                name="q"
                type="search"
                value={filterDraft}
                onChange={(event) =>
                  setFilterDraftState({
                    key: listQuery.q,
                    value: event.currentTarget.value,
                  })
                }
              />
            </label>
            <label>
              <span>{t('ui.admin-users.role')}</span>
              <select
                name="role"
                value={listQuery.role}
                onChange={(event) =>
                  updateListQuery({
                    ...listQuery,
                    page: 0,
                    role: parseRoleFilter(event.currentTarget.value),
                  })
                }
              >
                <option value="">{t('ui.admin-users.all-roles')}</option>
                {MANAGED_ADMIN_USER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t('ui.admin-users.status')}</span>
              <select
                name="status"
                value={listQuery.status}
                onChange={(event) =>
                  updateListQuery({
                    ...listQuery,
                    page: 0,
                    status: parseStatusFilter(event.currentTarget.value),
                  })
                }
              >
                <option value="">{t('ui.admin-users.all-statuses')}</option>
                {ACCOUNT_STATUS_FILTERS.map((status) => (
                  <option key={status} value={status}>
                    {formatAccountStatus(status, t)}
                  </option>
                ))}
              </select>
            </label>
          </form>

          <div className="catalog-toolbar" aria-label={t('ui.admin-users.toolbar-label')}>
            <div className="catalog-toolbar-status">
              {usersState.status === 'ready' && (
                <span aria-live="polite" className="toolbar-summary">
                  {formatUserWindow(t, filteredUsers.length, currentPage, listQuery.size)}
                </span>
              )}
              {usersState.status === 'ready' && (
                <PaginationControls
                  ariaLabel={t('ui.admin-users.pagination-top-label')}
                  first={firstPage}
                  last={lastPage}
                  pageNumber={currentPage}
                  querySize={listQuery.size}
                  totalPages={totalPages}
                  variant="toolbar"
                  onNextPage={() => goToPage(currentPage + 1)}
                  onPageSizeChange={(size) =>
                    updateListQuery({
                      ...listQuery,
                      page: 0,
                      size: size as UsersPageSize,
                    })
                  }
                  onPreviousPage={() => goToPage(currentPage - 1)}
                  pageSizeOptions={USERS_PAGE_SIZE_OPTIONS}
                />
              )}
            </div>
          </div>

          {usersState.status === 'loading' && (
            <StateBlock
              message={t('ui.admin-users.loading-message')}
              title={t('ui.admin-users.loading-title')}
              variant="loading"
            />
          )}

          {usersState.status === 'error' && (
            <StateBlock
              message={usersState.message}
              title={t('ui.admin-users.error-title')}
              variant="error"
            />
          )}

          {usersState.status === 'ready' && (
            <>
              <AdminUserResults
                hasUsers={usersState.value.length > 0}
                listQuery={listQuery}
                renderUserDetail={(user) => (
                  <section aria-label={t('ui.admin-users.detail-title')}>
                    <AdminUserDetail
                      currentAccountId={currentAccount.id}
                      mutationState={roleMutationState}
                      statusMutationState={statusMutationState}
                      user={user}
                      onReplaceRoles={handleReplaceRoles}
                      onReplaceStatus={handleReplaceStatus}
                    />
                  </section>
                )}
                selectedRouteId={selectedRouteId}
                users={pageUsers}
                onSelectUser={selectUser}
                onSortByField={sortByField}
              />
              <PaginationControls
                ariaLabel={t('ui.admin-users.pagination-label')}
                first={firstPage}
                last={lastPage}
                pageNumber={currentPage}
                querySize={listQuery.size}
                totalPages={totalPages}
                onNextPage={() => goToPage(currentPage + 1)}
                onPageChange={goToPage}
                onPageSizeChange={(size) =>
                  updateListQuery({
                    ...listQuery,
                    page: 0,
                    size: size as UsersPageSize,
                  })
                }
                onPreviousPage={() => goToPage(currentPage - 1)}
                pageSizeOptions={USERS_PAGE_SIZE_OPTIONS}
              />
            </>
          )}
        </div>
      </section>

      {selectedRouteId !== '' && !selectedUserVisible && (
        <AdminUserDetailPanel
          currentAccountId={currentAccount.id}
          mutationState={roleMutationState}
          selectedRouteId={selectedRouteId}
          state={usersState}
          statusMutationState={statusMutationState}
          user={selectedUser}
          onReplaceRoles={handleReplaceRoles}
          onReplaceStatus={handleReplaceStatus}
        />
      )}

      {pendingSelfDemotion !== null && (
        <ConfirmDialog
          confirmLabel={t('ui.admin-users.self-demotion-confirm')}
          message={t('ui.admin-users.self-demotion-message', {
            label: createUserLabel(pendingSelfDemotion.user),
          })}
          title={t('ui.admin-users.self-demotion-title')}
          onCancel={closeSelfDemotionDialog}
          onConfirm={confirmSelfDemotion}
        />
      )}
    </div>
  )
}

function AdminUserResults({
  hasUsers,
  listQuery,
  onSelectUser,
  onSortByField,
  renderUserDetail,
  selectedRouteId,
  users,
}: {
  hasUsers: boolean
  listQuery: AdminUsersListQuery
  onSelectUser: (user: AdminUserAccount) => void
  onSortByField: (field: UsersSortField) => void
  renderUserDetail: (user: AdminUserAccount) => ReactNode
  selectedRouteId: string
  users: readonly AdminUserAccount[]
}) {
  const { t } = useI18n()

  if (users.length === 0) {
    return hasUsers ? (
      <StateBlock
        message={t('ui.admin-users.no-match-message')}
        title={t('ui.admin-users.no-match-title')}
        variant="empty"
      />
    ) : (
      <StateBlock
        message={t('ui.admin-users.empty-message')}
        title={t('ui.admin-users.empty-title')}
        variant="empty"
      />
    )
  }

  const [sortField, sortDirection] = splitUsersSort(listQuery.sort)

  function headerDirection(field: UsersSortField) {
    return sortField === field ? sortDirection : undefined
  }

  return (
    <div
      aria-label={t('ui.admin-users.table-region-label')}
      className="catalog-table-scroll"
      role="region"
      tabIndex={0}
    >
      <table className="catalog-table admin-users-table">
        <caption className="visually-hidden">
          {t('ui.admin-users.table-caption')}
        </caption>
        <thead>
          <tr>
            <SortToggleHeader
              direction={headerDirection('user')}
              label={t('ui.admin-users.user')}
              onSort={() => onSortByField('user')}
            />
            <SortToggleHeader
              direction={headerDirection('provider')}
              label={t('ui.admin-users.provider')}
              onSort={() => onSortByField('provider')}
            />
            <SortToggleHeader
              direction={headerDirection('email')}
              label={t('ui.admin-users.email')}
              onSort={() => onSortByField('email')}
            />
            <th className="plain-column-header" scope="col">
              {t('ui.admin-users.roles')}
            </th>
            <th className="plain-column-header" scope="col">
              {t('ui.admin-users.status')}
            </th>
            <SortToggleHeader
              direction={headerDirection('lastLogin')}
              label={t('ui.admin-users.last-login')}
              onSort={() => onSortByField('lastLogin')}
            />
            <th className="plain-column-header audit-expand-cell" scope="col">
              <span className="visually-hidden">{t('ui.admin-users.details')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => {
            const selected =
              user.id !== undefined && String(user.id) === selectedRouteId

            return (
              <AdminUserRow
                index={index}
                key={createUserKey(user, index)}
                renderUserDetail={renderUserDetail}
                selected={selected}
                user={user}
                onSelectUser={onSelectUser}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function AdminUserRow({
  index,
  onSelectUser,
  renderUserDetail,
  selected,
  user,
}: {
  index: number
  onSelectUser: (user: AdminUserAccount) => void
  renderUserDetail: (user: AdminUserAccount) => ReactNode
  selected: boolean
  user: AdminUserAccount
}) {
  const { t } = useI18n()
  const label = createUserLabel(user, index)
  const detailRowId = `user-detail-row-${user.id ?? index}`

  // The whole row toggles the detail; clicks that finish a text selection
  // are ignored so copying cell content does not collapse the row.
  function handleRowClick() {
    if (window.getSelection()?.toString()) {
      return
    }

    onSelectUser(user)
  }

  return (
    <>
      <tr className="user-row" onClick={handleRowClick}>
        <th scope="row">
          <span>{label}</span>
          <span className="table-subtext">
            {user.login?.trim() ? user.login : t('ui.admin-users.login-unavailable')}
          </span>
        </th>
        <td>{user.provider?.trim() ? user.provider : t('ui.common.unknown')}</td>
        <td>{user.email?.trim() ? user.email : t('ui.common.unavailable')}</td>
        <td>
          <RolePills roles={user.roles} />
        </td>
        <td>
          <AccountStatusPill status={user.accountStatus} />
        </td>
        <td>{formatTimestamp(user.lastLoginAt)}</td>
        <td className="audit-expand-cell">
          <button
            aria-controls={selected ? detailRowId : undefined}
            aria-expanded={selected}
            aria-label={t('ui.admin-users.details-for', { label })}
            className="row-expand-button"
            type="button"
            disabled={user.id === undefined}
            onClick={(event) => {
              event.stopPropagation()
              onSelectUser(user)
            }}
          >
            <IconChevronDown
              className={`row-expand-caret${selected ? ' open' : ''}`}
              height={15}
              width={15}
            />
          </button>
        </td>
      </tr>
      {selected && (
        <tr className="user-detail-row" id={detailRowId}>
          <td colSpan={7}>{renderUserDetail(user)}</td>
        </tr>
      )}
    </>
  )
}

function AdminUserDetailPanel({
  currentAccountId,
  mutationState,
  onReplaceRoles,
  onReplaceStatus,
  selectedRouteId,
  state,
  statusMutationState,
  user,
}: {
  currentAccountId: number | undefined
  mutationState: MutationState
  onReplaceRoles: (
    user: AdminUserAccount,
    request: AdminUserRoleUpdateRequest,
  ) => void
  onReplaceStatus: (
    user: AdminUserAccount,
    request: AdminUserStatusUpdateRequest,
  ) => void
  selectedRouteId: string
  state: LoadState<AdminUserAccount[]>
  statusMutationState: MutationState
  user: AdminUserAccount | null
}) {
  const { t } = useI18n()

  return (
    <section
      className="admin-user-detail-panel"
      aria-labelledby="admin-user-detail-title"
    >
      <div className="admin-section-heading">
        <div>
          <h2 id="admin-user-detail-title">{t('ui.admin-users.detail-title')}</h2>
        </div>
      </div>

      {state.status === 'loading' && (
        <StateBlock
          message={t('ui.admin-users.detail-loading-message')}
          title={t('ui.admin-users.detail-loading-title')}
          variant="loading"
        />
      )}

      {state.status === 'error' && (
        <StateBlock
          message={t('ui.admin-users.detail-unavailable-message')}
          title={t('ui.admin-users.detail-unavailable-title')}
          variant="empty"
        />
      )}

      {state.status === 'ready' && user === null && (
        <StateBlock
          message={t('ui.admin-users.not-found-message', {
            id: selectedRouteId,
          })}
          title={t('ui.admin-users.not-found-title')}
          variant="error"
        />
      )}

      {state.status === 'ready' && user !== null && (
        <AdminUserDetail
          currentAccountId={currentAccountId}
          mutationState={mutationState}
          statusMutationState={statusMutationState}
          user={user}
          onReplaceRoles={onReplaceRoles}
          onReplaceStatus={onReplaceStatus}
        />
      )}
    </section>
  )
}

function AdminUserDetail({
  currentAccountId,
  mutationState,
  onReplaceRoles,
  onReplaceStatus,
  statusMutationState,
  user,
}: {
  currentAccountId: number | undefined
  mutationState: MutationState
  onReplaceRoles: (
    user: AdminUserAccount,
    request: AdminUserRoleUpdateRequest,
  ) => void
  onReplaceStatus: (
    user: AdminUserAccount,
    request: AdminUserStatusUpdateRequest,
  ) => void
  statusMutationState: MutationState
  user: AdminUserAccount
}) {
  const { t } = useI18n()
  const label = createUserLabel(user)
  const blocked = user.accountStatus === 'BLOCKED'

  return (
    <div className="admin-user-detail-content">
      <div className="workflow-group" aria-label={t('ui.admin-users.identity-label')}>
        <div className="account-summary">
          <div>
            <p className="account-name">{label}</p>
            <p className="account-subtitle">
              {user.login?.trim() ? user.login : t('ui.admin-users.login-unavailable')}
            </p>
          </div>
          <RolePills roles={user.roles} />
        </div>

        <dl className="account-metadata">
          <div>
            <dt>{t('ui.admin-users.provider')}</dt>
            <dd>{user.provider?.trim() ? user.provider : t('ui.common.unknown')}</dd>
          </div>
          <div>
            <dt>{t('ui.admin-users.email')}</dt>
            <dd>{user.email?.trim() ? user.email : t('ui.common.unavailable')}</dd>
          </div>
          <div>
            <dt>{t('ui.admin-users.preferred-language')}</dt>
            <dd>
              {user.preferredLanguage?.trim()
                ? user.preferredLanguage
                : t('ui.account.no-preference')}
            </dd>
          </div>
          <div>
            <dt>{t('ui.admin-users.updated')}</dt>
            <dd>{formatTimestamp(user.updatedAt)}</dd>
          </div>
          <div>
            <dt>{t('ui.admin-users.status')}</dt>
            <dd>
              <AccountStatusPill status={user.accountStatus} />
            </dd>
          </div>
          {blocked && (
            <>
              <div>
                <dt>{t('ui.admin-users.blocked-at')}</dt>
                <dd>{formatTimestamp(user.blockedAt)}</dd>
              </div>
              <div>
                <dt>{t('ui.admin-users.blocked-by')}</dt>
                <dd>
                  {user.blockedBy?.trim()
                    ? user.blockedBy
                    : t('ui.admin-users.system')}
                </dd>
              </div>
              <div>
                <dt>{t('ui.admin-users.blocked-reason')}</dt>
                <dd>
                  {user.blockedReason?.trim()
                    ? user.blockedReason
                    : t('ui.admin-users.no-reason')}
                </dd>
              </div>
            </>
          )}
        </dl>
      </div>

      <RoleGrantProvenance grants={user.roleGrants} />

      <RoleReplacementForm
        mutationState={mutationState}
        user={user}
        onReplaceRoles={onReplaceRoles}
      />

      <StatusReplacementForm
        currentAccountId={currentAccountId}
        mutationState={statusMutationState}
        user={user}
        onReplaceStatus={onReplaceStatus}
      />
    </div>
  )
}

function RoleGrantProvenance({
  grants,
}: {
  grants: readonly AdminUserRoleGrant[] | undefined
}) {
  const { t } = useI18n()
  const visibleGrants = grants ?? []

  return (
    <section
      className="role-grant-section workflow-group"
      aria-labelledby="role-grants-title"
    >
      <div className="workflow-group-heading">
        <div>
          <h3 id="role-grants-title">{t('ui.admin-users.grants-title')}</h3>
        </div>
      </div>

      {visibleGrants.length === 0 ? (
        <p className="session-message muted">
          {t('ui.admin-users.grants-empty')}
        </p>
      ) : (
        <div
          aria-label={t('ui.admin-users.grants-region-label')}
          className="catalog-table-scroll"
          role="region"
          tabIndex={0}
        >
          <table className="catalog-table role-grants-table">
            <caption className="visually-hidden">
              {t('ui.admin-users.grants-caption')}
            </caption>
            <thead>
              <tr>
                <th className="plain-column-header" scope="col">
                  {t('ui.admin-users.role')}
                </th>
                <th className="plain-column-header" scope="col">
                  {t('ui.admin-users.source')}
                </th>
                <th className="plain-column-header" scope="col">
                  {t('ui.admin-users.granted')}
                </th>
                <th className="plain-column-header" scope="col">
                  {t('ui.admin-users.granted-by')}
                </th>
                <th className="plain-column-header" scope="col">
                  {t('ui.admin-users.reason')}
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleGrants.map((grant, index) => (
                <tr key={createGrantKey(grant, index)}>
                  <th scope="row">
                    {grant.role ?? t('ui.admin-users.unknown-role')}
                  </th>
                  <td>{grant.source ?? t('ui.admin-users.unknown-source')}</td>
                  <td>{formatTimestamp(grant.grantedAt)}</td>
                  <td>{formatGrantingOperator(grant, t)}</td>
                  <td>
                    {grant.reason?.trim()
                      ? grant.reason
                      : t('ui.admin-users.no-reason')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function RoleReplacementForm({
  mutationState,
  onReplaceRoles,
  user,
}: {
  mutationState: MutationState
  onReplaceRoles: (
    user: AdminUserAccount,
    request: AdminUserRoleUpdateRequest,
  ) => void
  user: AdminUserAccount
}) {
  const { t } = useI18n()
  const userKey = createRoleDraftKey(user)
  const [draftState, setDraftState] = useState(() => ({
    key: userKey,
    value: createRoleDraft(user),
  }))
  const draft =
    draftState.key === userKey ? draftState.value : createRoleDraft(user)
  const submitting = mutationState.status === 'submitting'
  const reason = draft.reason.trim()
  const canSubmit = user.id !== undefined && reason.length > 0 && !submitting

  function updateDraft(update: Partial<RoleDraft>) {
    setDraftState({
      key: userKey,
      value: {
        ...draft,
        ...update,
      },
    })
  }

  function setAdminRole(enabled: boolean) {
    const roles = enabled
      ? uniqueManagedRoles([...draft.roles, 'ADMIN'])
      : uniqueManagedRoles(draft.roles.filter((role) => role !== 'ADMIN'))

    updateDraft({ roles })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onReplaceRoles(user, {
      roles: uniqueManagedRoles(draft.roles),
      reason,
    })
  }

  return (
    <form
      className="role-replacement-form workflow-group"
      aria-label={t('ui.admin-users.replace-roles-label', {
        label: createUserLabel(user),
      })}
      onSubmit={handleSubmit}
    >
      <div className="workflow-group-heading">
        <div>
          <h3>{t('ui.admin-users.replace-roles-title')}</h3>
          <p className="section-description">
            {t('ui.admin-users.replace-roles-hint')}
          </p>
        </div>
      </div>

      <fieldset className="admin-checkbox-group">
        <legend>{t('ui.admin-users.managed-roles')}</legend>
        {MANAGED_ADMIN_USER_ROLES.map((role) => {
          const isUserRole = role === 'USER'

          return (
            <label key={role}>
              <input
                type="checkbox"
                checked={isUserRole || draft.roles.includes(role)}
                disabled={isUserRole || submitting}
                onChange={(event) => setAdminRole(event.currentTarget.checked)}
              />
              <span>{role}</span>
            </label>
          )
        })}
      </fieldset>

      <label className="admin-user-reason-field">
        <span>{t('ui.admin-users.operator-reason')}</span>
        <textarea
          required
          rows={4}
          value={draft.reason}
          onChange={(event) => updateDraft({ reason: event.currentTarget.value })}
        />
      </label>

      <div className="admin-action-row">
        <button type="submit" disabled={!canSubmit}>
          {submitting
            ? t('ui.admin-users.saving-roles')
            : t('ui.admin-users.save-roles')}
        </button>
      </div>

      {user.id === undefined && (
        <p className="session-message error" role="alert">
          {t('ui.admin-users.persisted-id-required')}
        </p>
      )}

      <MutationFeedback state={mutationState} />
    </form>
  )
}

function StatusReplacementForm({
  currentAccountId,
  mutationState,
  onReplaceStatus,
  user,
}: {
  currentAccountId: number | undefined
  mutationState: MutationState
  onReplaceStatus: (
    user: AdminUserAccount,
    request: AdminUserStatusUpdateRequest,
  ) => void
  user: AdminUserAccount
}) {
  const { t } = useI18n()
  const draftKey = createStatusDraftKey(user)
  const [draftState, setDraftState] = useState(() => ({
    key: draftKey,
    value: '',
  }))
  const reasonDraft = draftState.key === draftKey ? draftState.value : ''
  const submitting = mutationState.status === 'submitting'
  const reason = reasonDraft.trim()
  const selfTarget =
    user.id !== undefined &&
    currentAccountId !== undefined &&
    user.id === currentAccountId
  const statusKnown =
    user.accountStatus === 'ACTIVE' || user.accountStatus === 'BLOCKED'
  const nextStatus: AdminUserAccountStatus =
    user.accountStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED'
  const canSubmit =
    user.id !== undefined &&
    statusKnown &&
    !selfTarget &&
    reason.length > 0 &&
    !submitting

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onReplaceStatus(user, { status: nextStatus, reason })
  }

  return (
    <form
      className="status-replacement-form workflow-group"
      aria-label={t('ui.admin-users.replace-status-label', {
        label: createUserLabel(user),
      })}
      onSubmit={handleSubmit}
    >
      <div className="workflow-group-heading">
        <div>
          <h3>{t('ui.admin-users.replace-status-title')}</h3>
          <p className="section-description">
            {t('ui.admin-users.replace-status-hint')}
          </p>
        </div>
      </div>

      <label className="admin-user-reason-field">
        <span>{t('ui.admin-users.operator-reason')}</span>
        <textarea
          required
          disabled={selfTarget || !statusKnown}
          rows={4}
          value={reasonDraft}
          onChange={(event) =>
            setDraftState({ key: draftKey, value: event.currentTarget.value })
          }
        />
      </label>

      <div className="admin-action-row">
        <button type="submit" disabled={!canSubmit}>
          {submitting
            ? t('ui.admin-users.saving-status')
            : nextStatus === 'BLOCKED'
              ? t('ui.admin-users.block-user')
              : t('ui.admin-users.unblock-user')}
        </button>
      </div>

      {selfTarget && (
        <p className="session-message muted">
          {t('ui.admin-users.self-status-hint')}
        </p>
      )}

      {!statusKnown && (
        <p className="session-message muted">
          {t('ui.admin-users.status-unknown-hint')}
        </p>
      )}

      {user.id === undefined && (
        <p className="session-message error" role="alert">
          {t('ui.admin-users.persisted-id-required')}
        </p>
      )}

      <MutationFeedback state={mutationState} />
    </form>
  )
}

function AccountStatusPill({
  status,
}: {
  status: AdminUserAccount['accountStatus']
}) {
  const { t } = useI18n()

  if (status !== 'ACTIVE' && status !== 'BLOCKED') {
    return (
      <span className="session-message muted">{t('ui.common.unknown')}</span>
    )
  }

  return (
    <span
      className={`status-pill ${status === 'BLOCKED' ? 'status-pill-blocked' : 'status-pill-active'}`}
    >
      {formatAccountStatus(status, t)}
    </span>
  )
}

function RolePills({ roles }: { roles: readonly string[] | undefined }) {
  const { t } = useI18n()
  const visibleRoles = roles ?? []

  if (visibleRoles.length === 0) {
    return <span className="session-message muted">{t('ui.admin-users.no-roles')}</span>
  }

  return (
    <div className="account-roles" aria-label={t('ui.admin-users.current-roles-label')}>
      {visibleRoles.map((role) => (
        <span className="role-pill" key={role}>
          {role}
        </span>
      ))}
    </div>
  )
}

function getAdminUserDetailPath(id: number) {
  return `${ADMIN_USERS_ROUTE_PATH}/${encodeURIComponent(String(id))}`
}

function parseAdminUsersSearchParams(
  searchParams: URLSearchParams,
): AdminUsersListQuery {
  const page = Number.parseInt(searchParams.get('page') ?? '', 10)
  const size = Number.parseInt(searchParams.get('size') ?? '', 10)

  return {
    page: Number.isInteger(page) && page > 0 ? page : DEFAULT_USERS_QUERY.page,
    q: searchParams.get('q')?.trim() ?? '',
    role: parseRoleFilter(searchParams.get('role') ?? ''),
    size: USERS_PAGE_SIZE_OPTIONS.find((option) => option === size) ??
      DEFAULT_USERS_QUERY.size,
    sort: parseUsersSort(searchParams.get('sort')),
    status: parseStatusFilter(searchParams.get('status') ?? ''),
  }
}

function adminUsersQueryToSearchParams(query: AdminUsersListQuery) {
  const params = new URLSearchParams()

  if (query.q) {
    params.set('q', query.q)
  }

  if (query.role) {
    params.set('role', query.role)
  }

  if (query.status) {
    params.set('status', query.status)
  }

  if (query.sort !== DEFAULT_USERS_QUERY.sort) {
    params.set('sort', query.sort)
  }

  if (query.page > 0) {
    params.set('page', String(query.page))
  }

  if (query.size !== DEFAULT_USERS_QUERY.size) {
    params.set('size', String(query.size))
  }

  return params
}

function parseRoleFilter(value: string): '' | AdminUserRole {
  return (
    MANAGED_ADMIN_USER_ROLES.find((role) => role === value.toUpperCase()) ?? ''
  )
}

function parseStatusFilter(value: string): '' | AdminUserAccountStatus {
  return (
    ACCOUNT_STATUS_FILTERS.find((status) => status === value.toUpperCase()) ??
    ''
  )
}

function formatAccountStatus(status: AdminUserAccountStatus, t: UiTranslate) {
  return status === 'BLOCKED'
    ? t('ui.admin-users.status-blocked')
    : t('ui.admin-users.status-active')
}

function parseUsersSort(value: string | null): UsersSortValue {
  const [field, direction] = (value ?? '').split(',')

  if (
    USERS_SORT_FIELDS.some((sortField) => sortField === field) &&
    (direction === 'ASC' || direction === 'DESC')
  ) {
    return `${field as UsersSortField},${direction}`
  }

  return DEFAULT_USERS_QUERY.sort
}

function splitUsersSort(
  sort: UsersSortValue,
): [UsersSortField, UsersSortDirection] {
  const [field, direction] = sort.split(',')

  return [field as UsersSortField, direction as UsersSortDirection]
}

function nextUsersSort(
  sort: UsersSortValue,
  field: UsersSortField,
): UsersSortValue {
  const [currentField, currentDirection] = splitUsersSort(sort)
  const nextDirection: UsersSortDirection =
    currentField === field && currentDirection === 'ASC' ? 'DESC' : 'ASC'

  return `${field},${nextDirection}`
}

function filterAndSortUsers(
  users: readonly AdminUserAccount[],
  query: AdminUsersListQuery,
) {
  const text = query.q.toLocaleLowerCase()
  const filtered = users.filter((user) => {
    if (query.role && !(user.roles ?? []).includes(query.role)) {
      return false
    }

    if (query.status && user.accountStatus !== query.status) {
      return false
    }

    if (!text) {
      return true
    }

    return [user.displayName, user.login, user.email, user.provider].some(
      (value) => value?.toLocaleLowerCase().includes(text),
    )
  })
  const [field, direction] = splitUsersSort(query.sort)
  const factor = direction === 'DESC' ? -1 : 1

  return [...filtered].sort(
    (left, right) => factor * compareUsers(left, right, field),
  )
}

function compareUsers(
  left: AdminUserAccount,
  right: AdminUserAccount,
  field: UsersSortField,
) {
  if (field === 'lastLogin') {
    return (
      (Date.parse(left.lastLoginAt ?? '') || 0) -
      (Date.parse(right.lastLoginAt ?? '') || 0)
    )
  }

  return userSortText(left, field).localeCompare(userSortText(right, field), undefined, {
    sensitivity: 'base',
  })
}

function userSortText(user: AdminUserAccount, field: UsersSortField) {
  if (field === 'provider') {
    return user.provider ?? ''
  }

  if (field === 'email') {
    return user.email ?? ''
  }

  return createUserLabel(user)
}

function formatUserWindow(
  t: UiTranslate,
  total: number,
  page: number,
  size: number,
) {
  const label = t(
    total === 1 ? 'ui.admin-users.user-count-one' : 'ui.admin-users.user-count-many',
    { count: total },
  )

  if (total <= 0) {
    return label
  }

  const start = page * size + 1
  const end = Math.min((page + 1) * size, total)

  return t('ui.common.window-summary', { start, end, total: label })
}

function findUserByRouteId(
  users: readonly AdminUserAccount[],
  selectedRouteId: string,
) {
  if (!selectedRouteId) {
    return null
  }

  return (
    users.find(
      (user) => user.id !== undefined && String(user.id) === selectedRouteId,
    ) ?? null
  )
}

function upsertUser(
  users: readonly AdminUserAccount[],
  updatedUser: AdminUserAccount,
) {
  if (updatedUser.id === undefined) {
    return [...users]
  }

  const existing = users.some((user) => user.id === updatedUser.id)

  return existing
    ? users.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    : [...users, updatedUser]
}

function createRoleDraft(user: AdminUserAccount): RoleDraft {
  return {
    roles: uniqueManagedRoles(user.roles ?? []),
    reason: '',
  }
}

function uniqueManagedRoles(roles: readonly string[]) {
  const nextRoles: AdminUserRole[] = ['USER']

  if (roles.includes('ADMIN')) {
    nextRoles.push('ADMIN')
  }

  return nextRoles
}

function createRoleDraftKey(user: AdminUserAccount) {
  return `${user.id ?? 'unknown'}\u0000${(user.roles ?? []).join('|')}\u0000${
    user.updatedAt ?? ''
  }`
}

function createStatusDraftKey(user: AdminUserAccount) {
  return [user.id ?? 'unknown', user.accountStatus ?? '', user.updatedAt ?? ''].join(
    ' ',
  )
}

function createUserKey(user: AdminUserAccount, index: number) {
  return user.id ?? `${user.provider ?? 'unknown'}-${user.login ?? index}`
}

function createUserLabel(user: AdminUserAccount, index = 0) {
  return (
    user.displayName?.trim() ||
    user.login?.trim() ||
    user.email?.trim() ||
    (user.id !== undefined ? `User ${user.id}` : `User ${index + 1}`)
  )
}

function createGrantKey(grant: AdminUserRoleGrant, index: number) {
  return `${grant.role ?? 'unknown'}-${grant.source ?? 'unknown'}-${
    grant.grantedAt ?? index
  }`
}

function formatGrantingOperator(grant: AdminUserRoleGrant, t: UiTranslate) {
  const login = grant.grantedByLogin?.trim()
  const userId = grant.grantedByUserId

  if (login && userId !== undefined) {
    return t('ui.admin-users.granted-by-operator', { login, id: userId })
  }

  if (login) {
    return login
  }

  if (userId !== undefined) {
    return t('ui.admin-users.user-number', { id: userId })
  }

  return t('ui.admin-users.system')
}
