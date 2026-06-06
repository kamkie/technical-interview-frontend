import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BOOKS_PATH, CATEGORIES_PATH, type BookPage, type Category } from '../api/catalog'
import {
  catalogCategories,
  emptyBookPage,
  filteredBookPage,
  paginatedBookPage,
  populatedBookPage,
} from '../test/fixtures/catalog'
import { CatalogPanel } from './CatalogPanel'

describe('CatalogPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders loading states while public catalog requests are pending', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise<Response>(() => undefined)),
    )

    render(<CatalogPanel />)

    expect(screen.getByText('Loading categories...')).toBeInTheDocument()
    expect(screen.getByText('Loading books...')).toBeInTheDocument()
  })

  it('loads public categories and books with contract-shaped query parameters', async () => {
    const fetchMock = mockCatalogFetch()

    render(<CatalogPanel />)

    expect(await screen.findByText('Effective Java')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Author' })).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: 'Publication year' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'ISBN' })).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: 'Categories' }),
    ).toBeInTheDocument()
    expect(screen.getByText('2 books')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(CATEGORIES_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Accept-Language': expect.stringContaining('en'),
      },
    })
    expect(fetchMock).toHaveBeenCalledWith(
      `${BOOKS_PATH}?page=0&size=10&sort=title%2CASC`,
      {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Accept-Language': expect.stringContaining('en'),
        },
      },
    )
  })

  it('renders an empty state when no books match the current filters', async () => {
    mockCatalogFetch({ books: emptyBookPage })

    render(<CatalogPanel />)

    expect(await screen.findByText('0 books')).toBeInTheDocument()
    expect(
      screen.getByText('No books match these filters.'),
    ).toBeInTheDocument()
  })

  it('submits text and repeated category filters', async () => {
    const fetchMock = mockCatalogFetch({
      books: (path) =>
        path.includes('title=clean') ? filteredBookPage : populatedBookPage,
    })

    render(<CatalogPanel />)

    const titleInput = screen.getByLabelText('Title')
    const authorInput = screen.getByLabelText('Author')

    await screen.findByText('Effective Java')
    fireEvent.change(titleInput, { target: { value: 'clean' } })
    fireEvent.change(authorInput, { target: { value: 'martin' } })
    fireEvent.click(screen.getByRole('button', { name: 'Java' }))
    fireEvent.click(screen.getByRole('button', { name: 'Architecture' }))
    fireEvent.submit(titleInput.closest('form')!)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${BOOKS_PATH}?title=clean&author=martin&category=Java&category=Architecture&page=0&size=10&sort=title%2CASC`,
        expect.objectContaining({
          credentials: 'same-origin',
          method: 'GET',
        }),
      )
    })
    expect(await screen.findByText('Clean Code')).toBeInTheDocument()
    expect(screen.getByText('1 books in 2 selected categories')).toBeInTheDocument()
  })

  it('requests the next button-based page with Spring pagination parameters', async () => {
    const fetchMock = mockCatalogFetch({ books: paginatedBookPage })

    render(<CatalogPanel />)

    expect(await screen.findByText('Refactoring')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${BOOKS_PATH}?page=1&size=10&sort=title%2CASC`,
        expect.objectContaining({
          credentials: 'same-origin',
          method: 'GET',
        }),
      )
    })
  })

  it('renders localized backend book error messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const path = String(input)

        if (path === CATEGORIES_PATH) {
          return Promise.resolve(Response.json([]))
        }

        if (path.startsWith(BOOKS_PATH)) {
          return Promise.resolve(
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
        }

        return Promise.resolve(new Response(null, { status: 404 }))
      }),
    )

    render(<CatalogPanel />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Filtr jest nieprawidlowy.',
    )
  })

  it('renders localized backend category error messages without hiding books', async () => {
    mockCatalogFetch({
      categories: () =>
        Response.json(
          {
            status: 503,
            messageKey: 'error.category.unavailable',
            message: 'Kategorie sa chwilowo niedostepne.',
            language: 'pl',
          },
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
              'Content-Type': 'application/problem+json',
            },
          },
        ),
    })

    render(<CatalogPanel />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Kategorie sa chwilowo niedostepne.',
    )
    expect(await screen.findByText('Effective Java')).toBeInTheDocument()
  })
})

function mockCatalogFetch({
  books = populatedBookPage,
  categories = catalogCategories,
}: {
  books?: BookPage | ((path: string) => BookPage | Response)
  categories?: Category[] | (() => Category[] | Response)
} = {}) {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const path = String(input)

    if (path === CATEGORIES_PATH) {
      return Promise.resolve(toResponse(resolveValue(categories)))
    }

    if (path.startsWith(BOOKS_PATH)) {
      return Promise.resolve(toResponse(resolveValue(books, path)))
    }

    return Promise.resolve(new Response(null, { status: 404 }))
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

function resolveValue<T, TArgs extends unknown[]>(
  value: T | ((...args: TArgs) => T),
  ...args: TArgs
) {
  return typeof value === 'function'
    ? (value as (...args: TArgs) => T)(...args)
    : value
}

function toResponse(value: BookPage | Category[] | Response) {
  return value instanceof Response ? value : Response.json(value)
}
