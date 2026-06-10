import type { Plugin } from 'vite'
import { createMockApiHandler, createMockApiOptionsFromEnv } from './handler'

type MiddlewareRequest = {
  headers: Record<string, string | string[] | undefined>
  method?: string
  originalUrl?: string
  url?: string
  [Symbol.asyncIterator]?: () => AsyncIterableIterator<Uint8Array>
}

type MiddlewareResponse = {
  end: (body?: Uint8Array) => void
  setHeader: (name: string, value: number | string | readonly string[]) => void
  statusCode: number
  statusMessage: string
}

type MiddlewareNext = () => void

export function mockApiPlugin(env: Record<string, string | undefined>): Plugin {
  return {
    name: 'technical-interview-frontend-mock-api',
    configureServer(server) {
      server.middlewares.use(createMockApiMiddleware(env))
    },
    configurePreviewServer(server) {
      server.middlewares.use(createMockApiMiddleware(env))
    },
  }
}

export function createMockApiMiddleware(env: Record<string, string | undefined>) {
  const handler = createMockApiHandler(createMockApiOptionsFromEnv(env))

  return async function mockApiMiddleware(
    req: MiddlewareRequest,
    res: MiddlewareResponse,
    next: MiddlewareNext,
  ) {
    const path = getRequestPath(req)

    if (!isMockApiRequestPath(path)) {
      next()
      return
    }

    // Connect does not handle rejected async middleware, so an unexpected
    // handler failure would otherwise hang the request.
    try {
      const request = await toRequest(req)
      const response = await handler(request)

      if (!response) {
        next()
        return
      }

      await writeResponse(res, response)
    } catch (error: unknown) {
      console.error('[mock-api] request handling failed', error)
      await writeResponse(
        res,
        Response.json(
          {
            title: 'Mock API failure',
            status: 500,
            detail: error instanceof Error ? error.message : String(error),
          },
          { status: 500 },
        ),
      )
    }
  }
}

export function isMockApiRequestPath(path: string) {
  return /^\/api(?:$|\/(?!.*\.(?:ts|tsx|js|jsx|css|map)(?:\?|$)).*)/.test(path)
}

async function toRequest(req: MiddlewareRequest) {
  const path = getRequestPath(req)
  const headers = new Headers()

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item)
      }
    } else if (value !== undefined) {
      headers.set(key, value)
    }
  }

  return new Request(new URL(path, 'http://127.0.0.1'), {
    body: await readBody(req),
    headers,
    method: req.method ?? 'GET',
  })
}

function getRequestPath(req: MiddlewareRequest) {
  return req.originalUrl ?? req.url ?? '/'
}

async function readBody(req: MiddlewareRequest) {
  if (req.method === 'GET' || req.method === 'HEAD' || !req[Symbol.asyncIterator]) {
    return undefined
  }

  const chunks: Uint8Array[] = []

  for await (const chunk of req as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }

  if (chunks.length === 0) {
    return undefined
  }

  const decoder = new TextDecoder()
  let body = ''

  for (const chunk of chunks) {
    body += decoder.decode(chunk, { stream: true })
  }

  body += decoder.decode()

  return body
}

async function writeResponse(res: MiddlewareResponse, response: Response) {
  res.statusCode = response.status
  res.statusMessage = response.statusText

  setResponseHeaders(res, response.headers)

  const body = new Uint8Array(await response.arrayBuffer())
  res.end(body.length > 0 ? body : undefined)
}

function setResponseHeaders(res: MiddlewareResponse, headers: Headers) {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie
  const cookies = getSetCookie?.call(headers)

  headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      res.setHeader(key, value)
    }
  })

  if (cookies && cookies.length > 0) {
    res.setHeader('Set-Cookie', cookies)
  } else {
    const cookie = headers.get('Set-Cookie')

    if (cookie) {
      res.setHeader('Set-Cookie', cookie)
    }
  }
}
