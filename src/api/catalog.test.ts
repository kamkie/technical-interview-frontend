import { describe, expect, it, vi } from 'vitest'

import {
  BOOKS_PATH,
  CATEGORIES_PATH,
  buildBookSearchPath,
  fetchBooks,
  fetchCategories,
} from './catalog'

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
})
