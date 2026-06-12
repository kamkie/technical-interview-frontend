import { useEffect, useSyncExternalStore } from 'react'

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

export function isUnreachableLoadError(state: {
  status: string
  unreachable?: boolean
}): boolean {
  return state.status === 'error' && state.unreachable === true
}

// One connection story: when the backend is unreachable, the session
// bootstrap in the topbar and the visible page's data loads fail
// independently, so each could otherwise render its own error surface and
// retry without healing the other. The channel below links them: a retry
// pressed on any connection surface — or a request succeeding while other
// surfaces are still stuck — notifies every subscriber, and each subscriber
// reloads only while it still holds a connection error.

type ConnectionRecoveryListener = () => void

const connectionRecoveryListeners = new Set<ConnectionRecoveryListener>()

export function requestConnectionRecovery() {
  for (const listener of [...connectionRecoveryListeners]) {
    listener()
  }
}

export function subscribeToConnectionRecovery(
  listener: ConnectionRecoveryListener,
) {
  connectionRecoveryListeners.add(listener)

  return () => {
    connectionRecoveryListeners.delete(listener)
  }
}

// Pages register their visible connection-error block here so the topbar
// renders its own session surface only while no page-level block is telling
// the same story: one reachability surface at a time.
let pageConnectionSurfaceCount = 0
const pageConnectionSurfaceListeners = new Set<() => void>()

function adjustPageConnectionSurfaceCount(delta: number) {
  pageConnectionSurfaceCount += delta

  for (const listener of [...pageConnectionSurfaceListeners]) {
    listener()
  }
}

function subscribeToPageConnectionSurfaces(listener: () => void) {
  pageConnectionSurfaceListeners.add(listener)

  return () => {
    pageConnectionSurfaceListeners.delete(listener)
  }
}

function hasPageConnectionSurface() {
  return pageConnectionSurfaceCount > 0
}

export function usePageConnectionSurface(active: boolean) {
  useEffect(() => {
    if (!active) {
      return undefined
    }

    adjustPageConnectionSurfaceCount(1)

    return () => {
      adjustPageConnectionSurfaceCount(-1)
    }
  }, [active])
}

export function useHasPageConnectionSurface(): boolean {
  return useSyncExternalStore(
    subscribeToPageConnectionSurfaces,
    hasPageConnectionSurface,
  )
}
