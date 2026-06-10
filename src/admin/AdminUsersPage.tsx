import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { useCurrentAccount } from '../account/useCurrentAccount'
import {
  MANAGED_ADMIN_USER_ROLES,
  fetchAdminUsers,
  replaceAdminUserRoles,
  type AdminUserAccount,
  type AdminUserRole,
  type AdminUserRoleGrant,
  type AdminUserRoleUpdateRequest,
} from '../api/adminUsers'
import type { SessionResponse } from '../api/session'
import { hasAdminRole } from '../auth/roles'
import {
  getDisplayMessage,
  type LoadState,
  type MutationState,
} from '../ui/asyncState'
import { formatTimestamp } from '../ui/format'
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
}

const DEFAULT_USERS_QUERY: AdminUsersListQuery = {
  page: 0,
  q: '',
  role: '',
  size: 10,
  sort: 'user,ASC',
}

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
  const accountState = useCurrentAccount(
    session.authenticated === true ? session : null,
  )

  if (session.authenticated !== true) {
    return (
      <section className="admin-user-panel" aria-labelledby="admin-users-title">
        <div className="section-heading">
          <p className="eyebrow">Admin users</p>
          <h2 id="admin-users-title">User management</h2>
          <p className="section-description">
            Review application users and role-grant provenance after
            authenticated admin access is confirmed.
          </p>
        </div>
        <StateBlock
          message="Sign in is required for user management."
          title="Sign in required"
          variant="error"
        />
      </section>
    )
  }

  return (
    <section className="admin-user-panel" aria-label="User administration">
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
          <AdminUsersManager session={session} />
        ) : (
          <StateBlock
            message="Admin access is required for user management."
            title="Admin role required"
            variant="error"
          />
        ))}
    </section>
  )
}

function AdminUsersManager({ session }: { session: SessionResponse }) {
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
    // Keep the list query in the URL so the filtered view survives selection.
    navigate({
      pathname: getAdminUserDetailPath(user.id),
      search: searchParams.toString(),
    })
  }

  async function handleReplaceRoles(
    user: AdminUserAccount,
    request: AdminUserRoleUpdateRequest,
  ) {
    if (user.id === undefined) {
      setRoleMutationState({
        status: 'error',
        message: 'Role replacement requires a persisted user id.',
      })

      return
    }

    if (!request.reason.trim()) {
      setRoleMutationState({
        status: 'error',
        message: 'Operator reason is required.',
      })

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
      setRoleMutationState({
        status: 'success',
        message: 'User roles updated.',
      })
    } catch (error: unknown) {
      setRoleMutationState({
        status: 'error',
        message: getDisplayMessage(error, 'User roles could not be updated.'),
      })
    }
  }

  return (
    <div className="admin-users-layout">
      <section className="admin-section" aria-labelledby="admin-users-list-title">
        <div className="admin-section-heading">
          <div>
            <h2 id="admin-users-list-title">Application users</h2>
            <p className="section-description">
              Select a user to review profile details, roles, and grant
              history.
            </p>
          </div>
          <div className="section-actions">
            <button
              type="button"
              aria-label="Refresh users"
              className="secondary-button compact-action"
              onClick={refreshUsers}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="list-card">
          <form
            aria-label="Admin user filters"
            className="admin-list-filters"
            onSubmit={(event) => event.preventDefault()}
          >
            <label>
              <span>Search</span>
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
              <span>Role</span>
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
                <option value="">All roles</option>
                {MANAGED_ADMIN_USER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
          </form>

          <div className="catalog-toolbar" aria-label="Admin user table controls">
            <div className="catalog-toolbar-status">
              {usersState.status === 'ready' && (
                <span aria-live="polite" className="toolbar-summary">
                  {formatUserWindow(filteredUsers.length, currentPage, listQuery.size)}
                </span>
              )}
              {usersState.status === 'ready' && (
                <PaginationControls
                  ariaLabel="Admin user pagination top"
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
              message="Loading users..."
              title="Loading users"
              variant="loading"
            />
          )}

          {usersState.status === 'error' && (
            <StateBlock
              message={usersState.message}
              title="Users could not be loaded"
              variant="error"
            />
          )}

          {usersState.status === 'ready' && (
            <>
              <AdminUserResults
                hasUsers={usersState.value.length > 0}
                listQuery={listQuery}
                selectedRouteId={selectedRouteId}
                users={pageUsers}
                onSelectUser={selectUser}
                onSortByField={sortByField}
              />
              <PaginationControls
                ariaLabel="Admin user pagination"
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

      <AdminUserDetailPanel
        mutationState={roleMutationState}
        selectedRouteId={selectedRouteId}
        state={usersState}
        user={selectedUser}
        onReplaceRoles={(user, request) => void handleReplaceRoles(user, request)}
      />
    </div>
  )
}

function AdminUserResults({
  hasUsers,
  listQuery,
  onSelectUser,
  onSortByField,
  selectedRouteId,
  users,
}: {
  hasUsers: boolean
  listQuery: AdminUsersListQuery
  onSelectUser: (user: AdminUserAccount) => void
  onSortByField: (field: UsersSortField) => void
  selectedRouteId: string
  users: readonly AdminUserAccount[]
}) {
  if (users.length === 0) {
    return hasUsers ? (
      <StateBlock
        message="No users match these filters."
        title="No matching users"
        variant="empty"
      />
    ) : (
      <StateBlock
        message="No users are available."
        title="No users returned"
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
      aria-label="Scrollable admin users table"
      className="catalog-table-scroll"
      role="region"
      tabIndex={0}
    >
      <table className="catalog-table admin-users-table">
        <caption className="visually-hidden">Admin users</caption>
        <thead>
          <tr>
            <SortToggleHeader
              direction={headerDirection('user')}
              label="User"
              onSort={() => onSortByField('user')}
            />
            <SortToggleHeader
              direction={headerDirection('provider')}
              label="Provider"
              onSort={() => onSortByField('provider')}
            />
            <SortToggleHeader
              direction={headerDirection('email')}
              label="Email"
              onSort={() => onSortByField('email')}
            />
            <th className="plain-column-header" scope="col">
              Roles
            </th>
            <SortToggleHeader
              direction={headerDirection('lastLogin')}
              label="Last login"
              onSort={() => onSortByField('lastLogin')}
            />
            <th className="plain-column-header" scope="col">
              Details
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
  selected,
  user,
}: {
  index: number
  onSelectUser: (user: AdminUserAccount) => void
  selected: boolean
  user: AdminUserAccount
}) {
  const label = createUserLabel(user, index)

  return (
    <tr>
      <th scope="row">
        <span>{label}</span>
        <span className="table-subtext">
          {user.login?.trim() ? user.login : 'Login unavailable'}
        </span>
      </th>
      <td>{user.provider?.trim() ? user.provider : 'Unknown'}</td>
      <td>{user.email?.trim() ? user.email : 'Unavailable'}</td>
      <td>
        <RolePills roles={user.roles} />
      </td>
      <td>{formatTimestamp(user.lastLoginAt)}</td>
      <td>
        <div
          aria-label={`Actions for ${label}`}
          className="row-actions"
          role="group"
        >
          <button
            aria-current={selected ? 'true' : undefined}
            className={
              selected ? 'secondary-button selected-row-action' : 'secondary-button'
            }
            type="button"
            disabled={user.id === undefined}
            onClick={() => onSelectUser(user)}
          >
            View {label}
          </button>
        </div>
      </td>
    </tr>
  )
}

function AdminUserDetailPanel({
  mutationState,
  onReplaceRoles,
  selectedRouteId,
  state,
  user,
}: {
  mutationState: MutationState
  onReplaceRoles: (
    user: AdminUserAccount,
    request: AdminUserRoleUpdateRequest,
  ) => void
  selectedRouteId: string
  state: LoadState<AdminUserAccount[]>
  user: AdminUserAccount | null
}) {
  return (
    <section
      className="admin-user-detail-panel"
      aria-labelledby="admin-user-detail-title"
    >
      <div className="admin-section-heading">
        <div>
          <h2 id="admin-user-detail-title">User detail</h2>
        </div>
      </div>

      {state.status === 'loading' && (
        <StateBlock
          message="Loading user detail..."
          title="Loading selected user"
          variant="loading"
        />
      )}

      {state.status === 'error' && (
        <StateBlock
          message="User detail is unavailable until the user list loads."
          title="Detail unavailable"
          variant="empty"
        />
      )}

      {state.status === 'ready' && selectedRouteId && user === null && (
        <StateBlock
          message={`No user was found for id ${selectedRouteId}.`}
          title="User not found"
          variant="error"
        />
      )}

      {state.status === 'ready' && !selectedRouteId && user === null && (
        <StateBlock
          message="Select a user to review roles and provenance."
          title="No user selected"
          variant="empty"
        />
      )}

      {state.status === 'ready' && user !== null && (
        <AdminUserDetail
          mutationState={mutationState}
          user={user}
          onReplaceRoles={onReplaceRoles}
        />
      )}
    </section>
  )
}

function AdminUserDetail({
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
  const label = createUserLabel(user)

  return (
    <div className="admin-user-detail-content">
      <div className="workflow-group" aria-label="Selected user identity">
        <div className="account-summary">
          <div>
            <p className="account-name">{label}</p>
            <p className="account-subtitle">
              {user.login?.trim() ? user.login : 'Login unavailable'}
            </p>
          </div>
          <RolePills roles={user.roles} />
        </div>

        <dl className="account-metadata">
          <div>
            <dt>Provider</dt>
            <dd>{user.provider?.trim() ? user.provider : 'Unknown'}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email?.trim() ? user.email : 'Unavailable'}</dd>
          </div>
          <div>
            <dt>Preferred language</dt>
            <dd>
              {user.preferredLanguage?.trim()
                ? user.preferredLanguage
                : 'No preference'}
            </dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{formatTimestamp(user.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      <RoleGrantProvenance grants={user.roleGrants} />

      <RoleReplacementForm
        mutationState={mutationState}
        user={user}
        onReplaceRoles={onReplaceRoles}
      />
    </div>
  )
}

function RoleGrantProvenance({
  grants,
}: {
  grants: readonly AdminUserRoleGrant[] | undefined
}) {
  const visibleGrants = grants ?? []

  return (
    <section
      className="role-grant-section workflow-group"
      aria-labelledby="role-grants-title"
    >
      <div className="workflow-group-heading">
        <div>
          <h3 id="role-grants-title">Audit role grants</h3>
        </div>
      </div>

      {visibleGrants.length === 0 ? (
        <p className="session-message muted">
          No role-grant provenance is available.
        </p>
      ) : (
        <div
          aria-label="Scrollable role grants table"
          className="catalog-table-scroll"
          role="region"
          tabIndex={0}
        >
          <table className="catalog-table role-grants-table">
            <caption className="visually-hidden">Role grant provenance</caption>
            <thead>
              <tr>
                <th className="plain-column-header" scope="col">
                  Role
                </th>
                <th className="plain-column-header" scope="col">
                  Source
                </th>
                <th className="plain-column-header" scope="col">
                  Granted
                </th>
                <th className="plain-column-header" scope="col">
                  Granted by
                </th>
                <th className="plain-column-header" scope="col">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleGrants.map((grant, index) => (
                <tr key={createGrantKey(grant, index)}>
                  <th scope="row">{grant.role ?? 'Unknown role'}</th>
                  <td>{grant.source ?? 'Unknown source'}</td>
                  <td>{formatTimestamp(grant.grantedAt)}</td>
                  <td>{formatGrantingOperator(grant)}</td>
                  <td>{grant.reason?.trim() ? grant.reason : 'No reason recorded'}</td>
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
      aria-label={`Replace roles for ${createUserLabel(user)}`}
      onSubmit={handleSubmit}
    >
      <div className="workflow-group-heading">
        <div>
          <h3>Replace managed roles</h3>
          <p className="section-description">
            Submit the complete managed role set with an operator reason.
          </p>
        </div>
      </div>

      <fieldset className="admin-checkbox-group">
        <legend>Managed roles</legend>
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
        <span>Operator reason</span>
        <textarea
          required
          rows={4}
          value={draft.reason}
          onChange={(event) => updateDraft({ reason: event.currentTarget.value })}
        />
      </label>

      <div className="admin-action-row">
        <button type="submit" disabled={!canSubmit}>
          {submitting ? 'Saving roles...' : 'Save roles'}
        </button>
      </div>

      {user.id === undefined && (
        <p className="session-message error" role="alert">
          Role replacement requires a persisted user id.
        </p>
      )}

      <MutationFeedback state={mutationState} />
    </form>
  )
}

function RolePills({ roles }: { roles: readonly string[] | undefined }) {
  const visibleRoles = roles ?? []

  if (visibleRoles.length === 0) {
    return <span className="session-message muted">No roles</span>
  }

  return (
    <div className="account-roles" aria-label="Current roles">
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

function formatUserWindow(total: number, page: number, size: number) {
  const label = `${total} ${total === 1 ? 'user' : 'users'}`

  if (total <= 0) {
    return label
  }

  const start = page * size + 1
  const end = Math.min((page + 1) * size, total)

  return `Showing ${start}-${end} of ${label}`
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

function formatGrantingOperator(grant: AdminUserRoleGrant) {
  const login = grant.grantedByLogin?.trim()
  const userId = grant.grantedByUserId

  if (login && userId !== undefined) {
    return `${login} (ID ${userId})`
  }

  if (login) {
    return login
  }

  if (userId !== undefined) {
    return `User ${userId}`
  }

  return 'System'
}
