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
  ADMIN_USERS_PATH,
  getAdminUserRolesPath,
  type AdminUserAccount,
} from '../api/adminUsers'
import type { SessionResponse } from '../api/session'
import {
  ADMIN_USER_DETAIL_ROUTE_PATH,
  ADMIN_USERS_ROUTE_PATH,
  AdminUsersPage,
} from './AdminUsersPage'

describe('AdminUsersPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    clearDocumentCookies()
  })

  it('loads the admin user list without unsupported query parameters', async () => {
    const fetchMock = mockAdminUsersFetch()

    renderAdminUsers()

    expect(await screen.findByText('Admin User')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(ACCOUNT_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
    expect(fetchMock).toHaveBeenCalledWith(ADMIN_USERS_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input).startsWith(`${ADMIN_USERS_PATH}?`),
      ),
    ).toBe(false)
    expect(screen.getByRole('table', { name: 'Admin users' })).toBeInTheDocument()
    expect(screen.getAllByText('USER').length).toBeGreaterThan(0)
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })

  it('keeps authenticated non-admin users away from admin user controls', async () => {
    const fetchMock = mockAdminUsersFetch({
      account: createAccount({
        roles: ['USER'],
      }),
    })

    renderAdminUsers()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Admin access is required for user management.',
    )
    expect(screen.queryByRole('table', { name: 'Admin users' })).not.toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([input]) => String(input) === ADMIN_USERS_PATH),
    ).toBe(false)
  })

  it('renders localized backend access failures from the admin users endpoint', async () => {
    mockAdminUsersFetch({
      users: problemResponse(403, 'Nie masz dostepu do uzytkownikow.'),
    })

    renderAdminUsers()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Nie masz dostepu do uzytkownikow.',
    )
  })

  it('renders an empty user list state', async () => {
    mockAdminUsersFetch({
      users: [],
    })

    renderAdminUsers()

    expect(await screen.findByText('No users are available.')).toBeInTheDocument()
    expect(
      screen.getByText('Select a user to review roles and provenance.'),
    ).toBeInTheDocument()
  })

  it('selects a user and renders detail with role-grant provenance', async () => {
    mockAdminUsersFetch()

    renderAdminUsers()

    fireEvent.click(await screen.findByRole('button', { name: 'View Admin User' }))

    expect(await screen.findByRole('heading', { name: 'User detail' })).toBeInTheDocument()
    const details = screen.getByRole('complementary', { name: 'User detail' })

    expect(await within(details).findByText('admin@example.test')).toBeInTheDocument()
    expect(within(details).getByText('ADMIN_MANAGED')).toBeInTheDocument()
    expect(within(details).getByText('owner-admin (ID 1)')).toBeInTheDocument()
    expect(within(details).getByText('Initial administrator')).toBeInTheDocument()
  })

  it('loads a direct detail route from the list data', async () => {
    const fetchMock = mockAdminUsersFetch()

    renderAdminUsers(`${ADMIN_USERS_ROUTE_PATH}/8`)

    const details = await screen.findByRole('complementary', {
      name: 'User detail',
    })

    expect(await within(details).findByText('Reviewer User')).toBeInTheDocument()
    expect(within(details).getByText('reviewer@example.test')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(ADMIN_USERS_PATH, expect.any(Object))
    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input).startsWith(`${ADMIN_USERS_PATH}/8`),
      ),
    ).toBe(false)
  })

  it('renders a frontend not-found state for missing detail ids', async () => {
    const fetchMock = mockAdminUsersFetch()

    renderAdminUsers(`${ADMIN_USERS_ROUTE_PATH}/999`)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No user was found for id 999.',
    )
    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input).startsWith(`${ADMIN_USERS_PATH}/999`),
      ),
    ).toBe(false)
  })

  it('requires an operator reason before replacing roles', async () => {
    const fetchMock = mockAdminUsersFetch()

    renderAdminUsers()

    fireEvent.click(await screen.findByRole('button', { name: 'View Reviewer User' }))
    const form = await screen.findByRole('form', {
      name: 'Replace roles for Reviewer User',
    })

    fireEvent.click(within(form).getByLabelText('ADMIN'))

    expect(within(form).getByRole('button', { name: 'Save roles' })).toBeDisabled()
    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input).endsWith('/roles'),
      ),
    ).toBe(false)
  })

  it('submits replacement roles with USER included and patches row/detail from the backend response', async () => {
    document.cookie = 'XSRF-TOKEN=token%201'
    const fetchMock = mockAdminUsersFetch({
      replaceRolesResponse: createAdminUser({
        id: 8,
        displayName: 'Reviewer User',
        email: 'reviewer@example.test',
        login: 'reviewer',
        roles: ['USER', 'ADMIN'],
        roleGrants: [
          createRoleGrant({
            role: 'ADMIN',
            grantedByLogin: 'owner-admin',
            reason: 'Temporary support rotation',
          }),
        ],
        updatedAt: '2026-06-07T10:00:00Z',
      }),
    })

    renderAdminUsers(`${ADMIN_USERS_ROUTE_PATH}/8`)

    const form = await screen.findByRole('form', {
      name: 'Replace roles for Reviewer User',
    })
    fireEvent.click(within(form).getByLabelText('ADMIN'))
    fireEvent.change(within(form).getByLabelText('Operator reason'), {
      target: { value: ' Temporary support rotation ' },
    })
    fireEvent.click(within(form).getByRole('button', { name: 'Save roles' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(getAdminUserRolesPath(8), {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': 'token 1',
        },
        body: JSON.stringify({
          roles: ['USER', 'ADMIN'],
          reason: 'Temporary support rotation',
        }),
      })
    })
    expect(await screen.findByText('User roles updated.')).toBeInTheDocument()
    expect(screen.getAllByText('ADMIN').length).toBeGreaterThan(0)
    expect(screen.getByText('Temporary support rotation')).toBeInTheDocument()
  })

  it('keeps previous user state visible for validation and missing-CSRF failures', async () => {
    const fetchMock = mockAdminUsersFetch({
      replaceRolesResponse: problemResponse(
        403,
        'Token CSRF jest wymagany.',
      ),
    })

    renderAdminUsers(`${ADMIN_USERS_ROUTE_PATH}/8`)

    const form = await screen.findByRole('form', {
      name: 'Replace roles for Reviewer User',
    })
    fireEvent.click(within(form).getByLabelText('ADMIN'))
    fireEvent.change(within(form).getByLabelText('Operator reason'), {
      target: { value: 'Need admin access' },
    })
    fireEvent.click(within(form).getByRole('button', { name: 'Save roles' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(getAdminUserRolesPath(8), {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roles: ['USER', 'ADMIN'],
          reason: 'Need admin access',
        }),
      })
    })
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Token CSRF jest wymagany.',
    )
    expect(screen.getAllByText('Reviewer User').length).toBeGreaterThan(0)
    expect(screen.queryByText('User roles updated.')).not.toBeInTheDocument()
  })
})

function renderAdminUsers(
  initialEntry: string = ADMIN_USERS_ROUTE_PATH,
  session = createSession(),
) {
  const router = createMemoryRouter(
    [
      {
        path: ADMIN_USERS_ROUTE_PATH,
        element: <AdminUsersPage session={session} />,
      },
      {
        path: ADMIN_USER_DETAIL_ROUTE_PATH,
        element: <AdminUsersPage session={session} />,
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

function mockAdminUsersFetch({
  account = createAccount(),
  replaceRolesResponse = createAdminUser({
    id: 8,
    displayName: 'Reviewer User',
    email: 'reviewer@example.test',
    login: 'reviewer',
    roles: ['USER', 'ADMIN'],
  }),
  users = createUsers(),
}: {
  account?: UserAccount | Response
  replaceRolesResponse?: AdminUserAccount | Response
  users?: AdminUserAccount[] | Response
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

    if (path === ADMIN_USERS_PATH && method === 'GET') {
      return Promise.resolve(toResponse(users))
    }

    if (path.endsWith('/roles') && method === 'PUT') {
      return Promise.resolve(toResponse(replaceRolesResponse))
    }

    return Promise.resolve(new Response(null, { status: 404 }))
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

function createUsers(): AdminUserAccount[] {
  return [
    createAdminUser({
      id: 7,
      displayName: 'Admin User',
      email: 'admin@example.test',
      login: 'admin-user',
      roles: ['USER', 'ADMIN'],
      roleGrants: [
        createRoleGrant({
          role: 'USER',
          source: 'AUTHENTICATED_LOGIN',
          reason: undefined,
        }),
        createRoleGrant({
          role: 'ADMIN',
          source: 'ADMIN_MANAGED',
          grantedByUserId: 1,
          grantedByLogin: 'owner-admin',
          reason: 'Initial administrator',
        }),
      ],
    }),
    createAdminUser({
      id: 8,
      displayName: 'Reviewer User',
      email: 'reviewer@example.test',
      login: 'reviewer',
      roles: ['USER'],
      roleGrants: [
        createRoleGrant({
          role: 'USER',
          source: 'AUTHENTICATED_LOGIN',
          reason: undefined,
        }),
      ],
    }),
  ]
}

function createAdminUser(overrides: AdminUserAccount = {}): AdminUserAccount {
  return {
    id: 7,
    provider: 'github',
    login: 'admin-user',
    displayName: 'Admin User',
    email: 'admin@example.test',
    preferredLanguage: 'en',
    roles: ['USER'],
    roleGrants: [createRoleGrant()],
    lastLoginAt: '2026-06-06T22:10:00Z',
    createdAt: '2026-05-11T12:00:00Z',
    updatedAt: '2026-06-06T22:10:00Z',
    ...overrides,
  }
}

function createRoleGrant(
  overrides: NonNullable<AdminUserAccount['roleGrants']>[number] = {},
) {
  return {
    role: 'USER',
    source: 'AUTHENTICATED_LOGIN',
    grantedAt: '2026-06-07T09:00:00Z',
    grantedByUserId: undefined,
    grantedByLogin: undefined,
    reason: 'Authenticated login',
    ...overrides,
  } satisfies NonNullable<AdminUserAccount['roleGrants']>[number]
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

function problemResponse(status: number, message: string) {
  return Response.json(
    {
      status,
      messageKey: 'error.admin.users',
      message,
      language: 'pl',
    },
    {
      status,
      statusText: status === 403 ? 'Forbidden' : 'Error',
      headers: {
        'Content-Type': 'application/problem+json',
      },
    },
  )
}

function toResponse(
  value: AdminUserAccount[] | AdminUserAccount | Response | UserAccount,
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
