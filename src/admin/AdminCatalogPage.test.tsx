import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  ACCOUNT_PATH,
  type UserAccount,
} from '../api/account'
import {
  BOOKS_PATH,
  CATEGORIES_PATH,
  getBookPath,
  type Book,
  type BookPage,
  type Category,
} from '../api/catalog'
import type { SessionResponse } from '../api/session'
import {
  ADMIN_CATALOG_ROUTE_PATH,
  AdminCatalogPage,
} from './AdminCatalogPage'

describe('AdminCatalogPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    clearDocumentCookies()
  })

  it('loads admin books with Spring pagination and repeated query filters', async () => {
    const fetchMock = mockAdminFetch()

    renderAdminCatalog(
      `${ADMIN_CATALOG_ROUTE_PATH}?title=clean&author=martin&isbn=978&category=Java&category=Architecture&page=2&size=20&sort=publicationYear,DESC&sort=title,ASC`,
    )

    expect(await screen.findByText('Effective Java')).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Sort by Publication year; currently descending. Activate to sort ascending.',
      }),
    ).toBeInTheDocument()
    const querySummary = screen.getByLabelText('Active admin book query')
    expect(
      within(querySummary).getByText(
        'Title: clean; Author: martin; ISBN: 978; Categories: Java, Architecture',
      ),
    ).toBeInTheDocument()
    expect(within(querySummary).getByText('Newest first')).toBeInTheDocument()
    expect(within(querySummary).getByText('No book selected')).toBeInTheDocument()
    expect(within(querySummary).getByText('2 visible')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(ACCOUNT_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
    expect(fetchMock).toHaveBeenCalledWith(CATEGORIES_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Accept-Language': expect.stringContaining('en'),
      },
    })
    expect(fetchMock).toHaveBeenCalledWith(
      `${BOOKS_PATH}?title=clean&author=martin&isbn=978&category=Java&category=Architecture&page=2&size=20&sort=publicationYear%2CDESC&sort=title%2CASC`,
      expect.objectContaining({
        credentials: 'same-origin',
        method: 'GET',
      }),
    )
  })

  it('derives admin pagination button state from page numbers when flags are absent', async () => {
    mockAdminFetch({
      books: createBookPage({
        first: undefined,
        last: undefined,
        number: 2,
        totalPages: 3,
      }),
    })

    renderAdminCatalog(`${ADMIN_CATALOG_ROUTE_PATH}?page=2`)

    expect(await screen.findByText('Effective Java')).toBeInTheDocument()
    expect(screen.getAllByText(/Page 3\s+of 3/)).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Previous' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('canonicalizes invalid admin catalog query values before requesting books', async () => {
    const fetchMock = mockAdminFetch()

    const { router } = renderAdminCatalog(
      `${ADMIN_CATALOG_ROUTE_PATH}?title=%20clean%20&category=Java&category=Java&category=&page=-2&size=999&sort=unknown,DESC`,
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

  it('keeps long-title book row actions compact while preserving specific names', async () => {
    mockAdminFetch({
      books: createBookPage({
        content: [
          createBook({
            id: 99,
            title: 'Manual Regression Book no-tag',
            categories: [],
          }),
        ],
        numberOfElements: 1,
        totalElements: 1,
      }),
    })

    renderAdminCatalog()

    expect(
      await screen.findByRole('form', { name: 'Admin book filters' }),
    ).toBeInTheDocument()
    const titleCell = await screen.findByRole('rowheader', {
      name: 'Manual Regression Book no-tag',
    })
    const row = titleCell.closest('tr')
    expect(row).not.toBeNull()
    const tableRegion = screen.getByRole('region', {
      name: 'Scrollable admin books table',
    })
    expect(
      within(tableRegion).getByRole('table', { name: 'Admin books' }),
    ).toBeInTheDocument()

    const actionGroup = within(row as HTMLTableRowElement).getByRole('group', {
      name: 'Actions for Manual Regression Book no-tag',
    })
    const editButton = within(actionGroup).getByRole('button', {
      name: 'Edit Manual Regression Book no-tag',
    })
    const deleteButton = within(actionGroup).getByRole('button', {
      name: 'Delete Manual Regression Book no-tag',
    })

    expect(editButton).toHaveTextContent(/^Edit$/)
    expect(deleteButton).toHaveTextContent(/^Delete$/)
  })

  it('keeps authenticated non-admin users away from mutation controls', async () => {
    const fetchMock = mockAdminFetch({
      account: createAccount({
        roles: ['USER'],
      }),
    })

    const { container } = renderAdminCatalog()

    expect(await screen.findByText('Admin role required')).toBeInTheDocument()
    expect(container.querySelector('.state-block[data-state="error"]')).not.toBeNull()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Admin access is required for catalog management.',
    )
    expect(
      screen.queryByRole('button', { name: 'Create book' }),
    ).not.toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([input]) => String(input).startsWith(BOOKS_PATH)),
    ).toBe(false)
  })

  it('creates books with selected categories and shows success', async () => {
    document.cookie = 'XSRF-TOKEN=token%201'
    const fetchMock = mockAdminFetch({
      createBookResponse: createBook({
        id: 3,
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        isbn: '9780134494166',
        publicationYear: 2017,
        categories: [{ id: 2, name: 'Architecture' }],
      }),
    })

    renderAdminCatalog()

    await screen.findByText('Effective Java')
    const form = screen.getByRole('form', { name: 'Create book' })

    fireEvent.change(within(form).getByLabelText('Book title'), {
      target: { value: 'Clean Architecture' },
    })
    fireEvent.change(within(form).getByLabelText('Book author'), {
      target: { value: 'Robert C. Martin' },
    })
    fireEvent.change(within(form).getByLabelText('Book ISBN'), {
      target: { value: '9780134494166' },
    })
    fireEvent.change(within(form).getByLabelText('Publication year'), {
      target: { value: '2017' },
    })
    fireEvent.click(within(form).getByLabelText('Architecture'))
    fireEvent.submit(form)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(BOOKS_PATH, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': 'token 1',
        },
        body: JSON.stringify({
          author: 'Robert C. Martin',
          categories: ['Architecture'],
          isbn: '9780134494166',
          publicationYear: 2017,
          title: 'Clean Architecture',
        }),
      })
    })
    expect(await screen.findByText('Book created.')).toHaveAttribute(
      'data-state',
      'success',
    )
  })

  it('keeps book create input values after localized validation failures', async () => {
    document.cookie = 'XSRF-TOKEN=token'
    mockAdminFetch({
      createBookResponse: Response.json(
        {
          status: 400,
          messageKey: 'error.book.title.required',
          message: 'Tytul ksiazki jest wymagany.',
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
    })

    renderAdminCatalog()

    await screen.findByText('Effective Java')
    const form = screen.getByRole('form', { name: 'Create book' })

    fireEvent.change(within(form).getByLabelText('Book title'), {
      target: { value: 'Bad payload' },
    })
    fireEvent.change(within(form).getByLabelText('Book author'), {
      target: { value: 'Author' },
    })
    fireEvent.change(within(form).getByLabelText('Book ISBN'), {
      target: { value: 'bad-isbn' },
    })
    fireEvent.change(within(form).getByLabelText('Publication year'), {
      target: { value: '2026' },
    })
    fireEvent.submit(form)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tytul ksiazki jest wymagany.',
    )
    expect(within(form).getByLabelText('Book title')).toHaveValue('Bad payload')
  })

  it('updates books with the loaded version and replaces the visible row', async () => {
    document.cookie = 'XSRF-TOKEN=token'
    const fetchMock = mockAdminFetch({
      bookById: createBook({
        id: 1,
        version: 3,
        title: 'Effective Java',
      }),
      updateBookResponse: createBook({
        id: 1,
        version: 4,
        title: 'Effective Java, Third Edition',
      }),
    })

    renderAdminCatalog()

    fireEvent.click(await screen.findByRole('button', { name: 'Edit Effective Java' }))

    const form = await screen.findByRole('form', { name: 'Edit book' })
    fireEvent.change(within(form).getByLabelText('Book title'), {
      target: { value: 'Effective Java, Third Edition' },
    })
    expect(within(form).getByText('Updating loaded version 3')).toBeInTheDocument()
    expect(screen.getByText('Editing book 1, version 3')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Edit Effective Java' }),
    ).toHaveTextContent(/^Editing$/)
    fireEvent.click(within(form).getByRole('button', { name: 'Save book' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(getBookPath(1), {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': 'token',
        },
        body: JSON.stringify({
          author: 'Joshua Bloch',
          categories: ['Java'],
          publicationYear: 2018,
          title: 'Effective Java, Third Edition',
          version: 3,
        }),
      })
    })
    expect(
      await screen.findByText('Effective Java, Third Edition'),
    ).toBeInTheDocument()
    expect(screen.getByText('Book updated.')).toBeInTheDocument()
  })

  it('does not open book editing without the backend current version', async () => {
    const fetchMock = mockAdminFetch({
      bookById: createBook({
        id: 1,
        version: undefined,
      }),
    })

    renderAdminCatalog()

    fireEvent.click(await screen.findByRole('button', { name: 'Edit Effective Java' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Book cannot be edited until the backend returns its current version.',
    )
    expect(screen.getByRole('form', { name: 'Create book' })).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(
        ([input, init]) =>
          String(input) === getBookPath(1) && init?.method === 'PUT',
      ),
    ).toBe(false)
  })

  it('keeps stale-version update failures open with a reload path', async () => {
    document.cookie = 'XSRF-TOKEN=token'
    mockAdminFetch({
      bookById: createBook({
        id: 1,
        version: 3,
      }),
      updateBookResponse: Response.json(
        {
          status: 409,
          messageKey: 'error.book.version_stale',
          message: 'Ksiazka zostala zmieniona przez innego uzytkownika.',
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
    })

    renderAdminCatalog()

    fireEvent.click(await screen.findByRole('button', { name: 'Edit Effective Java' }))

    const form = await screen.findByRole('form', { name: 'Edit book' })
    fireEvent.change(within(form).getByLabelText('Book title'), {
      target: { value: 'Effective Java Reloaded' },
    })
    fireEvent.click(within(form).getByRole('button', { name: 'Save book' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ksiazka zostala zmieniona przez innego uzytkownika.',
    )
    expect(within(form).getByLabelText('Book title')).toHaveValue(
      'Effective Java Reloaded',
    )
    expect(within(form).getByRole('button', { name: 'Reload book' })).toBeInTheDocument()
  })

  it('confirms and removes deleted books from the current results', async () => {
    document.cookie = 'XSRF-TOKEN=token'
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const fetchMock = mockAdminFetch()

    renderAdminCatalog()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete Effective Java' }),
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(getBookPath(1), {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'X-XSRF-TOKEN': 'token',
        },
        body: undefined,
      })
    })
    expect(confirmSpy).toHaveBeenCalledWith('Delete Effective Java?')
    expect(screen.queryByText('Effective Java')).not.toBeInTheDocument()
    expect(screen.getByText('Book deleted.')).toBeInTheDocument()
  })

  it('keeps books visible after localized delete failures', async () => {
    document.cookie = 'XSRF-TOKEN=token'
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockAdminFetch({
      deleteBookResponse: Response.json(
        {
          status: 403,
          messageKey: 'error.access.denied',
          message: 'Nie masz uprawnien do usuniecia ksiazki.',
          language: 'pl',
        },
        {
          status: 403,
          statusText: 'Forbidden',
          headers: {
            'Content-Type': 'application/problem+json',
          },
        },
      ),
    })

    renderAdminCatalog()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete Effective Java' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Nie masz uprawnien do usuniecia ksiazki.',
    )
    expect(screen.getByText('Effective Java')).toBeInTheDocument()
  })

  it('creates, updates, and deletes categories successfully', async () => {
    document.cookie = 'XSRF-TOKEN=token'
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockAdminFetch({
      createCategoryResponse: {
        id: 3,
        name: 'Security',
      },
      updateCategoryResponse: {
        id: 3,
        name: 'Application Security',
      },
    })

    renderAdminCatalog()

    await screen.findByText('Effective Java')
    fireEvent.click(screen.getByRole('tab', { name: 'Categories' }))
    const form = screen.getByRole('form', { name: 'Create category' })

    fireEvent.change(within(form).getByLabelText('Category name'), {
      target: { value: 'Security' },
    })
    fireEvent.submit(form)

    expect(await screen.findByText('Category created.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Edit Security' }))
    fireEvent.change(screen.getByLabelText('Name for Security'), {
      target: { value: 'Application Security' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save category' }))

    expect(await screen.findByText('Category updated.')).toBeInTheDocument()
    expect(screen.getAllByText('Application Security').length).toBeGreaterThan(0)

    fireEvent.click(
      screen.getByRole('button', { name: 'Delete Application Security' }),
    )

    expect(await screen.findByText('Category deleted.')).toBeInTheDocument()
    expect(screen.queryAllByText('Application Security')).toHaveLength(0)
  })

  it('keeps categories visible after category-in-use delete failures', async () => {
    document.cookie = 'XSRF-TOKEN=token'
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockAdminFetch({
      deleteCategoryResponse: Response.json(
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
    })

    renderAdminCatalog()

    fireEvent.click(await screen.findByRole('tab', { name: 'Categories' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Java' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Kategoria jest uzywana przez ksiazki.',
    )
    expect(screen.getAllByText('Java').length).toBeGreaterThan(0)
  })

  it('lets the backend report missing CSRF write failures', async () => {
    const fetchMock = mockAdminFetch({
      createCategoryResponse: Response.json(
        {
          status: 403,
          messageKey: 'error.csrf.invalid',
          message: 'Token CSRF jest wymagany.',
          language: 'pl',
        },
        {
          status: 403,
          statusText: 'Forbidden',
          headers: {
            'Content-Type': 'application/problem+json',
          },
        },
      ),
    })

    renderAdminCatalog()

    await screen.findByText('Effective Java')
    fireEvent.click(screen.getByRole('tab', { name: 'Categories' }))
    const form = screen.getByRole('form', { name: 'Create category' })

    fireEvent.change(within(form).getByLabelText('Category name'), {
      target: { value: 'Security' },
    })
    fireEvent.submit(form)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(CATEGORIES_PATH, {
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
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Token CSRF jest wymagany.',
    )
  })
})

function renderAdminCatalog(
  initialEntry: string = ADMIN_CATALOG_ROUTE_PATH,
  session = createSession(),
) {
  const router = createMemoryRouter(
    [
      {
        path: ADMIN_CATALOG_ROUTE_PATH,
        element: <AdminCatalogPage session={session} />,
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

function mockAdminFetch({
  account = createAccount(),
  bookById = createBook(),
  books = createBookPage(),
  categories = catalogCategories,
  createBookResponse = createBook({
    id: 3,
    title: 'Created Book',
  }),
  createCategoryResponse = {
    id: 3,
    name: 'Created Category',
  },
  deleteBookResponse = new Response(null, { status: 200 }),
  deleteCategoryResponse = new Response(null, { status: 204 }),
  updateBookResponse = createBook({
    version: 4,
    title: 'Updated Book',
  }),
  updateCategoryResponse = {
    id: 1,
    name: 'Updated Category',
  },
}: {
  account?: UserAccount | Response
  bookById?: Book | Response | ((id: number) => Book | Response)
  books?: BookPage | ((path: string) => BookPage | Response)
  categories?: Category[] | Response
  createBookResponse?: Book | Response
  createCategoryResponse?: Category | Response
  deleteBookResponse?: Response
  deleteCategoryResponse?: Response
  updateBookResponse?: Book | Response
  updateCategoryResponse?: Category | Response
} = {}) {
  const fetchMock = vi.fn().mockImplementation((
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    const path = String(input)
    const method = init?.method ?? 'GET'

    if (path === ACCOUNT_PATH) {
      return Promise.resolve(toResponse(account))
    }

    if (path === CATEGORIES_PATH && method === 'GET') {
      return Promise.resolve(toResponse(categories))
    }

    if (path === CATEGORIES_PATH && method === 'POST') {
      return Promise.resolve(toResponse(createCategoryResponse))
    }

    if (path.startsWith(`${CATEGORIES_PATH}/`) && method === 'PUT') {
      return Promise.resolve(toResponse(updateCategoryResponse))
    }

    if (path.startsWith(`${CATEGORIES_PATH}/`) && method === 'DELETE') {
      return Promise.resolve(deleteCategoryResponse)
    }

    if (path.startsWith(`${BOOKS_PATH}/`) && method === 'GET') {
      const id = Number(path.slice(`${BOOKS_PATH}/`.length))

      return Promise.resolve(toResponse(resolveValue(bookById, id)))
    }

    if (path.startsWith(`${BOOKS_PATH}/`) && method === 'PUT') {
      return Promise.resolve(toResponse(updateBookResponse))
    }

    if (path.startsWith(`${BOOKS_PATH}/`) && method === 'DELETE') {
      return Promise.resolve(deleteBookResponse)
    }

    if (path === BOOKS_PATH && method === 'POST') {
      return Promise.resolve(toResponse(createBookResponse))
    }

    if (path.startsWith(BOOKS_PATH) && method === 'GET') {
      return Promise.resolve(toResponse(resolveValue(books, path)))
    }

    return Promise.resolve(new Response(null, { status: 404 }))
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

const catalogCategories: Category[] = [
  { id: 1, name: 'Java' },
  { id: 2, name: 'Architecture' },
]

function createBook(overrides: Book = {}): Book {
  return {
    id: 1,
    version: 3,
    title: 'Effective Java',
    author: 'Joshua Bloch',
    isbn: '9780134685991',
    publicationYear: 2018,
    categories: [{ id: 1, name: 'Java' }],
    ...overrides,
  }
}

function createBookPage(overrides: BookPage = {}): BookPage {
  return {
    content: [
      createBook(),
      createBook({
        id: 2,
        version: 1,
        title: 'Refactoring',
        author: 'Martin Fowler',
        isbn: '9780134757599',
        publicationYear: 2018,
        categories: [{ id: 2, name: 'Architecture' }],
      }),
    ],
    first: true,
    last: true,
    number: 0,
    numberOfElements: 2,
    size: 10,
    totalElements: 2,
    totalPages: 1,
    ...overrides,
  }
}

function createAccount(overrides: UserAccount = {}): UserAccount {
  return {
    id: 42,
    provider: 'github',
    login: 'admin-user',
    displayName: 'Admin User',
    email: 'admin@example.test',
    preferredLanguage: 'en',
    roles: ['USER', 'ADMIN'],
    lastLoginAt: '2026-06-06T22:10:00Z',
    createdAt: '2026-05-11T12:00:00Z',
    updatedAt: '2026-06-06T22:10:00Z',
    ...overrides,
  }
}

function createSession(overrides: SessionResponse = {}): SessionResponse {
  return {
    authenticated: true,
    accountPath: ACCOUNT_PATH,
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

function resolveValue<T, TArgs extends unknown[]>(
  value: T | ((...args: TArgs) => T),
  ...args: TArgs
) {
  return typeof value === 'function'
    ? (value as (...args: TArgs) => T)(...args)
    : value
}

function toResponse(
  value: Book | BookPage | Category | Category[] | Response | UserAccount,
) {
  return value instanceof Response ? value : Response.json(value)
}

function clearDocumentCookies() {
  document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0]?.trim())
    .filter(Boolean)
    .forEach((cookieName) => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    })
}
