import type { components } from './generated/openapi'
import {
  ApiRequestError,
  getActiveLanguageHeaders,
  parseApiProblem,
  type FetchImplementation,
} from './http'
import {
  getCsrfHeaders,
  type SessionResponse,
} from './session'

export const ACCOUNT_PATH = '/api/account' as const
export const ACCOUNT_LANGUAGE_PATH = '/api/account/language' as const

export type UserAccount = components['schemas']['UserAccountResponse']
export type UserAccountLanguageRequest =
  components['schemas']['UserAccountLanguageRequest']

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
      ...getActiveLanguageHeaders(),
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

export async function updateAccountLanguage(
  session: SessionResponse,
  preferredLanguage: string | undefined,
  fetchImplementation: FetchImplementation = globalThis.fetch,
  cookieSource?: string,
): Promise<UserAccount> {
  if (session.authenticated !== true) {
    throw new Error('Account language preference requires an authenticated session.')
  }

  const requestBody = {
    preferredLanguage: preferredLanguage?.trim() ?? '',
  } satisfies UserAccountLanguageRequest
  const response = await fetchImplementation(ACCOUNT_LANGUAGE_PATH, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...getActiveLanguageHeaders(),
      ...getCsrfHeaders(session, cookieSource),
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    throw new ApiRequestError(
      'PUT',
      ACCOUNT_LANGUAGE_PATH,
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
