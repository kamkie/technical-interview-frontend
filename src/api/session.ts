import type { components } from './generated/openapi'
import {
  ApiRequestError,
  parseApiProblem,
  type FetchImplementation,
} from './http'

export const SESSION_PATH = '/api/session' as const

export type SessionResponse = components['schemas']['SessionResponse']
export type SessionLoginProvider =
  components['schemas']['SessionLoginProvider']

export async function fetchCurrentSession(
  fetchImplementation: FetchImplementation = globalThis.fetch,
): Promise<SessionResponse> {
  const response = await fetchImplementation(SESSION_PATH, {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new ApiRequestError(
      'GET',
      SESSION_PATH,
      response.status,
      response.statusText || 'Unknown status',
      await parseApiProblem(response),
    )
  }

  return (await response.json()) as SessionResponse
}

export function getLoginProviders(
  session: SessionResponse,
): readonly SessionLoginProvider[] {
  return session.loginProviders ?? []
}

export function getCsrfHeaders(
  session: SessionResponse,
  cookieSource = getBrowserCookieSource(),
): Record<string, string> {
  const csrf = session.csrf

  if (session.authenticated !== true || csrf?.enabled !== true) {
    return {}
  }

  if (!csrf.cookieName || !csrf.headerName) {
    return {}
  }

  const token = readCookie(cookieSource, csrf.cookieName)

  if (!token) {
    return {}
  }

  return {
    [csrf.headerName]: token,
  }
}

export function readCookie(
  cookieSource: string,
  cookieName: string,
): string | undefined {
  for (const cookie of cookieSource.split(';')) {
    const [rawName, ...rawValueParts] = cookie.trim().split('=')

    if (!rawName) {
      continue
    }

    if (safeDecodeURIComponent(rawName) === cookieName) {
      return safeDecodeURIComponent(rawValueParts.join('='))
    }
  }

  return undefined
}

function getBrowserCookieSource() {
  return typeof document === 'undefined' ? '' : document.cookie
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export { ApiRequestError }
