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
  AUDIT_LOGS_PATH,
  OPERATOR_SURFACE_PATH,
  type AuditLog,
  type AuditLogPage,
  type OperatorSurface,
} from '../api/operator'
import type { SessionResponse } from '../api/session'
import { OPERATOR_ROUTE_PATH, OperatorPage } from './OperatorPage'

describe('OperatorPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads overview and audit rows from URL-backed filters', async () => {
    const fetchMock = mockOperatorFetch()

    renderOperator(
      `${OPERATOR_ROUTE_PATH}?targetType=BOOK&action=UPDATE&actorLogin=admin&page=2&size=50&sort=createdAt,DESC&sort=id,DESC`,
    )

    expect(await screen.findByText('Updated book title.')).toBeInTheDocument()
    expect(await screen.findByText('Created category Java.')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(OPERATOR_SURFACE_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
    expect(fetchMock).toHaveBeenCalledWith(
      `${AUDIT_LOGS_PATH}?targetType=BOOK&action=UPDATE&actorLogin=admin&page=2&size=50&sort=createdAt%2CDESC&sort=id%2CDESC`,
      {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
        },
      },
    )

    expect(screen.getByLabelText('Target type')).toHaveValue('BOOK')
    expect(screen.getByLabelText('Action')).toHaveValue('UPDATE')
    expect(screen.getByLabelText('Actor login')).toHaveValue('admin')
    expect(screen.getByLabelText('Sort by')).toHaveValue('createdAt,DESC|id,DESC')
    expect(screen.getAllByLabelText('Rows per page')[0]).toHaveValue('50')
    expect(screen.getAllByText('technical-interview-demo').length).toBeGreaterThan(0)
    expect(screen.getByText('main')).toBeInTheDocument()
    expect(screen.getByText('UP')).toBeInTheDocument()
    expect(screen.getByText('/api/admin/audit-logs')).toBeInTheDocument()
  })

  it('resets the page when filters change while preserving repeated sort', async () => {
    const fetchMock = mockOperatorFetch()

    renderOperator(
      `${OPERATOR_ROUTE_PATH}?page=3&size=50&sort=createdAt,DESC&sort=id,DESC`,
    )

    await screen.findByText('Created category Java.')
    fireEvent.change(screen.getByLabelText('Target type'), {
      target: { value: 'AUTHENTICATION' },
    })
    fireEvent.change(screen.getByLabelText('Actor login'), {
      target: { value: ' system ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Search audit logs' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${AUDIT_LOGS_PATH}?targetType=AUTHENTICATION&actorLogin=system&page=0&size=50&sort=createdAt%2CDESC&sort=id%2CDESC`,
        expect.objectContaining({
          credentials: 'same-origin',
          method: 'GET',
        }),
      )
    })
    expect(screen.getByLabelText('Target type')).toHaveValue('AUTHENTICATION')
    expect(screen.getByLabelText('Actor login')).toHaveValue('system')
  })

  it('keeps repeated sort values through browser back and forward navigation', async () => {
    const fetchMock = mockOperatorFetch()
    const { router } = renderOperatorWithEntries(
      [
        `${OPERATOR_ROUTE_PATH}?sort=actorLogin,ASC&sort=createdAt,DESC`,
        `${OPERATOR_ROUTE_PATH}?sort=targetType,ASC&sort=createdAt,DESC`,
      ],
      1,
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${AUDIT_LOGS_PATH}?page=0&size=20&sort=targetType%2CASC&sort=createdAt%2CDESC`,
        expect.objectContaining({
          method: 'GET',
        }),
      )
    })

    await router.navigate(-1)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${AUDIT_LOGS_PATH}?page=0&size=20&sort=actorLogin%2CASC&sort=createdAt%2CDESC`,
        expect.objectContaining({
          method: 'GET',
        }),
      )
    })

    await router.navigate(1)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${AUDIT_LOGS_PATH}?page=0&size=20&sort=targetType%2CASC&sort=createdAt%2CDESC`,
        expect.objectContaining({
          method: 'GET',
        }),
      )
    })
  })

  it('renders empty audit pages and partial overview payloads without crashing', async () => {
    mockOperatorFetch({
      auditPage: createAuditPage({
        content: [],
        empty: true,
        first: true,
        last: true,
        numberOfElements: 0,
        totalElements: 0,
        totalPages: 0,
      }),
      surface: {},
    })

    renderOperator()

    expect(
      await screen.findByText('No audit entries match these filters.'),
    ).toBeInTheDocument()
    expect(screen.getByText('No recent audit entries available.')).toBeInTheDocument()
    expect(screen.getByText('Build details unavailable.')).toBeInTheDocument()
    expect(
      screen.getByText('Operational status unavailable.'),
    ).toBeInTheDocument()
  })

  it('opens details from a recent entry', async () => {
    mockOperatorFetch()

    renderOperator()

    const recentEntries = await screen.findByLabelText('Recent audit entries')

    fireEvent.click(
      within(recentEntries).getByRole('button', {
        name: /Updated book title/,
      }),
    )

    const detailsPanel = screen.getByRole('complementary', {
      name: 'Audit details',
    })

    expect(within(detailsPanel).getByText('Updated book title.')).toBeInTheDocument()
    expect(within(detailsPanel).getByText(/Domain-Driven Design/)).toBeInTheDocument()
  })

  it('opens details from a table row and handles missing details', async () => {
    mockOperatorFetch()

    renderOperator()

    fireEvent.click(await screen.findByRole('button', { name: 'View audit entry 2' }))

    const detailsPanel = screen.getByRole('complementary', {
      name: 'Audit details',
    })

    expect(
      within(detailsPanel).getByText('Created category Java.'),
    ).toBeInTheDocument()
    expect(
      within(detailsPanel).getByText('No structured details available.'),
    ).toBeInTheDocument()
  })

  it('renders localized 401 and 403 operator errors without redirecting', async () => {
    mockOperatorFetch({
      auditPage: problemResponse(401, 'Sesja wygasla.'),
      surface: problemResponse(403, 'Nie masz dostepu do audytu.'),
    })

    renderOperator()

    const alerts = await screen.findAllByRole('alert')

    expect(alerts.map((alert) => alert.textContent)).toEqual(
      expect.arrayContaining([
        'Nie masz dostepu do audytu.',
        'Sesja wygasla.',
      ]),
    )
    expect(
      screen.queryByRole('heading', { name: 'Sign in required' }),
    ).not.toBeInTheDocument()
  })

  it('keeps overview visible when audit rows fail with a generic transport error', async () => {
    mockOperatorFetch({
      auditPage: new Response(null, {
        status: 503,
        statusText: 'Service Unavailable',
      }),
    })

    renderOperator()

    expect(await screen.findByText('Updated book title.')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'GET /api/admin/audit-logs?page=0&size=20&sort=id%2CDESC failed with 503 Service Unavailable',
    )
  })
})

function renderOperator(
  initialEntry: string = OPERATOR_ROUTE_PATH,
  session = createSession(),
) {
  return renderOperatorWithEntries([initialEntry], 0, session)
}

function renderOperatorWithEntries(
  initialEntries: string[],
  initialIndex: number,
  session = createSession(),
) {
  const router = createMemoryRouter(
    [
      {
        path: OPERATOR_ROUTE_PATH,
        element: <OperatorPage session={session} />,
      },
    ],
    {
      initialEntries,
      initialIndex,
    },
  )

  return {
    router,
    ...render(<RouterProvider router={router} />),
  }
}

function mockOperatorFetch({
  auditPage = createAuditPage(),
  surface = createSurface(),
}: {
  auditPage?: AuditLogPage | Response | ((path: string) => AuditLogPage | Response)
  surface?: OperatorSurface | Response
} = {}) {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const path = String(input)

    if (path === OPERATOR_SURFACE_PATH) {
      return Promise.resolve(toResponse(surface))
    }

    if (path.startsWith(AUDIT_LOGS_PATH)) {
      return Promise.resolve(toResponse(resolveValue(auditPage, path)))
    }

    return Promise.resolve(new Response(null, { status: 404 }))
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

function createSurface(overrides: OperatorSurface = {}): OperatorSurface {
  return {
    audit: {
      auditLogEndpoint: AUDIT_LOGS_PATH,
      totalEntries: 5,
      recentEntries: [
        createAuditLog({
          id: 1,
          summary: 'Updated book title.',
          details: {
            title: {
              after: 'Domain-Driven Design',
              before: 'Domain Driven Design',
            },
          },
        }),
      ],
    },
    runtime: {
      technicalOverviewEndpoint: '/',
      technicalOverview: {
        build: {
          artifact: 'technical-interview-demo',
          name: 'technical-interview-demo',
          version: '1.0.0',
        },
        configuration: {
          documentation: {
            openApiVersion: '3.0.1',
          },
          observability: {
            exposedEndpoints: ['health', 'info'],
            healthProbesEnabled: true,
          },
          pagination: {
            defaultPageSize: 20,
            maxPageSize: 100,
          },
          security: {
            csrfEnabled: true,
            publicApiPathPattern: '/api/**',
          },
          session: {
            cookieName: 'technical-interview-demo-session',
            storeType: 'jdbc',
            timeout: '30m',
          },
        },
        dependencies: {
          postgresql: '42.7.7',
        },
        git: {
          branch: 'main',
          shortCommitId: 'abc1234',
        },
        runtime: {
          activeProfiles: ['local'],
          applicationName: 'technical-interview-demo',
          javaVendor: 'Eclipse Adoptium',
          javaVersion: '24',
        },
      },
    },
    operations: {
      actuatorHealthEndpoint: '/actuator/health',
      actuatorInfoEndpoint: '/actuator/info',
      actuatorPrometheusEndpoint: '/actuator/prometheus',
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
      createAuditLog({
        id: 2,
        action: 'CREATE',
        summary: 'Created category Java.',
        targetId: 3,
        targetType: 'CATEGORY',
        details: undefined,
      }),
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

function createAuditLog(overrides: AuditLog = {}): AuditLog {
  return {
    action: 'UPDATE',
    actorLogin: 'admin-user',
    createdAt: '2026-06-07T08:30:00Z',
    id: 1,
    summary: 'Updated book.',
    targetId: 10,
    targetType: 'BOOK',
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
      messageKey: 'error.operator',
      message,
      language: 'pl',
    },
    {
      status,
      statusText: status === 401 ? 'Unauthorized' : 'Forbidden',
      headers: {
        'Content-Type': 'application/problem+json',
      },
    },
  )
}

function resolveValue<T, TArgs extends unknown[]>(
  value: T | ((...args: TArgs) => T),
  ...args: TArgs
) {
  return typeof value === 'function'
    ? (value as (...args: TArgs) => T)(...args)
    : value
}

function toResponse(value: AuditLogPage | OperatorSurface | Response) {
  return value instanceof Response ? value : Response.json(value)
}
