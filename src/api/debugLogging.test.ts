import { describe, expect, it, vi } from 'vitest'

import { createDebugLoggingFetch } from './debugLogging'

describe('createDebugLoggingFetch', () => {
  it('logs request and completion lines for successful API requests', async () => {
    const response = new Response('[]', {
      headers: {
        'Content-Type': 'application/json',
      },
      status: 200,
    })
    const baseFetch = vi.fn().mockResolvedValue(response)
    const debugConsole = createDebugConsole()
    const loggingFetch = createDebugLoggingFetch(baseFetch, debugConsole)

    await expect(
      loggingFetch('/api/books?page=1&sort=title%2CASC', { method: 'GET' }),
    ).resolves.toBe(response)

    expect(debugConsole.debug).toHaveBeenCalledTimes(2)
    expect(debugConsole.debug).toHaveBeenNthCalledWith(
      1,
      '[api] #1 -> GET /api/books?page=1&sort=title%2CASC',
    )
    expect(debugConsole.debug).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(
        /^\[api\] #1 <- 200 GET \/api\/books\?page=1&sort=title%2CASC in \d+ms$/,
      ),
    )
    expect(debugConsole.error).not.toHaveBeenCalled()
  })

  it('logs problem details for failed API responses without consuming the body', async () => {
    const problem = {
      message: 'Invalid publication year filter combination.',
      messageKey: 'books.validation.year-filter-combination',
    }
    const response = new Response(JSON.stringify(problem), {
      headers: {
        'Content-Type': 'application/json',
      },
      status: 400,
    })
    const baseFetch = vi.fn().mockResolvedValue(response)
    const debugConsole = createDebugConsole()
    const loggingFetch = createDebugLoggingFetch(baseFetch, debugConsole)

    const result = await loggingFetch('/api/books?year=1', {
      method: 'GET',
    })

    expect(debugConsole.error).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\[api\] #1 <- 400 GET \/api\/books\?year=1 in \d+ms /,
      ),
    )
    expect(debugConsole.error).toHaveBeenCalledWith(
      expect.stringContaining(JSON.stringify(problem)),
    )
    await expect(result.json()).resolves.toEqual(problem)
  })

  it('logs and rethrows network failures', async () => {
    const failure = new TypeError('Failed to fetch')
    const baseFetch = vi.fn().mockRejectedValue(failure)
    const debugConsole = createDebugConsole()
    const loggingFetch = createDebugLoggingFetch(baseFetch, debugConsole)

    await expect(
      loggingFetch('/api/session', { method: 'GET' }),
    ).rejects.toBe(failure)

    expect(debugConsole.error).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\[api\] #1 x GET \/api\/session network failure after \d+ms$/,
      ),
      failure,
    )
  })

  it('reads the method and path from Request inputs', async () => {
    const baseFetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }))
    const debugConsole = createDebugConsole()
    const loggingFetch = createDebugLoggingFetch(baseFetch, debugConsole)

    await loggingFetch(
      new Request('http://localhost/api/books/7', { method: 'DELETE' }),
    )

    expect(debugConsole.debug).toHaveBeenNthCalledWith(
      1,
      '[api] #1 -> DELETE /api/books/7',
    )
  })

  it('numbers concurrent requests so log lines stay pairable', async () => {
    const baseFetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }))
    const debugConsole = createDebugConsole()
    const loggingFetch = createDebugLoggingFetch(baseFetch, debugConsole)

    await Promise.all([
      loggingFetch('/api/categories'),
      loggingFetch('/api/books'),
    ])

    expect(debugConsole.debug).toHaveBeenCalledWith(
      '[api] #1 -> GET /api/categories',
    )
    expect(debugConsole.debug).toHaveBeenCalledWith('[api] #2 -> GET /api/books')
  })

  it('passes non-API requests through without logging', async () => {
    const response = new Response(null, { status: 200 })
    const baseFetch = vi.fn().mockResolvedValue(response)
    const debugConsole = createDebugConsole()
    const loggingFetch = createDebugLoggingFetch(baseFetch, debugConsole)

    await expect(loggingFetch('/assets/logo.svg')).resolves.toBe(response)
    await expect(
      loggingFetch('https://example.com/external'),
    ).resolves.toBe(response)

    expect(debugConsole.debug).not.toHaveBeenCalled()
    expect(debugConsole.error).not.toHaveBeenCalled()
  })
})

function createDebugConsole() {
  return {
    debug: vi.fn(),
    error: vi.fn(),
  }
}
