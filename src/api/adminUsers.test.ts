import { describe, expect, it, vi } from 'vitest'

import {
  ADMIN_USERS_PATH,
  createAdminUserRoleUpdateRequest,
  fetchAdminUsers,
  getAdminUserRolesPath,
  getAdminUserStatusPath,
  replaceAdminUserRoles,
  replaceAdminUserStatus,
  type AdminUserAccount,
} from './adminUsers'
import type { SessionResponse } from './session'

describe('admin users API client', () => {
  it('lists admin users from the same-origin path with no query or CSRF headers', async () => {
    const users = [createAdminUser()]
    const fetchImplementation = vi.fn().mockResolvedValue(Response.json(users))

    await expect(
      fetchAdminUsers({ fetchImplementation }),
    ).resolves.toEqual(users)

    expect(fetchImplementation).toHaveBeenCalledWith(ADMIN_USERS_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
  })

  it('surfaces localized list 401 and 403 problem messages', async () => {
    const unauthorizedFetch = vi
      .fn()
      .mockResolvedValue(problemResponse(401, 'Sesja wygasla.'))
    const forbiddenFetch = vi
      .fn()
      .mockResolvedValue(problemResponse(403, 'Brak dostepu do uzytkownikow.'))

    await expect(
      fetchAdminUsers({ fetchImplementation: unauthorizedFetch }),
    ).rejects.toThrow('Sesja wygasla.')
    await expect(
      fetchAdminUsers({ fetchImplementation: forbiddenFetch }),
    ).rejects.toThrow('Brak dostepu do uzytkownikow.')
  })

  it('replaces roles with the selected id, complete role body, and CSRF metadata', async () => {
    const updatedUser = createAdminUser({
      id: 7,
      roles: ['USER', 'ADMIN'],
    })
    const fetchImplementation = vi.fn().mockResolvedValue(Response.json(updatedUser))

    await expect(
      replaceAdminUserRoles(
        createSession(),
        7,
        {
          roles: ['ADMIN'],
          reason: ' promote for catalog work ',
        },
        {
          cookieSource: 'language=en; XSRF-TOKEN=token%201',
          fetchImplementation,
        },
      ),
    ).resolves.toEqual(updatedUser)

    expect(fetchImplementation).toHaveBeenCalledWith(getAdminUserRolesPath(7), {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'token 1',
      },
      body: JSON.stringify({
        roles: ['USER', 'ADMIN'],
        reason: 'promote for catalog work',
      }),
    })
  })

  it('keeps USER in generated role requests and removes duplicates', () => {
    expect(
      createAdminUserRoleUpdateRequest(['ADMIN', 'ADMIN', 'USER'], ' reason '),
    ).toEqual({
      roles: ['USER', 'ADMIN'],
      reason: 'reason',
    })
  })

  it('omits invented CSRF headers when the readable cookie is missing', async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(problemResponse(403, 'Token CSRF jest wymagany.'))

    await expect(
      replaceAdminUserRoles(
        createSession(),
        7,
        {
          roles: ['USER', 'ADMIN'],
          reason: 'Role review',
        },
        {
          cookieSource: 'language=en',
          fetchImplementation,
        },
      ),
    ).rejects.toThrow('Token CSRF jest wymagany.')

    expect(fetchImplementation).toHaveBeenCalledWith(getAdminUserRolesPath(7), {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roles: ['USER', 'ADMIN'],
        reason: 'Role review',
      }),
    })
  })

  it.each([
    [400, 'Powod zmiany roli jest wymagany.'],
    [403, 'Nie masz uprawnien do zmiany rol.'],
    [404, 'Uzytkownik nie istnieje.'],
  ])('preserves localized %i role replacement errors', async (status, message) => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(problemResponse(status, message))

    await expect(
      replaceAdminUserRoles(
        createSession(),
        9,
        {
          roles: ['USER'],
          reason: 'Role audit',
        },
        {
          cookieSource: 'XSRF-TOKEN=token',
          fetchImplementation,
        },
      ),
    ).rejects.toThrow(message)
  })

  it('does not issue role changes for anonymous sessions', async () => {
    const fetchImplementation = vi.fn()

    await expect(
      replaceAdminUserRoles(
        createSession({
          authenticated: false,
        }),
        9,
        {
          roles: ['USER'],
          reason: 'Role audit',
        },
        { fetchImplementation },
      ),
    ).rejects.toThrow('Admin user role changes require an authenticated session.')
    expect(fetchImplementation).not.toHaveBeenCalled()
  })

  it('replaces status with the selected id, trimmed reason body, and CSRF metadata', async () => {
    const updatedUser = createAdminUser({
      id: 7,
      accountStatus: 'BLOCKED',
      blockedAt: '2026-06-11T10:00:00Z',
      blockedBy: 'admin-user',
      blockedReason: 'Abusive API usage pending review.',
    })
    const fetchImplementation = vi.fn().mockResolvedValue(Response.json(updatedUser))

    await expect(
      replaceAdminUserStatus(
        createSession(),
        7,
        {
          status: 'BLOCKED',
          reason: ' Abusive API usage pending review. ',
        },
        {
          cookieSource: 'language=en; XSRF-TOKEN=token%201',
          fetchImplementation,
        },
      ),
    ).resolves.toEqual(updatedUser)

    expect(fetchImplementation).toHaveBeenCalledWith(getAdminUserStatusPath(7), {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'token 1',
      },
      body: JSON.stringify({
        status: 'BLOCKED',
        reason: 'Abusive API usage pending review.',
      }),
    })
  })

  it('omits invented CSRF headers on status changes when the readable cookie is missing', async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(problemResponse(403, 'Token CSRF jest wymagany.'))

    await expect(
      replaceAdminUserStatus(
        createSession(),
        7,
        {
          status: 'ACTIVE',
          reason: 'Reviewed appeal',
        },
        {
          cookieSource: 'language=en',
          fetchImplementation,
        },
      ),
    ).rejects.toThrow('Token CSRF jest wymagany.')

    expect(fetchImplementation).toHaveBeenCalledWith(getAdminUserStatusPath(7), {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'ACTIVE',
        reason: 'Reviewed appeal',
      }),
    })
  })

  it.each([
    [400, 'Nie mozesz zablokowac wlasnego konta.'],
    [403, 'Nie masz uprawnien do zmiany statusu.'],
    [404, 'Uzytkownik nie istnieje.'],
  ])('preserves localized %i status replacement errors', async (status, message) => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(problemResponse(status, message))

    await expect(
      replaceAdminUserStatus(
        createSession(),
        9,
        {
          status: 'BLOCKED',
          reason: 'Status audit',
        },
        {
          cookieSource: 'XSRF-TOKEN=token',
          fetchImplementation,
        },
      ),
    ).rejects.toThrow(message)
  })

  it('does not issue status changes for anonymous sessions', async () => {
    const fetchImplementation = vi.fn()

    await expect(
      replaceAdminUserStatus(
        createSession({
          authenticated: false,
        }),
        9,
        {
          status: 'BLOCKED',
          reason: 'Status audit',
        },
        { fetchImplementation },
      ),
    ).rejects.toThrow(
      'Admin user status changes require an authenticated session.',
    )
    expect(fetchImplementation).not.toHaveBeenCalled()
  })
})

function createAdminUser(overrides: AdminUserAccount = {}): AdminUserAccount {
  return {
    id: 7,
    provider: 'github',
    login: 'admin-user',
    displayName: 'Admin User',
    email: 'admin@example.test',
    preferredLanguage: 'en',
    roles: ['USER'],
    roleGrants: [
      {
        role: 'USER',
        source: 'AUTHENTICATED_LOGIN',
        grantedAt: '2026-06-07T09:00:00Z',
      },
    ],
    lastLoginAt: '2026-06-06T22:10:00Z',
    createdAt: '2026-05-11T12:00:00Z',
    updatedAt: '2026-06-06T22:10:00Z',
    ...overrides,
  }
}

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
      statusText: status === 401 ? 'Unauthorized' : 'Error',
      headers: {
        'Content-Type': 'application/problem+json',
      },
    },
  )
}
