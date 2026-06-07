import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  fetchCurrentAccount,
  type UserAccount,
} from '../api/account'
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
import { getDisplayMessage, type LoadState, type MutationState } from '../ui/asyncState'
import { formatTimestamp } from '../ui/format'
import { MutationFeedback } from '../ui/MutationFeedback'

export const ADMIN_USERS_ROUTE_PATH = '/admin/users' as const
export const ADMIN_USER_DETAIL_ROUTE_PATH = `${ADMIN_USERS_ROUTE_PATH}/:id` as const

const EMPTY_USERS: readonly AdminUserAccount[] = []

type RoleDraft = {
  reason: string
  roles: AdminUserRole[]
}

export function AdminUsersPage({ session }: { session: SessionResponse }) {
  const [accountState, setAccountState] = useState<LoadState<UserAccount>>({
    status: 'loading',
  })

  useEffect(() => {
    if (session.authenticated !== true) {
      return undefined
    }

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
        <div className="state-block error-state">
          <p className="state-block-title">Sign in required</p>
          <p className="session-message error" role="alert">
            Sign in is required for user management.
          </p>
        </div>
      </section>
    )
  }

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

      {accountState.status === 'loading' && (
        <div className="state-block loading-state">
          <p className="state-block-title">Checking admin access</p>
          <p className="session-message" role="status">
            Loading admin access...
          </p>
        </div>
      )}

      {accountState.status === 'error' && (
        <div className="state-block error-state">
          <p className="state-block-title">Admin access unavailable</p>
          <p className="session-message error" role="alert">
            {accountState.message}
          </p>
        </div>
      )}

      {accountState.status === 'ready' &&
        (hasAdminRole(accountState.value) ? (
          <AdminUsersManager session={session} />
        ) : (
          <div className="state-block error-state">
            <p className="state-block-title">Admin role required</p>
            <p className="session-message error" role="alert">
              Admin access is required for user management.
            </p>
          </div>
        ))}
    </section>
  )
}

function AdminUsersManager({ session }: { session: SessionResponse }) {
  const navigate = useNavigate()
  const params = useParams()
  const selectedRouteId = params.id?.trim() ?? ''
  const [usersState, setUsersState] = useState<LoadState<AdminUserAccount[]>>({
    status: 'loading',
  })
  const [refreshKey, setRefreshKey] = useState(0)
  const [roleMutationState, setRoleMutationState] = useState<MutationState>({
    status: 'idle',
  })

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

  function refreshUsers() {
    setUsersState({ status: 'loading' })
    setRefreshKey((key) => key + 1)
  }

  function selectUser(user: AdminUserAccount) {
    if (user.id === undefined) {
      return
    }

    setRoleMutationState({ status: 'idle' })
    navigate(getAdminUserDetailPath(user.id))
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
      <div className="route-state-panel" aria-label="Admin users status summary">
        <div>
          <span className="state-label">Current task</span>
          <span className="state-value">Review users and role grants</span>
        </div>
        <div>
          <span className="state-label">User state</span>
          <span className="state-value">
            {formatLoadStatus(usersState.status)}
          </span>
        </div>
        <div>
          <span className="state-label">Selected user</span>
          <span className="state-value">
            {selectedRouteId ? `User ${selectedRouteId}` : 'No user selected'}
          </span>
        </div>
        <div>
          <span className="state-label">Primary actions</span>
          <span className="state-value">Inspect, replace roles</span>
        </div>
      </div>

      <section className="admin-section" aria-labelledby="admin-users-list-title">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Users</p>
            <h3 id="admin-users-list-title">Application users</h3>
            <p className="section-description">
              Select a user to review profile details, roles, and grant
              history.
            </p>
          </div>
          <button
            type="button"
            aria-label="Refresh users"
            className="secondary-button compact-action"
            onClick={refreshUsers}
          >
            Refresh
          </button>
        </div>

        {usersState.status === 'loading' && (
          <div className="state-block loading-state">
            <p className="state-block-title">Loading users</p>
            <p className="session-message" role="status">
              Loading users...
            </p>
          </div>
        )}

        {usersState.status === 'error' && (
          <div className="state-block error-state">
            <p className="state-block-title">Users could not be loaded</p>
            <p className="session-message error" role="alert">
              {usersState.message}
            </p>
          </div>
        )}

        {usersState.status === 'ready' && (
          <AdminUserResults
            selectedRouteId={selectedRouteId}
            users={usersState.value}
            onSelectUser={selectUser}
          />
        )}
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
  onSelectUser,
  selectedRouteId,
  users,
}: {
  onSelectUser: (user: AdminUserAccount) => void
  selectedRouteId: string
  users: readonly AdminUserAccount[]
}) {
  if (users.length === 0) {
    return (
      <div className="state-block empty-state">
        <p className="state-block-title">No users returned</p>
        <p className="session-message muted">No users are available.</p>
      </div>
    )
  }

  return (
    <div className="catalog-table-scroll">
      <table className="catalog-table admin-users-table">
        <caption className="visually-hidden">Admin users</caption>
        <thead>
          <tr>
            <th className="plain-column-header" scope="col">
              User
            </th>
            <th className="plain-column-header" scope="col">
              Provider
            </th>
            <th className="plain-column-header" scope="col">
              Email
            </th>
            <th className="plain-column-header" scope="col">
              Roles
            </th>
            <th className="plain-column-header" scope="col">
              Last login
            </th>
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
        <div className="row-actions">
          <button
            aria-current={selected ? 'true' : undefined}
            className={selected ? 'secondary-button selected-row-action' : undefined}
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
    <aside className="admin-user-detail-panel" aria-labelledby="admin-user-detail-title">
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">Detail</p>
          <h3 id="admin-user-detail-title">User detail</h3>
          <p className="section-description">
            Detail content follows the selected user from the current list.
          </p>
        </div>
      </div>

      {state.status === 'loading' && (
        <div className="state-block loading-state">
          <p className="state-block-title">Loading selected user</p>
          <p className="session-message" role="status">
            Loading user detail...
          </p>
        </div>
      )}

      {state.status === 'error' && (
        <div className="state-block empty-state">
          <p className="state-block-title">Detail unavailable</p>
          <p className="session-message muted">
            User detail is unavailable until the user list loads.
          </p>
        </div>
      )}

      {state.status === 'ready' && selectedRouteId && user === null && (
        <div className="state-block error-state">
          <p className="state-block-title">User not found</p>
          <p className="session-message error" role="alert">
            No user was found for id {selectedRouteId}.
          </p>
        </div>
      )}

      {state.status === 'ready' && !selectedRouteId && user === null && (
        <div className="state-block empty-state">
          <p className="state-block-title">No user selected</p>
          <p className="session-message muted">
            Select a user to review roles and provenance.
          </p>
        </div>
      )}

      {state.status === 'ready' && user !== null && (
        <AdminUserDetail
          mutationState={mutationState}
          user={user}
          onReplaceRoles={onReplaceRoles}
        />
      )}
    </aside>
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
    <section className="role-grant-section" aria-labelledby="role-grants-title">
      <h4 id="role-grants-title">Role-grant provenance</h4>

      {visibleGrants.length === 0 ? (
        <p className="session-message muted">
          No role-grant provenance is available.
        </p>
      ) : (
        <div className="catalog-table-scroll">
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
      className="role-replacement-form"
      aria-label={`Replace roles for ${createUserLabel(user)}`}
      onSubmit={handleSubmit}
    >
      <div className="form-heading-row">
        <h4>Role replacement</h4>
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

function formatLoadStatus(status: LoadState<unknown>['status']) {
  if (status === 'ready') {
    return 'Ready'
  }

  if (status === 'error') {
    return 'Needs attention'
  }

  return 'Loading'
}
