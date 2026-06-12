import type { components, paths } from './generated/openapi'
import { fetchBackendRead, type FetchImplementation } from './http'
import { appendNumber, appendString, appendStringList } from './query'

export const OPERATOR_SURFACE_PATH = '/api/admin/operator-surface' as const
export const AUDIT_LOGS_PATH = '/api/admin/audit-logs' as const
export const DEFAULT_AUDIT_PAGE = 0
export const DEFAULT_AUDIT_PAGE_SIZE = 20
export const DEFAULT_AUDIT_SORT = ['id,DESC'] as const

// Looked up by contract path instead of the auto-numbered operation id, so
// backend regeneration cannot silently shift this to another operation.
type AuditLogQueryParams = NonNullable<
  NonNullable<
    paths[typeof AUDIT_LOGS_PATH]['get']['parameters']
  >['query']
>

export type AuditLog = components['schemas']['AuditLogResponse']
export type AuditLogPage = components['schemas']['AuditLogPageResponse']
export type AuditAction = NonNullable<AuditLogQueryParams['action']>
export type AuditTargetType = NonNullable<AuditLogQueryParams['targetType']>
export type OperatorSurface = components['schemas']['OperatorSurfaceResponse']

export type AuditLogSearchParams = {
  action?: AuditAction | string
  actorLogin?: string
  page?: number
  size?: number
  sort?: readonly string[]
  targetType?: AuditTargetType | string
}

export type OperatorFetchOptions = {
  fetchImplementation?: FetchImplementation
}

export async function fetchOperatorSurface(
  options: OperatorFetchOptions = {},
): Promise<OperatorSurface> {
  return fetchOperatorJson<OperatorSurface>(OPERATOR_SURFACE_PATH, options)
}

export async function fetchAuditLogs(
  params: AuditLogSearchParams = {},
  options: OperatorFetchOptions = {},
): Promise<AuditLogPage> {
  return fetchOperatorJson<AuditLogPage>(buildAuditLogSearchPath(params), options)
}

export function buildAuditLogSearchPath(params: AuditLogSearchParams = {}) {
  const search = new URLSearchParams()

  appendString(search, 'targetType', params.targetType)
  appendString(search, 'action', params.action)
  appendString(search, 'actorLogin', params.actorLogin)
  appendNumber(search, 'page', params.page)
  appendNumber(search, 'size', params.size)
  appendStringList(search, 'sort', params.sort)

  const query = search.toString()

  return query ? `${AUDIT_LOGS_PATH}?${query}` : AUDIT_LOGS_PATH
}

export function getSafeOperatorApiPath(path: string | undefined) {
  const trimmed = path?.trim()

  if (!trimmed || !trimmed.startsWith('/api/')) {
    return undefined
  }

  return trimmed
}

async function fetchOperatorJson<T>(
  path: string,
  options: OperatorFetchOptions,
) {
  const response = await fetchBackendRead(
    options.fetchImplementation ?? globalThis.fetch,
    path,
    {
      Accept: 'application/json',
    },
  )

  return (await response.json()) as T
}
