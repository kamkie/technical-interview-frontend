import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BOOKS_PATH, CATEGORIES_PATH, type BookPage } from '../api/catalog'
import { CatalogPanel } from './CatalogPanel'

describe('CatalogPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads public categories and books with contract-shaped query parameters', async () => {
    const fetchMock = mockCatalogFetch()

    render(<CatalogPanel />)

    expect(await screen.findByText('Effective Java')).toBeInTheDocument()
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

  it('submits text and repeated category filters', async () => {
    const fetchMock = mockCatalogFetch()

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
  })

  it('renders localized backend error messages', async () => {
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
})

function mockCatalogFetch() {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const path = String(input)

    if (path === CATEGORIES_PATH) {
      return Promise.resolve(
        Response.json([
          { id: 1, name: 'Java' },
          { id: 2, name: 'Architecture' },
        ]),
      )
    }

    if (path.startsWith(BOOKS_PATH)) {
      return Promise.resolve(Response.json(createBookPage()))
    }

    return Promise.resolve(new Response(null, { status: 404 }))
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

function createBookPage(): BookPage {
  return {
    content: [
      {
        id: 1,
        title: 'Effective Java',
        author: 'Joshua Bloch',
        isbn: '9780134685991',
        publicationYear: 2018,
        categories: [{ id: 1, name: 'Java' }],
      },
      {
        id: 2,
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        isbn: '9780134494166',
        publicationYear: 2017,
        categories: [{ id: 2, name: 'Architecture' }],
      },
    ],
    first: true,
    last: true,
    number: 0,
    numberOfElements: 2,
    size: 10,
    totalElements: 2,
    totalPages: 1,
  }
}
