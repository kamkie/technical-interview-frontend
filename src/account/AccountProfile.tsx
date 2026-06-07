import { useEffect, useState } from 'react'

import {
  fetchCurrentAccount,
  updateAccountLanguage,
  type UserAccount,
} from '../api/account'
import type { SessionResponse } from '../api/session'
import { getDisplayMessage, type LoadState } from '../ui/asyncState'

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
        <p className="section-description">
          Review the current account profile and update preferences for this
          session.
        </p>
      </div>

      {accountState.status === 'loading' && (
        <div className="state-block loading-state">
          <p className="state-block-title">Loading account profile</p>
          <p className="session-message" role="status">
            Loading account...
          </p>
        </div>
      )}

      {accountState.status === 'error' && (
        <div className="state-block error-state">
          <p className="state-block-title">Account profile unavailable</p>
          <p className="session-message error" role="alert">
            {accountState.message}
          </p>
        </div>
      )}

      {accountState.status === 'ready' && (
        <AccountProfileDetails
          account={accountState.value}
          session={session}
          onAccountChange={(account) => {
            setAccountState({ status: 'ready', value: account })
          }}
        />
      )}
    </section>
  )
}

function AccountProfileDetails({
  account,
  onAccountChange,
  session,
}: {
  account: UserAccount
  onAccountChange: (account: UserAccount) => void
  session: SessionResponse
}) {
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
        <ProfileField
          label="Preferred language"
          value={account.preferredLanguage ?? 'No preference'}
        />
        <ProfileField label="User ID" value={formatNumber(account.id)} />
        <ProfileField label="Last login" value={account.lastLoginAt} />
        <ProfileField label="Created" value={account.createdAt} />
        <ProfileField label="Updated" value={account.updatedAt} />
      </dl>

      <LanguagePreferenceForm
        account={account}
        key={account.id ?? 'current'}
        session={session}
        onAccountChange={onAccountChange}
      />
    </div>
  )
}

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English (en)' },
  { value: 'es', label: 'Spanish (es)' },
  { value: 'de', label: 'German (de)' },
  { value: 'fr', label: 'French (fr)' },
  { value: 'pl', label: 'Polish (pl)' },
  { value: 'uk', label: 'Ukrainian (uk)' },
  { value: 'no', label: 'Norwegian (no)' },
] as const

type LanguageMutationState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

function LanguagePreferenceForm({
  account,
  onAccountChange,
  session,
}: {
  account: UserAccount
  onAccountChange: (account: UserAccount) => void
  session: SessionResponse
}) {
  const currentLanguage = account.preferredLanguage?.trim() ?? ''
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage)
  const [mutationState, setMutationState] = useState<LanguageMutationState>({
    status: 'idle',
  })
  const submitting = mutationState.status === 'submitting'
  const unchanged = selectedLanguage === currentLanguage
  const canClear = Boolean(currentLanguage || selectedLanguage)

  async function submitLanguage(preferredLanguage: string) {
    setMutationState({ status: 'submitting' })

    try {
      const updatedAccount = await updateAccountLanguage(
        session,
        preferredLanguage,
      )
      onAccountChange(updatedAccount)
      setMutationState({
        status: 'success',
        message: preferredLanguage
          ? 'Language preference updated.'
          : 'Language preference cleared.',
      })
    } catch (error: unknown) {
      setMutationState({
        status: 'error',
        message: getDisplayMessage(
          error,
          'Language preference could not be saved.',
        ),
      })
    }
  }

  return (
    <form
      className="language-preference"
      aria-label="Language preference"
      onSubmit={(event) => {
        event.preventDefault()
        void submitLanguage(selectedLanguage)
      }}
    >
      <div className="language-preference-header">
        <div>
          <h3>Language preference</h3>
          <p className="section-description">
            Save a preferred language for account and workflow messages.
          </p>
        </div>
      </div>

      <div className="language-preference-controls">
        <label htmlFor="preferred-language">Language</label>
        <select
          id="preferred-language"
          value={selectedLanguage}
          disabled={submitting}
          onChange={(event) => {
            setSelectedLanguage(event.currentTarget.value)
            setMutationState({ status: 'idle' })
          }}
        >
          <option value="">No preference</option>
          {LANGUAGE_OPTIONS.map((language) => (
            <option key={language.value} value={language.value}>
              {language.label}
            </option>
          ))}
        </select>
      </div>

      <div className="language-preference-actions">
        <button type="submit" disabled={submitting || unchanged}>
          {submitting ? 'Saving...' : 'Save language'}
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={submitting || !canClear}
          onClick={() => {
            setSelectedLanguage('')
            void submitLanguage('')
          }}
        >
          Clear preference
        </button>
      </div>

      {mutationState.status === 'success' && (
        <p className="session-message" role="status">
          {mutationState.message}
        </p>
      )}
      {mutationState.status === 'error' && (
        <p className="session-message error" role="alert">
          {mutationState.message}
        </p>
      )}
    </form>
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
