import { useEffect, useState } from 'react'

import {
  fetchCurrentAccount,
  type UserAccount,
} from '../api/account'
import type { SessionResponse } from '../api/session'

type LoadState<T> =
  | { status: 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'error'; message: string }

export function AccountProfile({ session }: { session: SessionResponse }) {
  const [accountState, setAccountState] = useState<LoadState<UserAccount>>({
    status: 'loading',
  })

  useEffect(() => {
    let ignore = false

    fetchCurrentAccount(session)
      .then((account) => {
        if (!ignore) {
          setAccountState({ status: 'ready', value: account })
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setAccountState({
            status: 'error',
            message: getDisplayMessage(error, 'Account profile could not be loaded.'),
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [session])

  return (
    <section className="account-panel" aria-labelledby="account-title">
      <div className="section-heading">
        <p className="eyebrow">Authenticated account</p>
        <h2 id="account-title">Account</h2>
      </div>

      {accountState.status === 'loading' && (
        <p className="session-message" role="status">
          Loading account...
        </p>
      )}

      {accountState.status === 'error' && (
        <p className="session-message error" role="alert">
          {accountState.message}
        </p>
      )}

      {accountState.status === 'ready' && (
        <AccountProfileDetails account={accountState.value} />
      )}
    </section>
  )
}

function AccountProfileDetails({ account }: { account: UserAccount }) {
  const displayName =
    account.displayName || account.login || account.email || 'Current user'
  const roles = (account.roles ?? []).filter(Boolean)

  return (
    <div className="account-profile">
      <div className="account-summary">
        <div>
          <p className="account-name">{displayName}</p>
          <p className="account-subtitle">{account.provider ?? 'Provider unavailable'}</p>
        </div>
        <div className="account-roles" aria-label="Account roles">
          {roles.length > 0 ? (
            roles.map((role) => (
              <span className="role-pill" key={role}>
                {role}
              </span>
            ))
          ) : (
            <span className="session-message muted">No roles assigned.</span>
          )}
        </div>
      </div>

      <dl className="account-metadata">
        <ProfileField label="Login" value={account.login} />
        <ProfileField label="Email" value={account.email} />
        <ProfileField label="Provider" value={account.provider} />
        <ProfileField label="Preferred language" value={account.preferredLanguage} />
        <ProfileField label="User ID" value={formatNumber(account.id)} />
        <ProfileField label="Last login" value={account.lastLoginAt} />
        <ProfileField label="Created" value={account.createdAt} />
        <ProfileField label="Updated" value={account.updatedAt} />
      </dl>
    </div>
  )
}

function ProfileField({
  label,
  value,
}: {
  label: string
  value: number | string | undefined
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value ?? 'Unavailable'}</dd>
    </div>
  )
}

function formatNumber(value: number | undefined) {
  return value === undefined ? undefined : String(value)
}

function getDisplayMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
