import type { components, paths } from '../api/generated/openapi'

export const MOCK_LOGIN_PATH = '/api/session/mock-login/admin'
export const MOCK_OPENAPI_PATHS = [
  '/api/localizations/{id}',
  '/api/categories/{id}',
  '/api/books/{id}',
  '/api/admin/users/{id}/roles',
  '/api/account/language',
  '/api/session/logout',
  '/api/localizations',
  '/api/categories',
  '/api/books',
  '/api/session',
  '/api/admin/users',
  '/api/admin/operator-surface',
  '/api/admin/audit-logs',
  '/api/account',
] as const satisfies readonly (keyof paths)[]

type Account = components['schemas']['UserAccountResponse']
type AdminUser = components['schemas']['AdminUserAccountResponse']
type AdminUserRoleUpdateRequest = components['schemas']['AdminUserRoleUpdateRequest']
type ApiProblem = components['schemas']['ApiProblemResponse']
type AuditLog = components['schemas']['AuditLogResponse']
type AuditLogPage = components['schemas']['AuditLogPageResponse']
type Book = components['schemas']['Book']
type BookCreateRequest = components['schemas']['BookCreateRequest']
type BookPage = components['schemas']['PageBook']
type BookUpdateRequest = components['schemas']['BookUpdateRequest']
type Category = components['schemas']['Category']
type CategoryCreateRequest = components['schemas']['CategoryCreateRequest']
type CategoryUpdateRequest = components['schemas']['CategoryUpdateRequest']
type LocalizationPage = components['schemas']['PageLocalizationResponse']
type LocalizationRequest = components['schemas']['LocalizationRequest']
type LocalizationResponse = components['schemas']['LocalizationResponse']
type OperatorSurface = components['schemas']['OperatorSurfaceResponse']
type Session = components['schemas']['SessionResponse']
type MockHeadersInit = Headers | [string, string][] | Record<string, string>

export type MockSessionKind = 'admin' | 'user' | 'anonymous'
export type MockApiScenario = 'success' | 'empty' | 'error'

export type MockApiOptions = {
  delayMs?: number
  scenario?: MockApiScenario
  session?: MockSessionKind
}

export type MockApiState = {
  account: Account
  adminUsers: AdminUser[]
  auditLogs: AuditLog[]
  books: Book[]
  categories: Category[]
  currentSession: MockSessionKind
  localizations: LocalizationResponse[]
  nextBookId: number
  nextCategoryId: number
  nextLocalizationId: number
}

const SESSION_COOKIE = 'technical-interview-demo-session'
const CSRF_COOKIE = 'XSRF-TOKEN'
const CSRF_HEADER = 'X-XSRF-TOKEN'
const CSRF_TOKEN = 'mock-csrf-token'
const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
} as const
const READ_ERROR_PATHS = [
  '/api/account',
  '/api/books',
  '/api/categories',
  '/api/localizations',
  '/api/admin/users',
  '/api/admin/operator-surface',
  '/api/admin/audit-logs',
] as const

export function createMockApiState(options: Pick<MockApiOptions, 'session' | 'scenario'> = {}): MockApiState {
  const empty = options.scenario === 'empty'
  const account = createAccount(options.session ?? 'admin')
  const categories: Category[] = empty
    ? []
    : [
        { id: 1, name: 'Java' },
        { id: 2, name: 'Architecture' },
        { id: 3, name: 'Frontend' },
      ]
  const books: Book[] = empty
    ? []
    : [
        {
          id: 1,
          version: 1,
          title: 'Spring Boot Interview Notes',
          author: 'A. Backend',
          isbn: '9780000000011',
          publicationYear: 2024,
          categories: [categories[0], categories[1]],
        },
        {
          id: 2,
          version: 3,
          title: 'React Contract Patterns',
          author: 'F. Frontend',
          isbn: '9780000000028',
          publicationYear: 2025,
          categories: [categories[2]],
        },
        {
          id: 3,
          version: 2,
          title: 'Testing Same-Origin Apps',
          author: 'Q. Tester',
          isbn: '9780000000035',
          publicationYear: 2023,
          categories: [categories[1], categories[2]],
        },
      ]
  const localizations: LocalizationResponse[] = empty
    ? []
    : [
        {
          id: 1,
          messageKey: 'catalog.books.empty',
          language: 'en',
          messageText: 'No books match these filters.',
          description: 'Empty catalog search result.',
          createdAt: '2026-06-07T10:00:00Z',
          updatedAt: '2026-06-07T10:00:00Z',
        },
        {
          id: 2,
          messageKey: 'error.mock.read',
          language: 'en',
          messageText: 'Mock API read failed.',
          description: 'Representative localized mock error.',
          createdAt: '2026-06-07T10:05:00Z',
          updatedAt: '2026-06-07T10:05:00Z',
        },
      ]

  return {
    account,
    adminUsers: empty ? [] : [toAdminUser(account), createUserAccount()],
    auditLogs: empty ? [] : createAuditLogs(),
    books,
    categories,
    currentSession: options.session ?? 'admin',
    localizations,
    nextBookId: 4,
    nextCategoryId: 4,
    nextLocalizationId: 3,
  }
}

export function createMockApiHandler(options: MockApiOptions = {}) {
  const scenario = options.scenario ?? 'success'
  const delayMs = Math.max(0, options.delayMs ?? 0)
  const state = createMockApiState(options)

  async function handler(request: Request): Promise<Response | undefined> {
    const url = new URL(request.url)

    if (!url.pathname.startsWith('/api/')) {
      return undefined
    }

    if (delayMs > 0) {
      await delay(delayMs)
    }

    if (request.method === 'GET' && isAdvertisedLoginPath(state, url.pathname)) {
      state.currentSession = 'admin'
      state.account = createAccount('admin')
      state.adminUsers = upsertAdminUser(state.adminUsers, toAdminUser(state.account))

      return redirectWithCookies('/')
    }

    if (scenario === 'error' && request.method === 'GET' && isErrorReadPath(url.pathname)) {
      return problem(503, 'error.mock.read', request, {
        title: 'Mock API read unavailable',
      })
    }

    if (url.pathname === '/api/session') {
      return routeSession(request, state)
    }

    if (url.pathname === '/api/session/logout') {
      return routeLogout(request, state)
    }

    if (url.pathname === '/api/account') {
      return requireMethod(request, 'GET', () => authenticatedJson(request, state, state.account))
    }

    if (url.pathname === '/api/account/language') {
      return requireMethod(request, 'PUT', async () => {
        const csrfFailure = validateUnsafeWrite(request, state)

        if (csrfFailure) {
          return csrfFailure
        }

        const body = await readJson<components['schemas']['UserAccountLanguageRequest']>(request)
        state.account = {
          ...state.account,
          preferredLanguage: body.preferredLanguage?.trim() || undefined,
          updatedAt: now(),
        }

        return json(state.account)
      })
    }

    const bookId = matchId(url.pathname, /^\/api\/books\/(\d+)$/)

    if (bookId !== undefined) {
      return routeBook(request, state, bookId)
    }

    if (url.pathname === '/api/books') {
      return routeBooks(request, state, url)
    }

    const categoryId = matchId(url.pathname, /^\/api\/categories\/(\d+)$/)

    if (categoryId !== undefined) {
      return routeCategory(request, state, categoryId)
    }

    if (url.pathname === '/api/categories') {
      return routeCategories(request, state)
    }

    const localizationId = matchId(url.pathname, /^\/api\/localizations\/(\d+)$/)

    if (localizationId !== undefined) {
      return routeLocalization(request, state, localizationId)
    }

    if (url.pathname === '/api/localizations') {
      return routeLocalizations(request, state, url)
    }

    if (url.pathname === '/api/admin/users') {
      return requireMethod(request, 'GET', () => adminJson(request, state, state.adminUsers))
    }

    const userRolesId = matchId(url.pathname, /^\/api\/admin\/users\/(\d+)\/roles$/)

    if (userRolesId !== undefined) {
      return routeAdminUserRoles(request, state, userRolesId)
    }

    if (url.pathname === '/api/admin/operator-surface') {
      return requireMethod(request, 'GET', () =>
        adminJson(request, state, createOperatorSurface(state)),
      )
    }

    if (url.pathname === '/api/admin/audit-logs') {
      return requireMethod(request, 'GET', () =>
        adminJson(request, state, createAuditLogPage(state.auditLogs, url)),
      )
    }

    return problem(404, 'error.notFound', request)
  }

  return Object.assign(handler, { state })
}

export function createMockApiOptionsFromEnv(env: Record<string, string | undefined>): MockApiOptions {
  return {
    delayMs: parseDelay(env.FRONTEND_MOCK_API_DELAY_MS),
    scenario: parseScenario(env.FRONTEND_MOCK_API_SCENARIO),
    session: parseSession(env.FRONTEND_MOCK_SESSION),
  }
}

async function routeSession(request: Request, state: MockApiState) {
  return requireMethod(request, 'GET', () => json(createSession(state.currentSession), 200, sessionCookieHeaders(state.currentSession)))
}

async function routeLogout(request: Request, state: MockApiState) {
  return requireMethod(request, 'POST', () => {
    if (state.currentSession !== 'anonymous') {
      const csrfFailure = validateUnsafeWrite(request, state)

      if (csrfFailure) {
        return csrfFailure
      }
    }

    state.currentSession = 'anonymous'

    return empty(204, clearSessionCookieHeaders())
  })
}

async function routeBooks(request: Request, state: MockApiState, url: URL) {
  if (request.method === 'GET') {
    const publicationYearFilterProblem = validatePublicationYearFilters(request, url)

    if (publicationYearFilterProblem) {
      return publicationYearFilterProblem
    }

    return json(pageBooks(filterBooks(state.books, url), url))
  }

  if (request.method === 'POST') {
    const csrfFailure = validateUnsafeWrite(request, state)

    if (csrfFailure) {
      return csrfFailure
    }

    const body = await readJson<BookCreateRequest>(request)
    const book: Book = {
      id: state.nextBookId,
      version: 1,
      title: body.title,
      author: body.author,
      isbn: body.isbn,
      publicationYear: body.publicationYear,
      categories: categoriesByName(state.categories, body.categories),
    }
    state.nextBookId += 1
    state.books.push(book)

    return json(book, 201)
  }

  return problem(405, 'error.methodNotAllowed', request)
}

async function routeBook(request: Request, state: MockApiState, id: number) {
  const book = state.books.find((item) => item.id === id)

  if (!book) {
    return problem(404, 'error.book.notFound', request)
  }

  if (request.method === 'GET') {
    return json(book)
  }

  if (request.method === 'PUT') {
    const csrfFailure = validateUnsafeWrite(request, state)

    if (csrfFailure) {
      return csrfFailure
    }

    const body = await readJson<BookUpdateRequest>(request)

    if (body.version !== book.version) {
      return problem(409, 'error.book.versionConflict', request)
    }

    const updated: Book = {
      ...book,
      title: body.title,
      author: body.author,
      publicationYear: body.publicationYear,
      categories: categoriesByName(state.categories, body.categories),
      version: (book.version ?? 0) + 1,
    }
    state.books = state.books.map((item) => (item.id === id ? updated : item))

    return json(updated)
  }

  if (request.method === 'DELETE') {
    const csrfFailure = validateUnsafeWrite(request, state)

    if (csrfFailure) {
      return csrfFailure
    }

    state.books = state.books.filter((item) => item.id !== id)

    return empty(204)
  }

  return problem(405, 'error.methodNotAllowed', request)
}

async function routeCategories(request: Request, state: MockApiState) {
  if (request.method === 'GET') {
    return json(state.categories)
  }

  if (request.method === 'POST') {
    const csrfFailure = validateUnsafeWrite(request, state)

    if (csrfFailure) {
      return csrfFailure
    }

    const body = await readJson<CategoryCreateRequest>(request)
    const category = { id: state.nextCategoryId, name: body.name } satisfies Category
    state.nextCategoryId += 1
    state.categories.push(category)

    return json(category, 201)
  }

  return problem(405, 'error.methodNotAllowed', request)
}

async function routeCategory(request: Request, state: MockApiState, id: number) {
  const category = state.categories.find((item) => item.id === id)

  if (!category) {
    return problem(404, 'error.category.notFound', request)
  }

  if (request.method === 'PUT') {
    const csrfFailure = validateUnsafeWrite(request, state)

    if (csrfFailure) {
      return csrfFailure
    }

    const body = await readJson<CategoryUpdateRequest>(request)
    const updated = { ...category, name: body.name } satisfies Category
    state.categories = state.categories.map((item) => (item.id === id ? updated : item))
    state.books = state.books.map((book) => ({
      ...book,
      categories: book.categories?.map((bookCategory) =>
        bookCategory.id === id ? updated : bookCategory,
      ),
    }))

    return json(updated)
  }

  if (request.method === 'DELETE') {
    const csrfFailure = validateUnsafeWrite(request, state)

    if (csrfFailure) {
      return csrfFailure
    }

    state.categories = state.categories.filter((item) => item.id !== id)
    state.books = state.books.map((book) => ({
      ...book,
      categories: book.categories?.filter((bookCategory) => bookCategory.id !== id),
    }))

    return empty(204)
  }

  return problem(405, 'error.methodNotAllowed', request)
}

async function routeLocalizations(request: Request, state: MockApiState, url: URL) {
  if (request.method === 'GET') {
    return json(pageLocalizations(filterLocalizations(state.localizations, url), url))
  }

  if (request.method === 'POST') {
    const csrfFailure = validateUnsafeWrite(request, state)

    if (csrfFailure) {
      return csrfFailure
    }

    const body = await readJson<LocalizationRequest>(request)
    const localization: LocalizationResponse = {
      id: state.nextLocalizationId,
      ...body,
      createdAt: now(),
      updatedAt: now(),
    }
    state.nextLocalizationId += 1
    state.localizations.push(localization)

    return json(localization, 201)
  }

  return problem(405, 'error.methodNotAllowed', request)
}

async function routeLocalization(request: Request, state: MockApiState, id: number) {
  const localization = state.localizations.find((item) => item.id === id)

  if (!localization) {
    return problem(404, 'error.localization.notFound', request)
  }

  if (request.method === 'GET') {
    return json(localization)
  }

  if (request.method === 'PUT') {
    const csrfFailure = validateUnsafeWrite(request, state)

    if (csrfFailure) {
      return csrfFailure
    }

    const body = await readJson<LocalizationRequest>(request)
    const updated = { ...localization, ...body, updatedAt: now() } satisfies LocalizationResponse
    state.localizations = state.localizations.map((item) => (item.id === id ? updated : item))

    return json(updated)
  }

  if (request.method === 'DELETE') {
    const csrfFailure = validateUnsafeWrite(request, state)

    if (csrfFailure) {
      return csrfFailure
    }

    state.localizations = state.localizations.filter((item) => item.id !== id)

    return empty(204)
  }

  return problem(405, 'error.methodNotAllowed', request)
}

async function routeAdminUserRoles(request: Request, state: MockApiState, id: number) {
  return requireMethod(request, 'PUT', async () => {
    const adminFailure = validateAdminAccess(request, state)

    if (adminFailure) {
      return adminFailure
    }

    const csrfFailure = validateUnsafeWrite(request, state)

    if (csrfFailure) {
      return csrfFailure
    }

    const body = await readJson<AdminUserRoleUpdateRequest>(request)
    const user = state.adminUsers.find((item) => item.id === id)

    if (!body.reason.trim()) {
      return problem(400, 'error.adminUser.reasonRequired', request)
    }

    if (!user) {
      return problem(404, 'error.adminUser.notFound', request)
    }

    const updated: AdminUser = {
      ...user,
      roles: body.roles,
      roleGrants: body.roles.map((role) => ({
        role,
        source: 'ADMIN_MANAGED',
        grantedAt: now(),
        grantedByUserId: state.account.id,
        grantedByLogin: state.account.login,
        reason: body.reason,
      })),
      updatedAt: now(),
    }
    state.adminUsers = state.adminUsers.map((item) => (item.id === id ? updated : item))

    return json(updated)
  })
}

function createSession(kind: MockSessionKind): Session {
  const authenticated = kind !== 'anonymous'

  return {
    authenticated,
    accountPath: authenticated ? '/api/account' : undefined,
    loginProviders: authenticated
      ? []
      : [
          {
            registrationId: 'mock-admin',
            clientName: 'Mock administrator',
            authorizationPath: MOCK_LOGIN_PATH,
          },
        ],
    logoutPath: '/api/session/logout',
    sessionCookie: {
      name: SESSION_COOKIE,
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
    },
    csrf: {
      enabled: true,
      cookieName: CSRF_COOKIE,
      headerName: CSRF_HEADER,
    },
  }
}

function isAdvertisedLoginPath(state: MockApiState, pathname: string) {
  return (createSession(state.currentSession).loginProviders ?? []).some(
    (provider) => provider.authorizationPath === pathname,
  )
}

function createAccount(kind: MockSessionKind): Account {
  const admin = kind !== 'user'

  return {
    id: admin ? 1 : 2,
    provider: 'mock',
    login: admin ? 'admin-user' : 'standard-user',
    displayName: admin ? 'Mock Admin' : 'Mock User',
    email: admin ? 'admin@example.test' : 'user@example.test',
    preferredLanguage: 'en',
    roles: admin ? ['USER', 'ADMIN'] : ['USER'],
    lastLoginAt: '2026-06-07T09:30:00Z',
    createdAt: '2026-06-07T09:00:00Z',
    updatedAt: '2026-06-07T09:30:00Z',
  }
}

function createUserAccount(): AdminUser {
  return {
    id: 2,
    provider: 'mock',
    login: 'standard-user',
    displayName: 'Mock User',
    email: 'user@example.test',
    preferredLanguage: 'en',
    roles: ['USER'],
    roleGrants: [
      {
        role: 'USER',
        source: 'AUTHENTICATED_LOGIN',
        grantedAt: '2026-06-07T09:10:00Z',
        reason: 'Mock user login',
      },
    ],
    lastLoginAt: '2026-06-07T09:30:00Z',
    createdAt: '2026-06-07T09:10:00Z',
    updatedAt: '2026-06-07T09:30:00Z',
  }
}

function toAdminUser(account: Account): AdminUser {
  return {
    ...account,
    roleGrants: (account.roles ?? []).map((role) => ({
      role,
      source: role === 'ADMIN' ? 'BOOTSTRAP' : 'AUTHENTICATED_LOGIN',
      grantedAt: '2026-06-07T09:00:00Z',
      grantedByLogin: role === 'ADMIN' ? 'system' : undefined,
      reason: role === 'ADMIN' ? 'Mock administrator' : 'Mock login',
    })),
  }
}

function upsertAdminUser(users: readonly AdminUser[], user: AdminUser) {
  if (user.id === undefined) {
    return [...users]
  }

  return users.some((item) => item.id === user.id)
    ? users.map((item) => (item.id === user.id ? user : item))
    : [user, ...users]
}

function createAuditLogs(): AuditLog[] {
  return [
    {
      id: 101,
      targetType: 'BOOK',
      targetId: 1,
      action: 'UPDATE',
      actorLogin: 'admin-user',
      summary: 'Updated mock book fixture',
      details: { title: { before: 'Old title', after: 'Spring Boot Interview Notes' } },
      createdAt: '2026-06-07T10:10:00Z',
    },
    {
      id: 100,
      targetType: 'AUTHENTICATION',
      targetId: 1,
      action: 'LOGIN_SUCCESS',
      actorLogin: 'admin-user',
      summary: 'Mock login succeeded',
      details: {},
      createdAt: '2026-06-07T09:30:00Z',
    },
  ]
}

function createOperatorSurface(state: MockApiState): OperatorSurface {
  return {
    audit: {
      auditLogEndpoint: '/api/admin/audit-logs',
      totalEntries: state.auditLogs.length,
      recentEntries: state.auditLogs.slice(0, 5),
    },
    runtime: {
      technicalOverviewEndpoint: '/api/admin/operator-surface',
      technicalOverview: {
        build: {
          name: 'technical-interview-demo',
          version: 'mock',
          time: '2026-06-07T10:00:00Z',
        },
        runtime: {
          applicationName: 'technical-interview-demo',
          activeProfiles: ['mock'],
        },
        configuration: {
          pagination: {
            defaultPageSize: 20,
            maxPageSize: 100,
          },
          session: {
            cookieName: SESSION_COOKIE,
            cookieHttpOnly: true,
            cookieSameSite: 'Lax',
          },
          security: {
            csrfEnabled: true,
            csrfCookieName: CSRF_COOKIE,
            csrfHeaderName: CSRF_HEADER,
            publicApiPathPattern: '/api/**',
            oauthAuthorizationBasePath: '/api/session',
          },
        },
      },
    },
    operations: {
      applicationHealthStatus: 'UP',
      livenessState: 'CORRECT',
      readinessState: 'ACCEPTING_TRAFFIC',
    },
  }
}

function validatePublicationYearFilters(request: Request, url: URL) {
  if (
    url.searchParams.has('year') &&
    (url.searchParams.has('yearFrom') || url.searchParams.has('yearTo'))
  ) {
    return problem(400, 'error.request.invalid_filter', request, {
      detail: 'Exact publication year cannot be combined with yearFrom or yearTo.',
      title: 'Invalid book filter',
    })
  }

  return undefined
}

function filterBooks(books: readonly Book[], url: URL) {
  const categories = url.searchParams.getAll('category').map(normalize)
  const title = normalize(url.searchParams.get('title') ?? undefined)
  const author = normalize(url.searchParams.get('author') ?? undefined)
  const isbn = normalize(url.searchParams.get('isbn') ?? undefined)
  const year = parseOptionalNumber(url.searchParams.get('year'))
  const yearFrom = parseOptionalNumber(url.searchParams.get('yearFrom'))
  const yearTo = parseOptionalNumber(url.searchParams.get('yearTo'))

  return sortRows(
    books.filter((book) => {
      const bookCategories = (book.categories ?? []).map((category) => normalize(category.name))

      return (
        (!title || normalize(book.title).includes(title)) &&
        (!author || normalize(book.author).includes(author)) &&
        (!isbn || normalize(book.isbn).includes(isbn)) &&
        (year === undefined || book.publicationYear === year) &&
        (yearFrom === undefined || (book.publicationYear ?? 0) >= yearFrom) &&
        (yearTo === undefined || (book.publicationYear ?? 0) <= yearTo) &&
        categories.every((category) => bookCategories.includes(category))
      )
    }),
    url,
  )
}

function filterLocalizations(rows: readonly LocalizationResponse[], url: URL) {
  const key = normalize(url.searchParams.get('messageKey') ?? undefined)
  const language = normalize(url.searchParams.get('language') ?? undefined)

  return sortRows(
    rows.filter(
      (row) =>
        (!key || normalize(row.messageKey).includes(key)) &&
        (!language || normalize(row.language) === language),
    ),
    url,
  )
}

function createAuditLogPage(rows: readonly AuditLog[], url: URL): AuditLogPage {
  const targetType = url.searchParams.get('targetType')
  const action = url.searchParams.get('action')
  const actorLogin = normalize(url.searchParams.get('actorLogin') ?? undefined)
  const filtered = sortRows(
    rows.filter(
      (row) =>
        (!targetType || row.targetType === targetType) &&
        (!action || row.action === action) &&
        (!actorLogin || normalize(row.actorLogin).includes(actorLogin)),
    ),
    url,
  )
  const page = paginate(filtered, url)

  return {
    ...page,
    content: page.content,
    pageable: {},
    sort: {},
  }
}

function pageBooks(rows: readonly Book[], url: URL): BookPage {
  return paginate(rows, url)
}

function pageLocalizations(rows: readonly LocalizationResponse[], url: URL): LocalizationPage {
  return paginate(rows, url)
}

function paginate<T>(rows: readonly T[], url: URL) {
  const size = Math.max(1, parseOptionalNumber(url.searchParams.get('size')) ?? 10)
  const number = Math.max(0, parseOptionalNumber(url.searchParams.get('page')) ?? 0)
  const start = number * size
  const content = rows.slice(start, start + size)
  const totalPages = rows.length === 0 ? 0 : Math.ceil(rows.length / size)

  return {
    totalPages,
    totalElements: rows.length,
    size,
    content,
    number,
    first: number === 0,
    last: totalPages === 0 || number >= totalPages - 1,
    numberOfElements: content.length,
    sort: {
      empty: url.searchParams.getAll('sort').length === 0,
      unsorted: url.searchParams.getAll('sort').length === 0,
      sorted: url.searchParams.getAll('sort').length > 0,
    },
    pageable: {
      offset: start,
      paged: true,
      unpaged: false,
      pageSize: size,
      pageNumber: number,
    },
    empty: content.length === 0,
  }
}

function sortRows<T>(rows: readonly T[], url: URL): T[] {
  const sort = url.searchParams.getAll('sort')

  if (sort.length === 0) {
    return [...rows]
  }

  return [...rows].sort((left, right) => {
    for (const spec of sort) {
      const [field, direction] = spec.split(',')
      const result = compareValues(getField(left, field), getField(right, field))

      if (result !== 0) {
        return direction?.toUpperCase() === 'DESC' ? -result : result
      }
    }

    return 0
  })
}

function getField(value: unknown, field: string | undefined): unknown {
  if (!field || typeof value !== 'object' || value === null) {
    return undefined
  }

  return (value as Record<string, unknown>)[field]
}

function compareValues(left: unknown, right: unknown) {
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right
  }

  return String(left ?? '').localeCompare(String(right ?? ''))
}

function categoriesByName(categories: readonly Category[], names: readonly string[] | undefined) {
  const normalizedNames = new Set((names ?? []).map(normalize))

  return categories.filter((category) => normalizedNames.has(normalize(category.name)))
}

function authenticatedJson(request: Request, state: MockApiState, body: unknown) {
  if (state.currentSession === 'anonymous') {
    return problem(401, 'error.session.required', request)
  }

  return json(body)
}

function adminJson(request: Request, state: MockApiState, body: unknown) {
  const adminFailure = validateAdminAccess(request, state)

  if (adminFailure) {
    return adminFailure
  }

  return json(body)
}

function validateAdminAccess(request: Request, state: MockApiState) {
  if (state.currentSession === 'anonymous') {
    return problem(401, 'error.session.required', request)
  }

  if (!state.account.roles?.includes('ADMIN')) {
    return problem(403, 'error.accessDenied', request)
  }

  return undefined
}

function validateUnsafeWrite(request: Request, state: MockApiState) {
  if (state.currentSession === 'anonymous') {
    return problem(401, 'error.session.required', request)
  }

  const cookieToken = readCookie(request.headers.get('Cookie') ?? '', CSRF_COOKIE)
  const headerToken = request.headers.get(CSRF_HEADER)

  if (!cookieToken || cookieToken !== CSRF_TOKEN || headerToken !== CSRF_TOKEN) {
    return problem(403, 'error.csrf.invalid', request)
  }

  return undefined
}

function requireMethod(request: Request, method: string, next: () => Response | Promise<Response>) {
  if (request.method !== method) {
    return problem(405, 'error.methodNotAllowed', request)
  }

  return next()
}

async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T
}

function isErrorReadPath(pathname: string) {
  return READ_ERROR_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

function matchId(pathname: string, pattern: RegExp) {
  const match = pattern.exec(pathname)

  if (!match) {
    return undefined
  }

  return Number(match[1])
}

function json(body: unknown, status = 200, headers: MockHeadersInit = {}) {
  const responseHeaders = createHeaders(headers)
  responseHeaders.set('Content-Type', JSON_HEADERS['Content-Type'])

  return new Response(JSON.stringify(body), {
    headers: responseHeaders,
    status,
  })
}

function empty(status = 204, headers: MockHeadersInit = {}) {
  return new Response(null, { headers, status })
}

function problem(status: number, messageKey: string, request: Request, overrides: Partial<ApiProblem> = {}) {
  const language = resolveLanguage(request)
  const body: ApiProblem = {
    title: overrides.title ?? 'Mock API problem',
    status,
    detail: overrides.detail ?? messageKey,
    messageKey,
    message: localizedMessage(messageKey, language),
    language,
  }

  return json(body, status)
}

function localizedMessage(messageKey: string, language: string) {
  if (language === 'pl') {
    return `Problem mock API: ${messageKey}`
  }

  return `Mock API problem: ${messageKey}`
}

function resolveLanguage(request: Request) {
  const acceptLanguage = request.headers.get('Accept-Language')?.split(',')[0]?.split('-')[0]?.trim()

  if (acceptLanguage) {
    return acceptLanguage
  }

  return readCookie(request.headers.get('Cookie') ?? '', 'language') ?? 'en'
}

function redirectWithCookies(location: string) {
  const headers = createHeaders(sessionCookieHeaders('admin'))
  headers.set('Location', location)

  return new Response(null, {
    headers,
    status: 302,
  })
}

function sessionCookieHeaders(kind: MockSessionKind): [string, string][] {
  if (kind === 'anonymous') {
    return []
  }

  return [
    ['Set-Cookie', `${SESSION_COOKIE}=mock-${kind}; Path=/; SameSite=Lax; HttpOnly`],
    ['Set-Cookie', `${CSRF_COOKIE}=${CSRF_TOKEN}; Path=/; SameSite=Lax`],
  ]
}

function clearSessionCookieHeaders(): [string, string][] {
  return [
    ['Set-Cookie', `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`],
    ['Set-Cookie', `${CSRF_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`],
  ]
}

function createHeaders(headers: MockHeadersInit) {
  const result = new Headers()

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      result.append(key, value)
    })
  } else if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      result.append(key, value)
    }
  } else {
    for (const [key, value] of Object.entries(headers)) {
      result.append(key, value)
    }
  }

  return result
}

function readCookie(cookieSource: string, name: string) {
  for (const cookie of cookieSource.split(';')) {
    const [rawName, ...rawValue] = cookie.trim().split('=')

    if (rawName === name) {
      return rawValue.join('=')
    }
  }

  return undefined
}

function parseScenario(value: string | undefined): MockApiScenario {
  return value === 'empty' || value === 'error' ? value : 'success'
}

function parseSession(value: string | undefined): MockSessionKind {
  return value === 'user' || value === 'anonymous' ? value : 'admin'
}

function parseDelay(value: string | undefined) {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function parseOptionalNumber(value: string | null) {
  if (value === null) {
    return undefined
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : undefined
}

function normalize(value: string | undefined) {
  return value?.trim().toLowerCase() ?? ''
}

function now() {
  return new Date().toISOString()
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
