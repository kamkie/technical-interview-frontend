import type { components } from './generated/openapi'
import {
  ApiRequestError,
  parseApiProblem,
  type FetchImplementation,
} from './http'
import { getCsrfHeaders, type SessionResponse } from './session'

export const ADMIN_USERS_PATH = '/api/admin/users' as const
export const MANAGED_ADMIN_USER_ROLES = ['USER', 'ADMIN'] as const satisfies readonly AdminUserRole[]

export type AdminUserAccount =
  components['schemas']['AdminUserAccountResponse']
export type AdminUserRoleGrant =
  components['schemas']['AdminUserRoleGrantResponse']
export type AdminUserRoleUpdateRequest =
  components['schemas']['AdminUserRoleUpdateRequest']
export type AdminUserRole = AdminUserRoleUpdateRequest['roles'][number]

export type AdminUsersFetchOptions = {
  fetchImplementation?: FetchImplementation
}

export type AdminUserMutationOptions = {
  cookieSource?: string
  fetchImplementation?: FetchImplementation
}

export async function fetchAdminUsers(
  options: AdminUsersFetchOptions = {},
): Promise<AdminUserAccount[]> {
  const response = await (options.fetchImplementation ?? globalThis.fetch)(
    ADMIN_USERS_PATH,
    {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new ApiRequestError(
      'GET',
      ADMIN_USERS_PATH,
      response.status,
      response.statusText || 'Unknown status',
      await parseApiProblem(response),
    )
  }

  return (await response.json()) as AdminUserAccount[]
}

export async function replaceAdminUserRoles(
  session: SessionResponse,
  id: number,
  request: AdminUserRoleUpdateRequest,
  options: AdminUserMutationOptions = {},
): Promise<AdminUserAccount> {
  if (session.authenticated !== true) {
    throw new Error('Admin user role changes require an authenticated session.')
  }

  const path = getAdminUserRolesPath(id)
  const normalizedRequest = createAdminUserRoleUpdateRequest(
    request.roles,
    request.reason,
  )
  const response = await (options.fetchImplementation ?? globalThis.fetch)(path, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...getCsrfHeaders(session, options.cookieSource),
    },
    body: JSON.stringify(normalizedRequest),
  })

  if (!response.ok) {
    throw new ApiRequestError(
      'PUT',
      path,
      response.status,
      response.statusText || 'Unknown status',
      await parseApiProblem(response),
    )
  }

  return (await response.json()) as AdminUserAccount
}

export function getAdminUserRolesPath(id: number) {
  return `${ADMIN_USERS_PATH}/${encodeURIComponent(String(id))}/roles`
}

export function createAdminUserRoleUpdateRequest(
  roles: readonly string[],
  reason: string,
): AdminUserRoleUpdateRequest {
  const nextRoles: AdminUserRole[] = ['USER']

  if (roles.includes('ADMIN')) {
    nextRoles.push('ADMIN')
  }

  return {
    roles: nextRoles,
    reason: reason.trim(),
  }
}
