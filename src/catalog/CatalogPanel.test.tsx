import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
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
import { CATALOG_ROUTE_PATH } from './catalogQuery'

describe('CatalogPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders loading states while public catalog requests are pending', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise<Response>(() => undefined)),
    )

    renderCatalogRoute()

    expect(screen.getByText('Loading categories...')).toBeInTheDocument()
    expect(screen.getByText('Loading books...')).toBeInTheDocument()
  })

  it('loads public categories and books with contract-shaped query parameters', async () => {
    const fetchMock = mockCatalogFetch()

    renderCatalogRoute()

    expect(await screen.findByText('Effective Java')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Title/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Author/ })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Publication year/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ISBN/ })).toBeInTheDocument()
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

    renderCatalogRoute()

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

    renderCatalogRoute()

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

    renderCatalogRoute()

    expect(await screen.findByText('Refactoring')).toBeInTheDocument()
    expect(screen.getByText(/Page 1\s+of 3/)).toBeInTheDocument()
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

  it('derives pagination button state from page numbers when flags are absent', async () => {
    mockCatalogFetch({
      books: {
        ...paginatedBookPage,
        first: undefined,
        last: undefined,
        number: 2,
        totalPages: 3,
      },
    })

    renderCatalogRoute(`${CATALOG_ROUTE_PATH}?page=2`)

    expect(await screen.findByText('Refactoring')).toBeInTheDocument()
    expect(screen.getByText(/Page 3\s+of 3/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
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

    renderCatalogRoute()

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

    renderCatalogRoute()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Kategorie sa chwilowo niedostepne.',
    )
    expect(await screen.findByText('Effective Java')).toBeInTheDocument()
  })

  it('hydrates filters, pagination, and repeated sorts from the catalog route query', async () => {
    const fetchMock = mockCatalogFetch()

    renderCatalogRoute(
      `${CATALOG_ROUTE_PATH}?title=clean&author=martin&isbn=978013&category=Java&category=Architecture&page=2&size=20&sort=publicationYear,DESC&sort=title,ASC`,
    )

    expect(await screen.findByDisplayValue('clean')).toBeInTheDocument()
    expect(screen.getByDisplayValue('martin')).toBeInTheDocument()
    expect(screen.getByDisplayValue('978013')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Java' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Architecture' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(fetchMock).toHaveBeenCalledWith(
      `${BOOKS_PATH}?title=clean&author=martin&isbn=978013&category=Java&category=Architecture&page=2&size=20&sort=publicationYear%2CDESC&sort=title%2CASC`,
      expect.objectContaining({
        credentials: 'same-origin',
        method: 'GET',
      }),
    )
  })

  it('sanitizes invalid and duplicate route query values before requesting books', async () => {
    const fetchMock = mockCatalogFetch()

    renderCatalogRoute(
      `${CATALOG_ROUTE_PATH}?title=%20clean%20&category=Java&category=Java&category=&page=-2&size=999&sort=unknown,DESC`,
    )

    await screen.findByDisplayValue('clean')

    expect(fetchMock).toHaveBeenCalledWith(
      `${BOOKS_PATH}?title=clean&category=Java&page=0&size=10&sort=title%2CASC`,
      expect.objectContaining({
        credentials: 'same-origin',
        method: 'GET',
      }),
    )
  })

  it('syncs filter, category, and sort changes into browser history', async () => {
    const fetchMock = mockCatalogFetch()
    const { router } = renderCatalogRoute()

    const titleInput = await screen.findByLabelText('Title')
    fireEvent.change(titleInput, { target: { value: 'clean' } })
    fireEvent.submit(titleInput.closest('form')!)

    await waitFor(() => {
      expect(router.state.location.search).toBe('?title=clean')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Java' }))

    await waitFor(() => {
      expect(router.state.location.search).toBe('?title=clean&category=Java')
    })

    fireEvent.change(screen.getByLabelText('Sort by'), {
      target: { value: 'publicationYear,DESC' },
    })

    await waitFor(() => {
      expect(router.state.location.search).toBe(
        '?title=clean&category=Java&sort=publicationYear%2CDESC',
      )
    })
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${BOOKS_PATH}?title=clean&category=Java&page=0&size=10&sort=publicationYear%2CDESC`,
        expect.objectContaining({
          credentials: 'same-origin',
          method: 'GET',
        }),
      )
    })

    await act(async () => {
      await router.navigate(-1)
    })

    await waitFor(() => {
      expect(router.state.location.search).toBe('?title=clean&category=Java')
    })
    expect(screen.getByLabelText('Sort by')).toHaveValue('title,ASC')

    await act(async () => {
      await router.navigate(-1)
    })

    await waitFor(() => {
      expect(router.state.location.search).toBe('?title=clean')
    })
    expect(screen.getByRole('button', { name: 'Java' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    await act(async () => {
      await router.navigate(1)
    })

    await waitFor(() => {
      expect(router.state.location.search).toBe('?title=clean&category=Java')
    })
  })

  it('updates page size and sortable headers through query state', async () => {
    const fetchMock = mockCatalogFetch({ books: paginatedBookPage })
    const { router } = renderCatalogRoute()

    expect(await screen.findByText('Refactoring')).toBeInTheDocument()

    fireEvent.change(screen.getAllByLabelText('Rows per page')[0], {
      target: { value: '20' },
    })

    await waitFor(() => {
      expect(router.state.location.search).toBe('?size=20')
    })
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${BOOKS_PATH}?page=0&size=20&sort=title%2CASC`,
        expect.objectContaining({
          credentials: 'same-origin',
          method: 'GET',
        }),
      )
    })

    fireEvent.click(screen.getByRole('button', { name: /Publication year/ }))

    await waitFor(() => {
      expect(router.state.location.search).toBe(
        '?size=20&sort=publicationYear%2CASC',
      )
    })
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${BOOKS_PATH}?page=0&size=20&sort=publicationYear%2CASC`,
        expect.objectContaining({
          credentials: 'same-origin',
          method: 'GET',
        }),
      )
    })
  })
})

function renderCatalogRoute(initialEntry: string = CATALOG_ROUTE_PATH) {
  const router = createMemoryRouter(
    [
      {
        path: CATALOG_ROUTE_PATH,
        element: <CatalogPanel />,
      },
    ],
    {
      initialEntries: [initialEntry],
    },
  )

  return {
    router,
    ...render(<RouterProvider router={router} />),
  }
}

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
