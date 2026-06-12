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
  type AuditLog,
  type AuditLogPage,
} from '../api/operator'
import type { SessionResponse } from '../api/session'
import { OPERATOR_ROUTE_PATH, OperatorPage } from './OperatorPage'

describe('OperatorPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads audit rows from URL-backed filters', async () => {
    const fetchMock = mockOperatorFetch()

    renderOperator(
      `${OPERATOR_ROUTE_PATH}?targetType=BOOK&action=UPDATE&actorLogin=admin&page=2&size=50&sort=createdAt,DESC&sort=id,DESC`,
    )

    expect(await screen.findByText('Created category Java.')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Audit rows' }),
    ).toBeInTheDocument()
    const filters = screen.getByRole('form', { name: 'Audit filters' })
    expect(within(filters).getByLabelText('Target type')).toBeInTheDocument()
    expect(within(filters).getByLabelText('Action')).toBeInTheDocument()
    expect(within(filters).getByLabelText('Actor login')).toBeInTheDocument()
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
    expect(
      screen.getByRole('button', {
        name: 'Sort by Created; currently descending. Activate to sort ascending.',
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByLabelText('Rows per page')[0]).toHaveValue('50')
    expect(screen.getByText('Showing 1-1 of 1 audit entry')).toBeInTheDocument()
    const tableRegion = screen.getByRole('region', {
      name: 'Scrollable operator audit table',
    })
    expect(
      within(tableRegion).getByRole('table', { name: 'Operator audit rows' }),
    ).toBeInTheDocument()
    const pagination = screen.getByLabelText('Audit pagination')
    expect(
      within(pagination).getByRole('button', { name: 'Previous page' }),
    ).toBeInTheDocument()
    expect(
      within(pagination).getByRole('button', { name: 'Next page' }),
    ).toBeInTheDocument()
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
    // The query trims the value while the input keeps the typed text.
    expect(screen.getByLabelText('Actor login')).toHaveValue(' system ')
  })

  it('sorts from column headers with composite sort values and resets the page', async () => {
    const fetchMock = mockOperatorFetch()

    renderOperator(`${OPERATOR_ROUTE_PATH}?page=2`)

    await screen.findByText('Created category Java.')

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Sort by Actor; currently not sorted. Activate to sort ascending.',
      }),
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${AUDIT_LOGS_PATH}?page=0&size=20&sort=actorLogin%2CASC&sort=createdAt%2CDESC`,
        expect.objectContaining({ method: 'GET' }),
      )
    })

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Sort by Created; currently not sorted. Activate to sort ascending.',
      }),
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${AUDIT_LOGS_PATH}?page=0&size=20&sort=createdAt%2CASC&sort=id%2CASC`,
        expect.objectContaining({ method: 'GET' }),
      )
    })

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Sort by Created; currently ascending. Activate to sort descending.',
      }),
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${AUDIT_LOGS_PATH}?page=0&size=20&sort=createdAt%2CDESC&sort=id%2CDESC`,
        expect.objectContaining({ method: 'GET' }),
      )
    })
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

  it('renders empty audit pages without crashing', async () => {
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
    })

    const { container } = renderOperator()

    expect(
      await screen.findByText('No audit entries match these filters.'),
    ).toBeInTheDocument()
    expect(
      container.querySelectorAll('.state-block[data-state="empty"]').length,
    ).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('No audit rows found')).toBeInTheDocument()
  })

  it('expands inline details from a table row and handles missing details', async () => {
    mockOperatorFetch()

    const { container } = renderOperator()

    const detailsToggle = await screen.findByRole('button', {
      name: 'Details for audit entry 2',
    })

    expect(detailsToggle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(detailsToggle)

    expect(detailsToggle).toHaveAttribute('aria-expanded', 'true')

    const detailRow = container.querySelector('.audit-detail-row')

    expect(detailRow).not.toBeNull()
    expect(
      within(detailRow as HTMLElement).getByText('Created category Java.'),
    ).toBeInTheDocument()
    expect(
      within(detailRow as HTMLElement).getByText(
        'No structured details available.',
      ),
    ).toBeInTheDocument()

    fireEvent.click(detailsToggle)

    expect(detailsToggle).toHaveAttribute('aria-expanded', 'false')
    expect(container.querySelector('.audit-detail-row')).toBeNull()
  })

  it('toggles inline details from a click anywhere in the row', async () => {
    mockOperatorFetch()

    const { container } = renderOperator()

    const summaryCell = await screen.findByText('Created category Java.')

    fireEvent.click(summaryCell)

    expect(container.querySelector('.audit-detail-row')).not.toBeNull()

    fireEvent.click(summaryCell)

    expect(container.querySelector('.audit-detail-row')).toBeNull()
  })

  it('collapses the expanded row when the audit query changes', async () => {
    const fetchMock = mockOperatorFetch({
      auditPage: createAuditPage({
        last: false,
        totalElements: 40,
        totalPages: 2,
      }),
    })

    const { container } = renderOperator()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Details for audit entry 2' }),
    )

    expect(container.querySelector('.audit-detail-row')).not.toBeNull()

    fireEvent.click(screen.getAllByRole('button', { name: 'Next page' })[0])

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${AUDIT_LOGS_PATH}?page=1&size=20&sort=id%2CDESC`,
        expect.objectContaining({ method: 'GET' }),
      )
    })
    await waitFor(() => {
      expect(container.querySelector('.audit-detail-row')).toBeNull()
    })
  })

  it('renders localized 401 audit errors without redirecting', async () => {
    mockOperatorFetch({
      auditPage: problemResponse(401, 'Sesja wygasla.'),
    })

    renderOperator()

    expect(await screen.findByRole('alert')).toHaveTextContent('Sesja wygasla.')
    expect(
      screen.queryByRole('heading', { name: 'Sign in required' }),
    ).not.toBeInTheDocument()
  })

  it('surfaces generic transport errors from audit rows', async () => {
    mockOperatorFetch({
      auditPage: new Response(null, {
        status: 503,
        statusText: 'Service Unavailable',
      }),
    })

    renderOperator()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'GET /api/admin/audit-logs?page=0&size=20&sort=id%2CDESC failed with 503 Service Unavailable',
    )
    expect(screen.getByText('Audit rows need attention.')).toBeInTheDocument()
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
}: {
  auditPage?: AuditLogPage | Response | ((path: string) => AuditLogPage | Response)
} = {}) {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const path = String(input)

    if (path.startsWith(AUDIT_LOGS_PATH)) {
      return Promise.resolve(toResponse(resolveValue(auditPage, path)))
    }

    return Promise.resolve(new Response(null, { status: 404 }))
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
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

function toResponse(value: AuditLogPage | Response) {
  return value instanceof Response ? value : Response.json(value)
}
