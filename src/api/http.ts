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

// The backend is classified unreachable on stable fields only: the fetch
// itself rejected, or a 5xx response arrived without parseable problem
// details. Display sites branch with isBackendUnavailableError and render
// localized messaging; this message is a non-localized diagnostic fallback.
export class BackendUnavailableError extends Error {
  constructor(
    public readonly method: string,
    public readonly path: string,
    public readonly status?: number,
    public readonly failureCause?: unknown,
  ) {
    super(`${method} ${path} could not reach the backend service`)
    this.name = 'BackendUnavailableError'
  }
}

export function isBackendUnavailableError(
  error: unknown,
): error is BackendUnavailableError {
  return error instanceof BackendUnavailableError
}

export async function createApiResponseError(
  method: string,
  path: string,
  response: Response,
): Promise<ApiRequestError | BackendUnavailableError> {
  const problem = await parseApiProblem(response)

  if (response.status >= 500 && problem === undefined) {
    return new BackendUnavailableError(method, path, response.status)
  }

  return new ApiRequestError(
    method,
    path,
    response.status,
    response.statusText || 'Unknown status',
    problem,
  )
}

const READ_RETRY_DELAY_MS = 250

// Selected M-RESILIENCE-001 behavior: idempotent GET reads get one bounded
// automatic retry when the failure classifies as backend-unavailable.
// Problem-details responses and unsafe writes are never retried.
export async function fetchBackendRead(
  fetchImplementation: FetchImplementation,
  path: string,
  headers: Record<string, string>,
): Promise<Response> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fetchBackendResponse(fetchImplementation, 'GET', path, {
        method: 'GET',
        credentials: 'same-origin',
        headers,
      })
    } catch (error) {
      if (!isBackendUnavailableError(error) || attempt > 1) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, READ_RETRY_DELAY_MS))
    }
  }
}

export async function fetchBackendWrite(
  fetchImplementation: FetchImplementation,
  method: 'POST' | 'PUT' | 'DELETE',
  path: string,
  init: RequestInit,
): Promise<Response> {
  return fetchBackendResponse(fetchImplementation, method, path, init)
}

async function fetchBackendResponse(
  fetchImplementation: FetchImplementation,
  method: string,
  path: string,
  init: RequestInit,
): Promise<Response> {
  let response: Response

  try {
    response = await fetchImplementation(path, init)
  } catch (cause) {
    throw new BackendUnavailableError(method, path, undefined, cause)
  }

  if (!response.ok) {
    throw await createApiResponseError(method, path, response)
  }

  return response
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
