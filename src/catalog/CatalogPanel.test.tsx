import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
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

    const { container } = renderCatalogRoute()

    expect(container.querySelector('.state-block[data-state="loading"]')).not.toBeNull()
    expect(
      container.querySelector('.session-message[data-state="loading"]'),
    ).not.toBeNull()
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
    expect(screen.getByText('Showing 1-2 of 2 books')).toBeInTheDocument()
    // Sorting is owned by the column headers; the toolbar repeats neither a
    // sort select nor the page position the bottom pager already numbers.
    expect(screen.queryByLabelText('Sort by')).not.toBeInTheDocument()
    expect(screen.queryByText('Page 1 of 1')).not.toBeInTheDocument()
    expect(
      within(screen.getByLabelText('Book pagination')).getByRole('button', {
        name: 'Page 1',
      }),
    ).toHaveAttribute('aria-current', 'page')
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

  it('fetches books once when entering through a non-canonical URL', async () => {
    const fetchMock = mockCatalogFetch()

    const { router } = renderCatalogRoute(
      `${CATALOG_ROUTE_PATH}?page=0&size=10&title=%20Effective%20`,
    )

    expect(await screen.findByText('Effective Java')).toBeInTheDocument()
    await waitFor(() => {
      expect(router.state.location.search).toBe('?title=Effective')
    })

    const bookCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).startsWith(BOOKS_PATH),
    )
    expect(bookCalls).toHaveLength(1)
  })

  it('keeps responsive catalog controls and table scrolling discoverable', async () => {
    mockCatalogFetch()

    renderCatalogRoute()

    expect(await screen.findByText('Effective Java')).toBeInTheDocument()

    const filters = screen.getByRole('form', { name: 'Catalog filters' })
    expect(within(filters).getByLabelText('Title')).toBeInTheDocument()
    expect(within(filters).getByLabelText('Author')).toBeInTheDocument()
    expect(within(filters).getByLabelText('ISBN')).toBeInTheDocument()
    // Text filters apply live through search inputs that clear themselves,
    // so the form renders no buttons that would shift the layout.
    expect(within(filters).queryByRole('button')).toBeNull()

    expect(screen.getByLabelText('Category filters')).toBeInTheDocument()
    expect(screen.getByLabelText('Catalog table controls')).toBeInTheDocument()

    const tableRegion = screen.getByRole('region', {
      name: 'Scrollable public books table',
    })
    expect(
      within(tableRegion).getByRole('table', { name: 'Public books' }),
    ).toBeInTheDocument()

    // The bottom pager steps and jumps numbered pages; the rows-per-page
    // select lives in the top toolbar pagination.
    const pagination = screen.getByLabelText('Book pagination')
    expect(
      within(pagination).getByRole('button', { name: 'Previous page' }),
    ).toBeInTheDocument()
    expect(
      within(pagination).getByRole('button', { name: 'Next page' }),
    ).toBeInTheDocument()
    expect(within(pagination).queryByLabelText('Rows per page')).toBeNull()

    const topPagination = screen.getByLabelText('Book pagination top')
    expect(
      within(topPagination).getByRole('button', { name: 'Previous page' }),
    ).toBeInTheDocument()
    expect(
      within(topPagination).getByRole('button', { name: 'Next page' }),
    ).toBeInTheDocument()
    expect(
      within(topPagination).getByLabelText('Rows per page'),
    ).toBeInTheDocument()
  })

  it('renders a catalog-is-empty state without filters and no clear-filters action', async () => {
    mockCatalogFetch({ books: emptyBookPage })

    const { container } = renderCatalogRoute()

    expect(await screen.findByText('0 books')).toBeInTheDocument()
    expect(container.querySelector('.state-block[data-state="empty"]')).not.toBeNull()
    expect(screen.getByText('The catalog is empty')).toBeInTheDocument()
    expect(
      screen.getByText('There are no books in the catalog yet.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('No books match these filters.')).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Clear filters' }),
    ).not.toBeInTheDocument()
  })

  it('offers a clear-filters action in the empty state when filters are active', async () => {
    const fetchMock = mockCatalogFetch({
      books: (path) =>
        path.includes('title=') ? emptyBookPage : populatedBookPage,
    })

    const { router } = renderCatalogRoute(`${CATALOG_ROUTE_PATH}?title=nomatch`)

    expect(await screen.findByText('No catalog results')).toBeInTheDocument()
    expect(
      screen.getByText('No books match these filters.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('The catalog is empty')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

    await waitFor(() => {
      expect(router.state.location.search).toBe('')
    })
    expect(await screen.findByText('Effective Java')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      `${BOOKS_PATH}?page=0&size=10&sort=title%2CASC`,
      expect.objectContaining({
        credentials: 'same-origin',
        method: 'GET',
      }),
    )
  })

  it('keeps the chip search text out of the catalog URL', async () => {
    mockCatalogFetch()

    const { router } = renderCatalogRoute()

    expect(await screen.findByText('Effective Java')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Search categories'), {
      target: { value: 'arch' },
    })

    expect(router.state.location.search).toBe('')
  })

  it('recovers from a backend outage through the books error retry action', async () => {
    let backendHealthy = false

    mockCatalogFetch({
      books: () =>
        backendHealthy
          ? populatedBookPage
          : new Response(null, {
              status: 503,
              statusText: 'Service Unavailable',
            }),
    })

    renderCatalogRoute()

    expect(
      await screen.findByText(
        'The service cannot be reached right now. Check your connection or try again shortly.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Books could not be displayed'),
    ).toBeInTheDocument()

    backendHealthy = true
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Effective Java')).toBeInTheDocument()
  })

  it('keeps stale rows visible with a busy status while results refresh', async () => {
    let resolveSecondBooksRequest: ((response: Response) => void) | undefined
    let bookRequests = 0

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const path = String(input)

        if (path === CATEGORIES_PATH) {
          return Promise.resolve(Response.json(catalogCategories))
        }

        if (path.startsWith(BOOKS_PATH)) {
          bookRequests += 1

          if (bookRequests === 1) {
            return Promise.resolve(Response.json(paginatedBookPage))
          }

          return new Promise<Response>((resolve) => {
            resolveSecondBooksRequest = resolve
          })
        }

        return Promise.resolve(new Response(null, { status: 404 }))
      }),
    )

    renderCatalogRoute()

    expect(await screen.findByText('Refactoring')).toBeInTheDocument()

    const pager = screen.getByLabelText('Book pagination')

    fireEvent.click(within(pager).getByRole('button', { name: 'Next page' }))

    expect(await screen.findByText('Updating results…')).toBeInTheDocument()
    expect(screen.getByText('Refactoring')).toBeInTheDocument()
    // Busy paging keeps the buttons focusable with aria-disabled and guarded
    // clicks; a disabled attribute would drop keyboard focus mid-refetch.
    // Only the structural first/last boundaries hard-disable.
    expect(
      within(pager).getByRole('button', { name: 'Next page' }),
    ).not.toBeDisabled()
    expect(
      within(pager).getByRole('button', { name: 'Next page' }),
    ).toHaveAttribute('aria-disabled', 'true')
    expect(
      within(pager).getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled()
    expect(
      within(pager).getByRole('button', { name: 'Page 2' }),
    ).toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(within(pager).getByRole('button', { name: 'Page 3' }))
    expect(bookRequests).toBe(2)
    expect(
      screen.getByRole('region', { name: 'Scrollable public books table' }),
    ).toHaveAttribute('aria-busy', 'true')

    await act(async () => {
      resolveSecondBooksRequest?.(
        Response.json({ ...paginatedBookPage, first: false, number: 1 }),
      )
    })

    await waitFor(() => {
      expect(screen.queryByText('Updating results…')).not.toBeInTheDocument()
    })
    expect(
      screen.getByRole('region', { name: 'Scrollable public books table' }),
    ).not.toHaveAttribute('aria-busy')
    expect(
      within(screen.getByLabelText('Book pagination')).getByRole('button', {
        name: 'Next page',
      }),
    ).not.toHaveAttribute('aria-disabled')
  })

  it('applies text and repeated category filters live without a submit', async () => {
    const fetchMock = mockCatalogFetch({
      books: (path) =>
        path.includes('title=clean') ? filteredBookPage : populatedBookPage,
    })

    renderCatalogRoute()

    const titleInput = screen.getByLabelText('Title')
    const authorInput = screen.getByLabelText('Author')

    await screen.findByText('Effective Java')
    expect(
      screen.getByRole('button', {
        name: 'Sort by Title; currently ascending. Activate to sort descending.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Sort by Publication year; currently not sorted. Activate to sort ascending.',
      }),
    ).toBeInTheDocument()
    fireEvent.change(titleInput, { target: { value: 'clean' } })
    fireEvent.change(authorInput, { target: { value: 'martin' } })
    fireEvent.click(screen.getByRole('button', { name: 'Java' }))
    fireEvent.click(screen.getByRole('button', { name: 'Architecture' }))

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
    expect(screen.getByText('Showing 1-1 of 1 book')).toBeInTheDocument()
  })

  it('requests stepped and jumped pages with Spring pagination parameters', async () => {
    const fetchMock = mockCatalogFetch({ books: paginatedBookPage })

    renderCatalogRoute()

    expect(await screen.findByText('Refactoring')).toBeInTheDocument()
    const pager = screen.getByLabelText('Book pagination')
    const topPager = screen.getByLabelText('Book pagination top')
    expect(
      within(pager).getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled()
    expect(
      within(topPager).getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled()

    fireEvent.click(within(pager).getByRole('button', { name: 'Next page' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${BOOKS_PATH}?page=1&size=10&sort=title%2CASC`,
        expect.objectContaining({
          credentials: 'same-origin',
          method: 'GET',
        }),
      )
    })

    // Numbered pages jump directly instead of stepping one page at a time.
    fireEvent.click(
      within(screen.getByLabelText('Book pagination')).getByRole('button', {
        name: 'Page 3',
      }),
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${BOOKS_PATH}?page=2&size=10&sort=title%2CASC`,
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
    const pager = screen.getByLabelText('Book pagination')
    expect(
      within(pager).getByRole('button', { name: 'Previous page' }),
    ).not.toBeDisabled()
    expect(
      within(pager).getByRole('button', { name: 'Next page' }),
    ).toBeDisabled()
    expect(within(pager).getByRole('button', { name: 'Page 3' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    const topPager = screen.getByLabelText('Book pagination top')
    expect(
      within(topPager).getByRole('button', { name: 'Previous page' }),
    ).not.toBeDisabled()
    expect(
      within(topPager).getByRole('button', { name: 'Next page' }),
    ).toBeDisabled()
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

    const { router } = renderCatalogRoute(
      `${CATALOG_ROUTE_PATH}?title=%20clean%20&category=Java&category=Java&category=&page=-2&size=999&sort=unknown,DESC`,
    )

    await screen.findByDisplayValue('clean')

    await waitFor(() => {
      expect(router.state.location.search).toBe('?title=clean&category=Java')
    })
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

    fireEvent.click(screen.getByRole('button', { name: /Publication year/ }))

    await waitFor(() => {
      expect(router.state.location.search).toBe(
        '?title=clean&category=Java&sort=publicationYear%2CASC',
      )
    })
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${BOOKS_PATH}?title=clean&category=Java&page=0&size=10&sort=publicationYear%2CASC`,
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
    expect(
      screen.getByRole('button', {
        name: 'Sort by Title; currently ascending. Activate to sort descending.',
      }),
    ).toBeInTheDocument()

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
