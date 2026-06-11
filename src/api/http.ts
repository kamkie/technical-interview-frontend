import type { components } from './generated/openapi'

export type ApiProblemResponse = components['schemas']['ApiProblemResponse']

export type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>

export class ApiRequestError extends Error {
  constructor(
    public readonly method: string,
    public readonly path: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly problem?: ApiProblemResponse,
  ) {
    super(
      problem?.message ??
        `${method} ${path} failed with ${status} ${statusText}`.trim(),
    )
    this.name = 'ApiRequestError'
  }
}

export async function parseApiProblem(
  response: Response,
): Promise<ApiProblemResponse | undefined> {
  const contentType = response.headers.get('Content-Type') ?? ''

  if (!contentType.includes('json')) {
    return undefined
  }

  try {
    return (await response.clone().json()) as ApiProblemResponse
  } catch {
    return undefined
  }
}

export function getBrowserAcceptLanguage() {
  if (typeof navigator === 'undefined') {
    return undefined
  }

  if (navigator.languages.length > 0) {
    return navigator.languages.join(', ')
  }

  return navigator.language || undefined
}

// The resolved UI language set by the i18n provider; undefined until the
// first resolution keeps the browser-list pass-through for early requests.
let activeRequestLanguage: string | undefined

export function setActiveRequestLanguage(language: string | undefined) {
  activeRequestLanguage = language
}

export function getActiveRequestLanguage() {
  return activeRequestLanguage
}

export function getActiveLanguageHeaders(): Record<string, string> {
  if (activeRequestLanguage === undefined) {
    return {}
  }

  return {
    'Accept-Language': activeRequestLanguage,
  }
}

export function createJsonReadHeaders(
  acceptLanguage = activeRequestLanguage ?? getBrowserAcceptLanguage(),
) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (acceptLanguage) {
    headers['Accept-Language'] = acceptLanguage
  }

  return headers
}
