import { ApiRequestError, isBackendUnavailableError } from '../api/http'
import type { UiTranslate } from '../i18n/useI18n'

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'error'; message: string; unreachable?: boolean; httpStatus?: number }

export type MutationState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

export function getDisplayMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

// Load effects store the unreachable classification as a stable flag instead
// of localized text, so the message can localize at render time without the
// effect depending on the translate function.
export function createLoadError(
  error: unknown,
  fallback: string,
): {
  status: 'error'
  message: string
  unreachable: boolean
  httpStatus?: number
} {
  return {
    status: 'error',
    message: getDisplayMessage(error, fallback),
    unreachable: isBackendUnavailableError(error),
    httpStatus: error instanceof ApiRequestError ? error.status : undefined,
  }
}

export function getLoadErrorMessage(
  t: UiTranslate,
  state: { message: string; unreachable?: boolean },
) {
  return state.unreachable === true
    ? t('ui.common.backend-unavailable')
    : state.message
}

// Backend-unavailable failures never expose their technical message; mutation
// catch sites route through this so outage messaging stays localized while
// problem-details messages keep the backend-localized text.
export function getApiDisplayMessage(
  t: UiTranslate,
  error: unknown,
  fallback: string,
) {
  if (isBackendUnavailableError(error)) {
    return t('ui.common.backend-unavailable')
  }

  return getDisplayMessage(error, fallback)
}
