import { describe, expect, it, vi } from 'vitest'

import { createMockApiMiddleware, isMockApiRequestPath } from './vite'

describe('mock API Vite middleware routing', () => {
  it('handles backend-shaped API paths without intercepting Vite source modules', () => {
    expect(isMockApiRequestPath('/api/session')).toBe(true)
    expect(isMockApiRequestPath('/api/books?page=0&size=10')).toBe(true)
    expect(isMockApiRequestPath('/api/session.ts')).toBe(false)
    expect(isMockApiRequestPath('/api/catalog.ts?import')).toBe(false)
    expect(isMockApiRequestPath('/src/main.tsx')).toBe(false)
  })

  it('returns a 500 problem instead of hanging when the handler throws', async () => {
    const middleware = createMockApiMiddleware({})
    const requestBody = new TextEncoder().encode('{ not json')
    const request = {
      headers: {
        cookie: 'XSRF-TOKEN=mock-csrf-token',
        'x-xsrf-token': 'mock-csrf-token',
        'content-type': 'application/json',
      },
      method: 'POST',
      url: '/api/categories',
      async *[Symbol.asyncIterator]() {
        yield requestBody
      },
    }
    let responseBody: Uint8Array | undefined
    const response = {
      statusCode: 0,
      statusMessage: '',
      setHeader: () => undefined,
      end: (body?: Uint8Array) => {
        responseBody = body
      },
    }
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    try {
      await middleware(request, response, () => {
        throw new Error('next() must not be called for handled API paths')
      })
    } finally {
      consoleError.mockRestore()
    }

    expect(response.statusCode).toBe(500)
    expect(responseBody).toBeDefined()
    expect(
      JSON.parse(new TextDecoder().decode(responseBody)),
    ).toMatchObject({
      status: 500,
      title: 'Mock API failure',
    })
  })
})
