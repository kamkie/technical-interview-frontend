import type { components } from './generated/openapi'
import {
  ApiRequestError,
  fetchBackendRead,
  fetchBackendWrite,
  type FetchImplementation,
} from './http'

export const SESSION_PATH = '/api/session' as const

export type SessionResponse = components['schemas']['SessionResponse']
export type SessionLoginProvider =
  components['schemas']['SessionLoginProvider']
export type AvailableSessionLoginProvider = SessionLoginProvider & {
  authorizationPath: string
}

export async function fetchCurrentSession(
  fetchImplementation: FetchImplementation = globalThis.fetch,
): Promise<SessionResponse> {
  const response = await fetchBackendRead(fetchImplementation, SESSION_PATH, {
    Accept: 'application/json',
  })

  return (await response.json()) as SessionResponse
}

export async function logoutCurrentSession(
  session: SessionResponse,
  fetchImplementation: FetchImplementation = globalThis.fetch,
  cookieSource = getBrowserCookieSource(),
): Promise<void> {
  const logoutPath = session.logoutPath

  if (!logoutPath) {
    throw new Error('Logout is unavailable for the current session.')
  }

  await fetchBackendWrite(fetchImplementation, 'POST', logoutPath, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...getCsrfHeaders(session, cookieSource),
    },
  })
}

export function getLoginProviders(
  session: SessionResponse,
): readonly SessionLoginProvider[] {
  return session.loginProviders ?? []
}

export function getAvailableLoginProviders(
  session: SessionResponse,
): readonly AvailableSessionLoginProvider[] {
  return getLoginProviders(session).flatMap((provider) => {
    const authorizationPath = provider.authorizationPath?.trim()

    if (!authorizationPath?.startsWith('/api/')) {
      return []
    }

    return [
      {
        ...provider,
        authorizationPath,
      },
    ]
  })
}

export function formatLoginProviderName(provider: SessionLoginProvider) {
  const clientName = provider.clientName?.trim()

  if (clientName) {
    return clientName
  }

  const registrationId = provider.registrationId?.trim()

  return registrationId || 'this provider'
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
