import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  OPERATOR_SURFACE_PATH,
  type AuditLog,
  type OperatorSurface,
} from '../api/operator'
import type { SessionResponse } from '../api/session'
import {
  OPERATOR_DIAGNOSTICS_ROUTE_PATH,
  OperatorDiagnosticsPage,
} from './OperatorDiagnosticsPage'

describe('OperatorDiagnosticsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads the operator surface and renders diagnostics cards', async () => {
    const fetchMock = mockSurfaceFetch()

    renderDiagnostics()

    expect(
      await screen.findByRole('heading', { name: 'Audit summary' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Operational status' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Runtime summary' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('technical-interview-demo').length).toBeGreaterThan(0)
    expect(screen.getByText('main')).toBeInTheDocument()
    expect(screen.getByText('UP')).toBeInTheDocument()
    expect(screen.getByText('/api/admin/audit-logs')).toBeInTheDocument()
    // Audit browsing lives on the operations console; the summary links there.
    expect(
      screen.getByRole('link', { name: 'Browse audit rows' }),
    ).toHaveAttribute('href', '/operator')
    expect(fetchMock).toHaveBeenCalledWith(OPERATOR_SURFACE_PATH, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    })
  })

  it('reuses the cached operator surface when remounting with the same session', async () => {
    const fetchMock = mockSurfaceFetch()
    const session = createSession()

    const { unmount } = renderDiagnostics(session)

    expect(
      await screen.findByRole('heading', { name: 'Audit summary' }),
    ).toBeInTheDocument()
    unmount()

    renderDiagnostics(session)

    expect(
      await screen.findByRole('heading', { name: 'Audit summary' }),
    ).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.filter(
        ([input]) => String(input) === OPERATOR_SURFACE_PATH,
      ),
    ).toHaveLength(1)
  })

  it('renders partial overview payloads without crashing', async () => {
    mockSurfaceFetch({ surface: {} })

    renderDiagnostics()

    expect(
      await screen.findByText('Build details unavailable.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Operational status unavailable.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Browse audit rows' }),
    ).toHaveAttribute('href', '/operator')
  })

  it('displays localized backend access failures', async () => {
    mockSurfaceFetch({
      surface: Response.json(
        {
          status: 403,
          messageKey: 'error.operator',
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
    })

    renderDiagnostics()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Nie masz dostepu do audytu.',
    )
  })
})

function renderDiagnostics(session = createSession()) {
  const router = createMemoryRouter(
    [
      {
        path: OPERATOR_DIAGNOSTICS_ROUTE_PATH,
        element: <OperatorDiagnosticsPage session={session} />,
      },
    ],
    {
      initialEntries: [OPERATOR_DIAGNOSTICS_ROUTE_PATH],
    },
  )

  return render(<RouterProvider router={router} />)
}

function mockSurfaceFetch({
  surface = createSurface(),
}: {
  surface?: OperatorSurface | Response
} = {}) {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const path = String(input)

    if (path === OPERATOR_SURFACE_PATH) {
      return Promise.resolve(
        surface instanceof Response ? surface : Response.json(surface),
      )
    }

    return Promise.resolve(new Response(null, { status: 404 }))
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

function createSurface(overrides: OperatorSurface = {}): OperatorSurface {
  return {
    audit: {
      auditLogEndpoint: '/api/admin/audit-logs',
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
