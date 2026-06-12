import { useEffect, useState } from 'react'

import { fetchCurrentAccount, type UserAccount } from '../api/account'
import type { SessionResponse } from '../api/session'
import { createLoadError, type LoadState } from '../ui/asyncState'

const LOADING_STATE: LoadState<UserAccount> = { status: 'loading' }

type AccountRequest = {
  promise: Promise<UserAccount>
  session: SessionResponse
}

let activeRequest: AccountRequest | null = null
const accountUpdateListeners = new Set<() => void>()
const accountValueListeners = new Set<(account: UserAccount) => void>()

// Account mutations publish their response here so every mounted consumer
// (topbar menus, admin gates) re-reads the fresh account instead of the
// session-lifetime cache entry captured at bootstrap.
export function publishAccountUpdate(
  session: SessionResponse,
  account: UserAccount,
) {
  activeRequest = {
    promise: Promise.resolve(account),
    session,
  }

  for (const listener of [...accountUpdateListeners]) {
    listener()
  }

  notifyAccountValue(account)
}

// Value subscribers (the i18n provider) receive every resolved account —
// initial loads and published mutations — without needing a session prop.
export function subscribeToAccountValues(
  listener: (account: UserAccount) => void,
) {
  accountValueListeners.add(listener)

  return () => {
    accountValueListeners.delete(listener)
  }
}

function notifyAccountValue(account: UserAccount) {
  for (const listener of [...accountValueListeners]) {
    listener(account)
  }
}

function loadCurrentAccount(session: SessionResponse) {
  if (activeRequest?.session !== session) {
    const request: AccountRequest = {
      promise: fetchCurrentAccount(session),
      session,
    }

    activeRequest = request
    request.promise
      .then((account) => {
        if (activeRequest === request) {
          notifyAccountValue(account)
        }
      })
      .catch(() => {
        // Failures are not cached, so the next consumer mount or refresh
        // retries instead of hiding role-gated UI for the whole session.
        if (activeRequest === request) {
          activeRequest = null
        }
      })
  }

  return activeRequest.promise
}

export function useCurrentAccount(
  session: SessionResponse | null,
  refreshKey?: unknown,
): LoadState<UserAccount> {
  const [loaded, setLoaded] = useState<{
    session: SessionResponse
    state: LoadState<UserAccount>
  } | null>(null)

  useEffect(() => {
    if (session === null) {
      return undefined
    }

    const activeSession = session
    let ignore = false

    function applyCurrentAccount() {
      loadCurrentAccount(activeSession)
        .then((account) => {
          if (!ignore) {
            setLoaded({
              session: activeSession,
              state: { status: 'ready', value: account },
            })
          }
        })
        .catch((error: unknown) => {
          if (!ignore) {
            setLoaded({
              session: activeSession,
              state: createLoadError(
                error,
                'Account details could not be loaded.',
              ),
            })
          }
        })
    }

    applyCurrentAccount()
    accountUpdateListeners.add(applyCurrentAccount)

    return () => {
      ignore = true
      accountUpdateListeners.delete(applyCurrentAccount)
    }
  }, [refreshKey, session])

  return session !== null && loaded?.session === session
    ? loaded.state
    : LOADING_STATE
}
