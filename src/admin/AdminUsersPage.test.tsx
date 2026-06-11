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
  getAdminUserStatusPath,
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
    expect(screen.getByText('Showing 1-2 of 2 users')).toBeInTheDocument()
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
    const tableRegion = screen.getByRole('region', {
      name: 'Scrollable admin users table',
    })
    expect(
      within(tableRegion).getByRole('table', { name: 'Admin users' }),
    ).toBeInTheDocument()
    expect(
      within(tableRegion).getByRole('button', {
        name: 'Details for Admin User',
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('USER').length).toBeGreaterThan(0)
    expect(screen.getAllByText('ADMIN').length).toBeGreaterThan(0)
  })

  it('filters, sorts, and paginates the user list client-side', async () => {
    const manyUsers = Array.from({ length: 12 }, (_, index) =>
      createAdminUser({
        id: 100 + index,
        displayName: `Listed User ${String(index + 1).padStart(2, '0')}`,
        email: `listed-${String(index + 1).padStart(2, '0')}@example.test`,
        login: `listed-${String(index + 1).padStart(2, '0')}`,
        roles: index === 0 ? ['USER', 'ADMIN'] : ['USER'],
      }),
    )
    const fetchMock = mockAdminUsersFetch({ users: manyUsers })
    const { router } = renderAdminUsers()

    expect(await screen.findByText('Listed User 01')).toBeInTheDocument()
    expect(screen.getByText('Showing 1-10 of 12 users')).toBeInTheDocument()
    expect(screen.queryByText('Listed User 11')).not.toBeInTheDocument()
    // The contract has no paging parameters, so one fetch serves the list and
    // paging, filtering, and sorting happen client-side.
    expect(
      fetchMock.mock.calls.filter(
        ([input]) => String(input) === ADMIN_USERS_PATH,
      ),
    ).toHaveLength(1)

    const pager = screen.getByLabelText('Admin user pagination')
    fireEvent.click(within(pager).getByRole('button', { name: 'Page 2' }))

    expect(await screen.findByText('Listed User 11')).toBeInTheDocument()
    expect(screen.getByText('Showing 11-12 of 12 users')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?page=1')

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Sort by User; currently ascending. Activate to sort descending.',
      }),
    )

    expect(await screen.findByText('Listed User 12')).toBeInTheDocument()
    expect(screen.getByText('Showing 1-10 of 12 users')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?sort=user%2CDESC')

    fireEvent.change(screen.getByLabelText('Role'), {
      target: { value: 'ADMIN' },
    })

    expect(await screen.findByText('Showing 1-1 of 1 user')).toBeInTheDocument()
    expect(screen.getByText('Listed User 01')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Role'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'listed-07' },
    })

    expect(
      await screen.findByText('Showing 1-1 of 1 user'),
    ).toBeInTheDocument()
    expect(screen.getByText('Listed User 07')).toBeInTheDocument()
    expect(screen.queryByText('Listed User 12')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(router.state.location.search).toBe('?q=listed-07&sort=user%2CDESC')
    })
  })

  it('keeps authenticated non-admin users away from admin user controls', async () => {
    const fetchMock = mockAdminUsersFetch({
      account: createAccount({
        roles: ['USER'],
      }),
    })

    renderAdminUsers()

    expect(await screen.findByText('Admin role required')).toBeInTheDocument()
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

    const { container } = renderAdminUsers()

    expect(await screen.findByText('No users returned')).toBeInTheDocument()
    expect(
      container.querySelectorAll('.state-block[data-state="empty"]').length,
    ).toBeGreaterThanOrEqual(1)
    expect(await screen.findByText('No users are available.')).toBeInTheDocument()
    // Details only exist inline under a selected row; nothing is selected.
    expect(
      screen.queryByRole('region', { name: 'User detail' }),
    ).not.toBeInTheDocument()
  })

  it('selects a user and renders detail with role-grant provenance', async () => {
    mockAdminUsersFetch()

    renderAdminUsers()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Details for Admin User' }),
    )

    const details = await screen.findByRole('region', { name: 'User detail' })

    // The detail expands inline inside the users table, under its row.
    expect(details.closest('table')).toBe(
      screen.getByRole('table', { name: 'Admin users' }),
    )
    expect(
      within(details).getByRole('heading', { name: 'Audit role grants' }),
    ).toBeInTheDocument()
    expect(
      within(details).getByRole('heading', { name: 'Replace managed roles' }),
    ).toBeInTheDocument()
    expect(await within(details).findByText('admin@example.test')).toBeInTheDocument()
    expect(
      within(details).getByRole('region', {
        name: 'Scrollable role grants table',
      }),
    ).toBeInTheDocument()
    expect(within(details).getByText('ADMIN_MANAGED')).toBeInTheDocument()
    expect(within(details).getByText('owner-admin (ID 1)')).toBeInTheDocument()
    expect(within(details).getByText('Initial administrator')).toBeInTheDocument()

    // Clicking anywhere on the selected row collapses the inline detail.
    fireEvent.click(screen.getByRole('rowheader', { name: /Admin User/ }))
    await waitFor(() => {
      expect(
        screen.queryByRole('region', { name: 'User detail' }),
      ).not.toBeInTheDocument()
    })
  })

  it('loads a direct detail route from the list data', async () => {
    const fetchMock = mockAdminUsersFetch()

    renderAdminUsers(`${ADMIN_USERS_ROUTE_PATH}/8`)

    // The list-backed fallback panel shows while users load; once the row is
    // visible the detail renders inline instead.
    await screen.findByRole('form', { name: 'Replace roles for Reviewer User' })
    const details = screen.getByRole('region', { name: 'User detail' })

    expect(details.closest('table')).toBe(
      screen.getByRole('table', { name: 'Admin users' }),
    )
    expect(within(details).getByText('Reviewer User')).toBeInTheDocument()
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

    fireEvent.click(
      await screen.findByRole('button', { name: 'Details for Reviewer User' }),
    )
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

  it('asks for confirmation before removing the signed-in admin role', async () => {
    document.cookie = 'XSRF-TOKEN=token%201'
    const selfUser = createAdminUser({
      id: 42,
      displayName: 'Kamil Kiewisz',
      email: 'kamil@example.test',
      login: 'kamkie',
      roles: ['USER', 'ADMIN'],
    })
    const fetchMock = mockAdminUsersFetch({
      replaceRolesResponse: createAdminUser({
        ...selfUser,
        roles: ['USER'],
        updatedAt: '2026-06-11T10:00:00Z',
      }),
      users: [...createUsers(), selfUser],
    })

    renderAdminUsers(`${ADMIN_USERS_ROUTE_PATH}/42`)

    const form = await screen.findByRole('form', {
      name: 'Replace roles for Kamil Kiewisz',
    })
    fireEvent.click(within(form).getByLabelText('ADMIN'))
    fireEvent.change(within(form).getByLabelText('Operator reason'), {
      target: { value: 'Stepping down from admin duty' },
    })
    fireEvent.click(within(form).getByRole('button', { name: 'Save roles' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Confirm self-demotion')
    expect(
      fetchMock.mock.calls.some(([input]) => String(input).endsWith('/roles')),
    ).toBe(false)

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([input]) => String(input).endsWith('/roles')),
    ).toBe(false)

    fireEvent.click(within(form).getByRole('button', { name: 'Save roles' }))
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Remove my admin access',
      }),
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(getAdminUserRolesPath(42), {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': 'token 1',
        },
        body: JSON.stringify({
          roles: ['USER'],
          reason: 'Stepping down from admin duty',
        }),
      })
    })
    // The refreshed own roles reach the shared account cache, so the admin
    // gate closes right after the demotion is saved.
    expect(
      await screen.findByText('Admin access is required for user management.'),
    ).toBeInTheDocument()
  })

  it('renders account status pills and filters by status client-side', async () => {
    mockAdminUsersFetch({ users: createUsersWithBlockedReviewer() })
    const { container, router } = renderAdminUsers()

    expect(await screen.findByText('Admin User')).toBeInTheDocument()
    expect(container.querySelectorAll('.status-pill-active')).toHaveLength(1)
    expect(container.querySelectorAll('.status-pill-blocked')).toHaveLength(1)

    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'BLOCKED' },
    })

    expect(await screen.findByText('Showing 1-1 of 1 user')).toBeInTheDocument()
    expect(screen.getByText('Reviewer User')).toBeInTheDocument()
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument()
    expect(router.state.location.search).toBe('?status=BLOCKED')
  })

  it('shows block provenance in detail and requires a reason before status changes', async () => {
    const fetchMock = mockAdminUsersFetch({
      users: createUsersWithBlockedReviewer(),
    })

    renderAdminUsers(`${ADMIN_USERS_ROUTE_PATH}/8`)

    const form = await screen.findByRole('form', {
      name: 'Replace account status for Reviewer User',
    })
    const details = screen.getByRole('region', { name: 'User detail' })

    expect(within(details).getByText('Blocked at')).toBeInTheDocument()
    expect(within(details).getByText('owner-admin')).toBeInTheDocument()
    expect(within(details).getByText('Spam activity')).toBeInTheDocument()

    const submit = within(form).getByRole('button', { name: 'Unblock user' })
    expect(submit).toBeDisabled()

    fireEvent.change(within(form).getByLabelText('Operator reason'), {
      target: { value: 'Appeal accepted' },
    })

    expect(submit).toBeEnabled()
    expect(
      fetchMock.mock.calls.some(([input]) => String(input).endsWith('/status')),
    ).toBe(false)
  })

  it('submits a status replacement and patches row/detail from the backend response', async () => {
    document.cookie = 'XSRF-TOKEN=token%201'
    const fetchMock = mockAdminUsersFetch()

    renderAdminUsers(`${ADMIN_USERS_ROUTE_PATH}/8`)

    const form = await screen.findByRole('form', {
      name: 'Replace account status for Reviewer User',
    })
    fireEvent.change(within(form).getByLabelText('Operator reason'), {
      target: { value: ' Spam activity ' },
    })
    fireEvent.click(within(form).getByRole('button', { name: 'Block user' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(getAdminUserStatusPath(8), {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': 'token 1',
        },
        body: JSON.stringify({
          status: 'BLOCKED',
          reason: 'Spam activity',
        }),
      })
    })
    expect(await screen.findByText('Account status updated.')).toBeInTheDocument()

    const details = screen.getByRole('region', { name: 'User detail' })
    expect(within(details).getByText('Block reason')).toBeInTheDocument()
    expect(within(details).getByText('Spam activity')).toBeInTheDocument()
    expect(
      within(details).getByRole('button', { name: 'Unblock user' }),
    ).toBeInTheDocument()
  })

  it('keeps previous user state visible for failed status changes', async () => {
    const fetchMock = mockAdminUsersFetch({
      replaceStatusResponse: problemResponse(
        403,
        'Token CSRF jest wymagany.',
      ),
    })

    renderAdminUsers(`${ADMIN_USERS_ROUTE_PATH}/8`)

    const form = await screen.findByRole('form', {
      name: 'Replace account status for Reviewer User',
    })
    fireEvent.change(within(form).getByLabelText('Operator reason'), {
      target: { value: 'Spam activity' },
    })
    fireEvent.click(within(form).getByRole('button', { name: 'Block user' }))

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input]) =>
          String(input).endsWith('/status'),
        ),
      ).toBe(true)
    })
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Token CSRF jest wymagany.',
    )
    expect(screen.getAllByText('Reviewer User').length).toBeGreaterThan(0)
    expect(screen.queryByText('Account status updated.')).not.toBeInTheDocument()
  })

  it('disables block and unblock for the signed-in administrator account', async () => {
    const selfUser = createAdminUser({
      id: 42,
      displayName: 'Kamil Kiewisz',
      email: 'kamil@example.test',
      login: 'kamkie',
      roles: ['USER', 'ADMIN'],
    })
    const fetchMock = mockAdminUsersFetch({
      users: [...createUsers(), selfUser],
    })

    renderAdminUsers(`${ADMIN_USERS_ROUTE_PATH}/42`)

    const form = await screen.findByRole('form', {
      name: 'Replace account status for Kamil Kiewisz',
    })

    expect(within(form).getByRole('button', { name: 'Block user' })).toBeDisabled()
    expect(within(form).getByLabelText('Operator reason')).toBeDisabled()
    expect(
      within(form).getByText('You cannot block or unblock your own account.'),
    ).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([input]) => String(input).endsWith('/status')),
    ).toBe(false)
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
  replaceStatusResponse = createAdminUser({
    id: 8,
    displayName: 'Reviewer User',
    email: 'reviewer@example.test',
    login: 'reviewer',
    accountStatus: 'BLOCKED',
    blockedAt: '2026-06-11T10:00:00Z',
    blockedBy: 'admin-user',
    blockedReason: 'Spam activity',
    updatedAt: '2026-06-11T10:00:00Z',
  }),
  users = createUsers(),
}: {
  account?: UserAccount | Response
  replaceRolesResponse?: AdminUserAccount | Response
  replaceStatusResponse?: AdminUserAccount | Response
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

    if (path.endsWith('/status') && method === 'PUT') {
      return Promise.resolve(toResponse(replaceStatusResponse))
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

function createUsersWithBlockedReviewer(): AdminUserAccount[] {
  const [admin, reviewer] = createUsers()

  return [
    admin,
    {
      ...reviewer,
      accountStatus: 'BLOCKED',
      blockedAt: '2026-06-10T15:00:00Z',
      blockedBy: 'owner-admin',
      blockedReason: 'Spam activity',
    },
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
    accountStatus: 'ACTIVE',
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
