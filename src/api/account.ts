import type { components } from './generated/openapi'
import {
  ApiRequestError,
  parseApiProblem,
  type FetchImplementation,
} from './http'
import type { SessionResponse } from './session'

export const ACCOUNT_PATH = '/api/account' as const

export type UserAccount = components['schemas']['UserAccountResponse']

export async function fetchCurrentAccount(
  session: SessionResponse,
  fetchImplementation: FetchImplementation = globalThis.fetch,
): Promise<UserAccount> {
  if (session.authenticated !== true) {
    throw new Error('Account profile requires an authenticated session.')
  }

  const path = getAccountPath(session)
  const response = await fetchImplementation(path, {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new ApiRequestError(
      'GET',
      path,
      response.status,
      response.statusText || 'Unknown status',
      await parseApiProblem(response),
    )
  }

  return (await response.json()) as UserAccount
}

export function getAccountPath(session: SessionResponse) {
  const configuredPath = session.accountPath?.trim()

  if (!configuredPath) {
    return ACCOUNT_PATH
  }

  if (isSameOriginApiPath(configuredPath)) {
    return configuredPath
  }

  throw new Error('Account profile endpoint is unavailable.')
}

function isSameOriginApiPath(path: string) {
  return path.startsWith('/api/')
}
