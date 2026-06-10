import { useEffect, useState } from 'react'

import { fetchCurrentAccount, type UserAccount } from '../api/account'
import type { SessionResponse } from '../api/session'
import { getDisplayMessage, type LoadState } from '../ui/asyncState'

const LOADING_STATE: LoadState<UserAccount> = { status: 'loading' }

type AccountRequest = {
  promise: Promise<UserAccount>
  session: SessionResponse
}

let activeRequest: AccountRequest | null = null

function loadCurrentAccount(session: SessionResponse) {
  if (activeRequest?.session !== session) {
    const request: AccountRequest = {
      promise: fetchCurrentAccount(session),
      session,
    }

    activeRequest = request
    request.promise.catch(() => {
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

    let ignore = false

    loadCurrentAccount(session)
      .then((account) => {
        if (!ignore) {
          setLoaded({ session, state: { status: 'ready', value: account } })
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setLoaded({
            session,
            state: {
              status: 'error',
              message: getDisplayMessage(
                error,
                'Account details could not be loaded.',
              ),
            },
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [refreshKey, session])

  return session !== null && loaded?.session === session
    ? loaded.state
    : LOADING_STATE
}
