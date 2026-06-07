import { describe, expect, it, vi } from 'vitest'

import {
  AUDIT_LOGS_PATH,
  OPERATOR_SURFACE_PATH,
  buildAuditLogSearchPath,
  fetchAuditLogs,
  fetchOperatorSurface,
  getSafeOperatorApiPath,
  type AuditLogPage,
  type OperatorSurface,
} from './operator'

describe('operator API client', () => {
  it('fetches the operator surface with same-origin JSON reads and no CSRF headers', async () => {
    const surface = createSurface()
    const fetchImplementation = vi.fn().mockResolvedValue(Response.json(surface))

    await expect(
      fetchOperatorSurface({ fetchImplementation }),
    ).resolves.toEqual(surface)

    expect(fetchImplementation).toHaveBeenCalledWith(OPERATOR_SURFACE_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
  })

  it('fetches audit logs with same-origin JSON reads and no CSRF headers', async () => {
    const page = createAuditPage()
    const fetchImplementation = vi.fn().mockResolvedValue(Response.json(page))

    await expect(
      fetchAuditLogs(
        {
          page: 1,
          size: 20,
          sort: ['createdAt,DESC'],
        },
        { fetchImplementation },
      ),
    ).resolves.toEqual(page)

    expect(fetchImplementation).toHaveBeenCalledWith(
      `${AUDIT_LOGS_PATH}?page=1&size=20&sort=createdAt%2CDESC`,
      {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
        },
      },
    )
  })

  it('serializes filters, pagination, and repeated sort values', () => {
    expect(
      buildAuditLogSearchPath({
        targetType: ' BOOK ',
        action: ' UPDATE ',
        actorLogin: ' admin-user ',
        page: 2,
        size: 50,
        sort: ['createdAt,DESC', 'id,DESC'],
      }),
    ).toBe(
      `${AUDIT_LOGS_PATH}?targetType=BOOK&action=UPDATE&actorLogin=admin-user&page=2&size=50&sort=createdAt%2CDESC&sort=id%2CDESC`,
    )
  })

  it('omits blank audit filters and sort values', () => {
    expect(
      buildAuditLogSearchPath({
        targetType: ' ',
        action: '',
        actorLogin: '   ',
        page: 0,
        size: 20,
        sort: [' ', 'id,DESC'],
      }),
    ).toBe(`${AUDIT_LOGS_PATH}?page=0&size=20&sort=id%2CDESC`)
  })

  it('surfaces localized 401 and 403 problem messages', async () => {
    const unauthorizedFetch = vi.fn().mockResolvedValue(
      Response.json(
        {
          status: 401,
          messageKey: 'error.session.required',
          message: 'Sesja wygasla.',
          language: 'pl',
        },
        {
          status: 401,
          statusText: 'Unauthorized',
          headers: {
            'Content-Type': 'application/problem+json',
          },
        },
      ),
    )
    const forbiddenFetch = vi.fn().mockResolvedValue(
      Response.json(
        {
          status: 403,
          messageKey: 'error.operator.access_denied',
          message: 'Nie masz dostepu do audytu.',
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
    )

    await expect(
      fetchOperatorSurface({ fetchImplementation: unauthorizedFetch }),
    ).rejects.toThrow('Sesja wygasla.')
    await expect(
      fetchAuditLogs({}, { fetchImplementation: forbiddenFetch }),
    ).rejects.toThrow('Nie masz dostepu do audytu.')
  })

  it('does not use non-API overview endpoint metadata for browser requests', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      Response.json(
        createSurface({
          audit: {
            auditLogEndpoint: 'https://example.test/audit',
          },
        }),
      ),
    )

    await fetchOperatorSurface({ fetchImplementation })

    expect(fetchImplementation).toHaveBeenCalledTimes(1)
    expect(fetchImplementation).toHaveBeenCalledWith(
      OPERATOR_SURFACE_PATH,
      expect.any(Object),
    )
    expect(getSafeOperatorApiPath('https://example.test/audit')).toBeUndefined()
    expect(getSafeOperatorApiPath('/actuator/health')).toBeUndefined()
    expect(getSafeOperatorApiPath('/api/admin/audit-logs')).toBe(
      '/api/admin/audit-logs',
    )
  })
})

function createSurface(overrides: OperatorSurface = {}): OperatorSurface {
  return {
    audit: {
      auditLogEndpoint: AUDIT_LOGS_PATH,
      totalEntries: 1,
      recentEntries: [
        {
          id: 1,
          targetType: 'BOOK',
          targetId: 10,
          action: 'UPDATE',
          actorLogin: 'admin-user',
          summary: 'Updated book.',
          createdAt: '2026-06-07T08:30:00Z',
          details: {
            title: {
              before: 'Clean Code',
              after: 'Clean Code Updated',
            },
          },
        },
      ],
    },
    runtime: {
      technicalOverviewEndpoint: '/',
      technicalOverview: {
        build: {
          name: 'technical-interview-demo',
          version: '1.0.0',
        },
      },
    },
    operations: {
      actuatorHealthEndpoint: '/actuator/health',
      applicationHealthStatus: 'UP',
      livenessState: 'CORRECT',
      readinessState: 'ACCEPTING_TRAFFIC',
    },
    ...overrides,
  }
}

function createAuditPage(overrides: AuditLogPage = {}): AuditLogPage {
  return {
    content: [
      {
        id: 2,
        targetType: 'CATEGORY',
        targetId: 3,
        action: 'CREATE',
        actorLogin: 'admin-user',
        summary: 'Created category.',
        createdAt: '2026-06-07T08:35:00Z',
      },
    ],
    first: true,
    last: true,
    number: 0,
    numberOfElements: 1,
    size: 20,
    totalElements: 1,
    totalPages: 1,
    ...overrides,
  }
}
