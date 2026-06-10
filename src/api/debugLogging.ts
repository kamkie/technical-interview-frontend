import { parseApiProblem, type FetchImplementation } from './http'

type DebugConsole = Pick<Console, 'debug' | 'error'>

type ApiRequestDescription = {
  method: string
  path: string
}

// Wraps fetch with request/response/failure logs for same-origin /api/**
// traffic so forwarded browser console output makes API debugging possible
// from the Vite terminal. Non-API requests pass through unlogged.
export function createDebugLoggingFetch(
  baseFetch: FetchImplementation,
  debugConsole: DebugConsole = console,
): FetchImplementation {
  let requestSequence = 0

  return async (input, init) => {
    const request = describeApiRequest(input, init)

    if (!request) {
      return baseFetch(input, init)
    }

    const requestId = ++requestSequence
    const startedAt = performance.now()

    debugConsole.debug(`[api] #${requestId} -> ${request.method} ${request.path}`)

    let response: Response

    try {
      response = await baseFetch(input, init)
    } catch (error: unknown) {
      debugConsole.error(
        `[api] #${requestId} x ${request.method} ${request.path} network failure after ${formatElapsed(startedAt)}`,
        error,
      )
      throw error
    }

    const statusLine = `[api] #${requestId} <- ${response.status} ${request.method} ${request.path} in ${formatElapsed(startedAt)}`

    if (response.ok) {
      debugConsole.debug(statusLine)
    } else {
      const problem = await parseApiProblem(response)

      debugConsole.error(
        problem ? `${statusLine} ${JSON.stringify(problem)}` : statusLine,
      )
    }

    return response
  }
}

export function installApiDebugLogging() {
  globalThis.fetch = createDebugLoggingFetch(globalThis.fetch.bind(globalThis))
}

function describeApiRequest(
  input: RequestInfo | URL,
  init?: RequestInit,
): ApiRequestDescription | undefined {
  const url = input instanceof Request ? input.url : String(input)
  let parsed: URL

  try {
    parsed = new URL(url, globalThis.location?.href ?? 'http://localhost/')
  } catch {
    return undefined
  }

  if (parsed.pathname !== '/api' && !parsed.pathname.startsWith('/api/')) {
    return undefined
  }

  const method =
    init?.method ?? (input instanceof Request ? input.method : 'GET')

  return {
    method: method.toUpperCase(),
    path: `${parsed.pathname}${parsed.search}`,
  }
}

function formatElapsed(startedAt: number) {
  return `${Math.round(performance.now() - startedAt)}ms`
}
