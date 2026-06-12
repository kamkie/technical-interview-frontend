import type { components } from './generated/openapi'
import {
  createJsonReadHeaders,
  fetchBackendRead,
  fetchBackendWrite,
  getActiveLanguageHeaders,
  type FetchImplementation,
} from './http'
import { appendNumber, appendString, appendStringList } from './query'
import { getCsrfHeaders, type SessionResponse } from './session'

export const LOCALIZATIONS_PATH = '/api/localizations' as const
export const DEFAULT_LOCALIZATION_PAGE_SIZE = 20
export const DEFAULT_LOCALIZATION_SORT = ['messageKey,ASC', 'language,ASC'] as const
export const SUPPORTED_LOCALIZATION_LANGUAGES = [
  'en',
  'es',
  'de',
  'fr',
  'pl',
  'uk',
  'no',
] as const

export type SupportedLocalizationLanguage =
  (typeof SUPPORTED_LOCALIZATION_LANGUAGES)[number]
export type LocalizationRequest = components['schemas']['LocalizationRequest']
export type LocalizationResponse = components['schemas']['LocalizationResponse']
export type LocalizationPage =
  components['schemas']['PageLocalizationResponse']
export type LocalizationCoverageStatus =
  | 'complete'
  | 'partial'
  | 'missing'
  | 'conflict'
  | 'unknown'

export type LocalizationSearchParams = {
  messageKey?: string
  language?: string
  page?: number
  size?: number
  sort?: readonly string[]
}

export type LocalizationFetchOptions = {
  acceptLanguage?: string
  fetchImplementation?: FetchImplementation
}

export type LocalizationMutationOptions = {
  cookieSource?: string
  fetchImplementation?: FetchImplementation
}

export type LocalizationLocaleCoverage = {
  language: SupportedLocalizationLanguage
  rows: LocalizationResponse[]
  status: LocalizationCoverageStatus
}

export type LocalizationKeyCoverage = {
  messageKey: string
  locales: LocalizationLocaleCoverage[]
  rows: LocalizationResponse[]
  status: LocalizationCoverageStatus
}

export async function fetchLocalizations(
  params: LocalizationSearchParams = {},
  options: LocalizationFetchOptions = {},
): Promise<LocalizationPage> {
  const path = buildLocalizationSearchPath(params)

  return fetchLocalizationJson<LocalizationPage>(path, options)
}

export async function fetchLocalization(
  id: number,
  options: LocalizationFetchOptions = {},
): Promise<LocalizationResponse> {
  return fetchLocalizationJson<LocalizationResponse>(
    getLocalizationPath(id),
    options,
  )
}

export async function createLocalization(
  session: SessionResponse,
  request: LocalizationRequest,
  options: LocalizationMutationOptions = {},
): Promise<LocalizationResponse> {
  return fetchLocalizationMutationJson(
    'POST',
    LOCALIZATIONS_PATH,
    session,
    request,
    options,
  )
}

export async function updateLocalization(
  session: SessionResponse,
  id: number,
  request: LocalizationRequest,
  options: LocalizationMutationOptions = {},
): Promise<LocalizationResponse> {
  return fetchLocalizationMutationJson(
    'PUT',
    getLocalizationPath(id),
    session,
    request,
    options,
  )
}

export async function deleteLocalization(
  session: SessionResponse,
  id: number,
  options: LocalizationMutationOptions = {},
): Promise<void> {
  await fetchLocalizationMutation('DELETE', getLocalizationPath(id), session, {}, options)
}

export function buildLocalizationSearchPath(
  params: LocalizationSearchParams = {},
) {
  const search = new URLSearchParams()

  appendString(search, 'messageKey', params.messageKey)
  appendString(search, 'language', params.language)
  appendNumber(search, 'page', params.page)
  appendNumber(search, 'size', params.size)
  appendStringList(search, 'sort', params.sort)

  const query = search.toString()

  return query ? `${LOCALIZATIONS_PATH}?${query}` : LOCALIZATIONS_PATH
}

export function getLocalizationPath(id: number) {
  return `${LOCALIZATIONS_PATH}/${encodeURIComponent(String(id))}`
}

export function getLocalizationCoverage(
  rows: readonly LocalizationResponse[],
  options: {
    languageFilter?: string
    loadFailed?: boolean
    messageKeyFilter?: string
  } = {},
): LocalizationKeyCoverage[] {
  const normalizedKeyFilter = normalizeKey(options.messageKeyFilter)

  if (options.loadFailed === true) {
    const messageKey = normalizedKeyFilter || 'unknown'

    return [
      {
        messageKey,
        locales: createUnknownLocaleCoverage(),
        rows: [],
        status: 'unknown',
      },
    ]
  }

  const rowsByKey = new Map<string, LocalizationResponse[]>()

  for (const row of rows) {
    const messageKey = normalizeKey(row.messageKey)

    if (!messageKey) {
      continue
    }

    const keyRows = rowsByKey.get(messageKey) ?? []
    keyRows.push(row)
    rowsByKey.set(messageKey, keyRows)
  }

  if (rowsByKey.size === 0 && (normalizedKeyFilter || options.languageFilter)) {
    return [
      {
        messageKey: normalizedKeyFilter || 'missing',
        locales: createMissingLocaleCoverage(),
        rows: [],
        status: 'missing',
      },
    ]
  }

  return [...rowsByKey.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([messageKey, keyRows]) =>
      createKeyCoverage(messageKey, keyRows, options.languageFilter),
    )
}

async function fetchLocalizationJson<T>(
  path: string,
  options: LocalizationFetchOptions,
) {
  const response = await fetchBackendRead(
    options.fetchImplementation ?? globalThis.fetch,
    path,
    createJsonReadHeaders(options.acceptLanguage),
  )

  return (await response.json()) as T
}

async function fetchLocalizationMutationJson(
  method: 'POST' | 'PUT',
  path: string,
  session: SessionResponse,
  body: LocalizationRequest,
  options: LocalizationMutationOptions,
) {
  const response = await fetchLocalizationMutation(
    method,
    path,
    session,
    {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    options,
  )

  return (await response.json()) as LocalizationResponse
}

async function fetchLocalizationMutation(
  method: 'POST' | 'PUT' | 'DELETE',
  path: string,
  session: SessionResponse,
  init: Pick<RequestInit, 'body' | 'headers'>,
  options: LocalizationMutationOptions,
) {
  if (session.authenticated !== true) {
    throw new Error('Localization changes require an authenticated session.')
  }

  return fetchBackendWrite(
    options.fetchImplementation ?? globalThis.fetch,
    method,
    path,
    {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...getActiveLanguageHeaders(),
        ...init.headers,
        ...getCsrfHeaders(session, options.cookieSource),
      },
      body: init.body,
    },
  )
}

function createKeyCoverage(
  messageKey: string,
  rows: readonly LocalizationResponse[],
  languageFilter: string | undefined,
): LocalizationKeyCoverage {
  const rowsByLanguage = new Map<string, LocalizationResponse[]>()

  for (const row of rows) {
    const language = normalizeLanguage(row.language)

    if (!language) {
      continue
    }

    const languageRows = rowsByLanguage.get(language) ?? []
    languageRows.push(row)
    rowsByLanguage.set(language, languageRows)
  }

  const locales = SUPPORTED_LOCALIZATION_LANGUAGES.map((language) => {
    const localeRows = rowsByLanguage.get(language) ?? []

    return {
      language,
      rows: localeRows,
      status: getLocaleCoverageStatus(localeRows),
    }
  })
  const unsupportedConflict = [...rowsByLanguage.values()].some(
    (languageRows) => languageRows.length > 1,
  )
  const hasConflict =
    unsupportedConflict || locales.some((locale) => locale.status === 'conflict')

  if (hasConflict) {
    return {
      messageKey,
      locales,
      rows: [...rows],
      status: 'conflict',
    }
  }

  if (
    languageFilter &&
    SUPPORTED_LOCALIZATION_LANGUAGES.includes(
      languageFilter as SupportedLocalizationLanguage,
    ) &&
    (rowsByLanguage.get(languageFilter)?.length ?? 0) === 0
  ) {
    return {
      messageKey,
      locales,
      rows: [...rows],
      status: 'missing',
    }
  }

  const complete = locales.every((locale) => locale.status === 'complete')
  const hasMessage = locales.some((locale) => locale.status === 'complete')
  const hasMissing = locales.some((locale) => locale.status === 'missing')

  return {
    messageKey,
    locales,
    rows: [...rows],
    status: complete ? 'complete' : hasMessage && hasMissing ? 'partial' : 'missing',
  }
}

function getLocaleCoverageStatus(
  rows: readonly LocalizationResponse[],
): LocalizationCoverageStatus {
  if (rows.length === 0) {
    return 'missing'
  }

  if (rows.length > 1) {
    return 'conflict'
  }

  return hasMessageText(rows[0]) ? 'complete' : 'missing'
}

function createUnknownLocaleCoverage(): LocalizationLocaleCoverage[] {
  return SUPPORTED_LOCALIZATION_LANGUAGES.map((language) => ({
    language,
    rows: [],
    status: 'unknown',
  }))
}

function createMissingLocaleCoverage(): LocalizationLocaleCoverage[] {
  return SUPPORTED_LOCALIZATION_LANGUAGES.map((language) => ({
    language,
    rows: [],
    status: 'missing',
  }))
}

function hasMessageText(row: LocalizationResponse | undefined) {
  return Boolean(row?.messageText?.trim())
}

function normalizeKey(messageKey: string | undefined) {
  return messageKey?.trim() ?? ''
}

function normalizeLanguage(language: string | undefined) {
  return language?.trim().toLowerCase() ?? ''
}
