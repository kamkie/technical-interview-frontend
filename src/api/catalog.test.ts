import { describe, expect, it, vi } from 'vitest'

import {
  BOOKS_PATH,
  CATEGORIES_PATH,
  buildBookSearchPath,
  createBook,
  createCategory,
  deleteBook,
  deleteCategory,
  fetchBooks,
  fetchCategories,
  getBookPath,
  getCategoryPath,
  updateBook,
  updateCategory,
  type BookCreateRequest,
  type BookUpdateRequest,
  type CategoryCreateRequest,
  type CategoryUpdateRequest,
} from './catalog'
import type { SessionResponse } from './session'

describe('catalog API client', () => {
  it('serializes Spring pagination and repeated filters', () => {
    expect(
      buildBookSearchPath({
        title: ' clean ',
        author: 'Martin',
        category: ['Java', ' Architecture ', ''],
        page: 2,
        size: 10,
        sort: ['title,ASC', 'id,DESC'],
      }),
    ).toBe(
      `${BOOKS_PATH}?title=clean&author=Martin&category=Java&category=Architecture&page=2&size=10&sort=title%2CASC&sort=id%2CDESC`,
    )
  })

  it('fetches books with same-origin credentials and language headers', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      Response.json({
        content: [],
        number: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
      }),
    )

    await fetchBooks(
      {
        category: ['Java', 'Architecture'],
        page: 0,
        size: 10,
        sort: ['title,ASC'],
      },
      {
        acceptLanguage: 'pl',
        fetchImplementation,
      },
    )

    expect(fetchImplementation).toHaveBeenCalledWith(
      `${BOOKS_PATH}?category=Java&category=Architecture&page=0&size=10&sort=title%2CASC`,
      {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'pl',
        },
      },
    )
  })

  it('fetches categories from the public categories endpoint', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      Response.json([{ id: 1, name: 'Java' }]),
    )

    await expect(
      fetchCategories({ acceptLanguage: 'en-US', fetchImplementation }),
    ).resolves.toEqual([{ id: 1, name: 'Java' }])

    expect(fetchImplementation).toHaveBeenCalledWith(CATEGORIES_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en-US',
      },
    })
  })

  it('surfaces localized problem messages from backend errors', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      Response.json(
        {
          status: 400,
          messageKey: 'error.request.invalid_filter',
          message: 'Filtr jest nieprawidlowy.',
          language: 'pl',
        },
        {
          status: 400,
          statusText: 'Bad Request',
          headers: {
            'Content-Type': 'application/problem+json',
          },
        },
      ),
    )

    await expect(
      fetchBooks({}, { fetchImplementation }),
    ).rejects.toThrow('Filtr jest nieprawidlowy.')
  })

  it('creates books with generated JSON bodies and configured CSRF metadata', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      Response.json({
        id: 7,
        title: 'Domain-Driven Design',
      }),
    )
    const request = {
      title: 'Domain-Driven Design',
      author: 'Eric Evans',
      isbn: '9780321125217',
      publicationYear: 2003,
      categories: ['Architecture'],
    } satisfies BookCreateRequest

    await expect(
      createBook(createSession(), request, {
        cookieSource: 'XSRF-TOKEN=token%201',
        fetchImplementation,
      }),
    ).resolves.toEqual({
      id: 7,
      title: 'Domain-Driven Design',
    })

    expect(fetchImplementation).toHaveBeenCalledWith(BOOKS_PATH, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'token 1',
      },
      body: JSON.stringify(request),
    })
  })

  it('updates books with the current version in the contract body', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      Response.json({
        id: 7,
        version: 4,
        title: 'Effective Java, Third Edition',
      }),
    )
    const request = {
      title: 'Effective Java, Third Edition',
      author: 'Joshua Bloch',
      publicationYear: 2018,
      version: 3,
      categories: ['Java'],
    } satisfies BookUpdateRequest

    await updateBook(createSession(), 7, request, {
      cookieSource: 'XSRF-TOKEN=token',
      fetchImplementation,
    })

    expect(fetchImplementation).toHaveBeenCalledWith(getBookPath(7), {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'token',
      },
      body: JSON.stringify(request),
    })
  })

  it('deletes books with same-origin credentials and CSRF metadata', async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }))

    await deleteBook(createSession(), 7, {
      cookieSource: 'XSRF-TOKEN=token',
      fetchImplementation,
    })

    expect(fetchImplementation).toHaveBeenCalledWith(getBookPath(7), {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'X-XSRF-TOKEN': 'token',
      },
      body: undefined,
    })
  })

  it('creates and updates categories through the documented category paths', async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ id: 11, name: 'Testing' }))
      .mockResolvedValueOnce(Response.json({ id: 11, name: 'Quality' }))
    const createRequest = {
      name: 'Testing',
    } satisfies CategoryCreateRequest
    const updateRequest = {
      name: 'Quality',
    } satisfies CategoryUpdateRequest

    await createCategory(createSession(), createRequest, {
      cookieSource: 'XSRF-TOKEN=token',
      fetchImplementation,
    })
    await updateCategory(createSession(), 11, updateRequest, {
      cookieSource: 'XSRF-TOKEN=token',
      fetchImplementation,
    })

    expect(fetchImplementation).toHaveBeenNthCalledWith(1, CATEGORIES_PATH, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'token',
      },
      body: JSON.stringify(createRequest),
    })
    expect(fetchImplementation).toHaveBeenNthCalledWith(2, getCategoryPath(11), {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'token',
      },
      body: JSON.stringify(updateRequest),
    })
  })

  it('deletes categories and surfaces localized category-in-use errors', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      Response.json(
        {
          status: 409,
          messageKey: 'error.category.in_use',
          message: 'Kategoria jest uzywana przez ksiazki.',
          language: 'pl',
        },
        {
          status: 409,
          statusText: 'Conflict',
          headers: {
            'Content-Type': 'application/problem+json',
          },
        },
      ),
    )

    await expect(
      deleteCategory(createSession(), 11, {
        cookieSource: 'XSRF-TOKEN=token',
        fetchImplementation,
      }),
    ).rejects.toThrow('Kategoria jest uzywana przez ksiazki.')

    expect(fetchImplementation).toHaveBeenCalledWith(getCategoryPath(11), {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'X-XSRF-TOKEN': 'token',
      },
      body: undefined,
    })
  })

  it('omits invented CSRF headers when the readable cookie is missing', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      Response.json({
        id: 12,
        name: 'Security',
      }),
    )

    await createCategory(
      createSession(),
      {
        name: 'Security',
      },
      {
        cookieSource: 'language=en',
        fetchImplementation,
      },
    )

    expect(fetchImplementation).toHaveBeenCalledWith(CATEGORIES_PATH, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Security',
      }),
    })
  })

  it('does not issue catalog writes for anonymous sessions', async () => {
    const fetchImplementation = vi.fn()

    await expect(
      createBook(
        createSession({
          authenticated: false,
        }),
        {
          title: 'Clean Architecture',
          author: 'Robert C. Martin',
          isbn: '9780134494166',
          publicationYear: 2017,
        },
        { fetchImplementation },
      ),
    ).rejects.toThrow('Catalog changes require an authenticated session.')
    expect(fetchImplementation).not.toHaveBeenCalled()
  })
})

function createSession(overrides: SessionResponse = {}): SessionResponse {
  return {
    authenticated: true,
    accountPath: '/api/account',
    loginProviders: [],
    logoutPath: '/api/session/logout',
    sessionCookie: {
      name: 'technical-interview-demo-session',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    },
    csrf: {
      enabled: true,
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN',
    },
    ...overrides,
  }
}
