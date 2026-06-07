import { useEffect, useState } from 'react'

import {
  fetchCurrentAccount,
  updateAccountLanguage,
  type UserAccount,
} from '../api/account'
import type { SessionResponse } from '../api/session'
import {
  getDisplayMessage,
  type LoadState,
  type MutationState,
} from '../ui/asyncState'
import { MutationFeedback } from '../ui/MutationFeedback'
import { StateBlock } from '../ui/StateBlock'

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
            message: getDisplayMessage(
              error,
              'Account profile could not be loaded.',
            ),
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
        <p className="eyebrow">Account workspace</p>
        <h2 id="account-title">Account preferences</h2>
        <p className="section-description">
          Review the current account and choose the language used for account
          and workflow messages.
        </p>
      </div>

      {accountState.status === 'loading' && (
        <StateBlock
          message="Loading account..."
          title="Loading account profile"
          variant="loading"
        />
      )}

      {accountState.status === 'error' && (
        <StateBlock
          message={accountState.message}
          title="Account profile unavailable"
          variant="error"
        />
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
  const contactLabel = account.email || account.login || 'Contact unavailable'
  const preferredLanguage = formatLanguagePreference(account.preferredLanguage)

  return (
    <div className="account-profile">
      <div className="account-summary">
        <div>
          <p className="account-name">{displayName}</p>
          <p className="account-subtitle">{contactLabel}</p>
        </div>
        <div className="account-roles" aria-label="Account access">
          {roles.length > 0 ? (
            roles.map((role) => (
              <span className="role-pill" key={role}>
                {formatRoleLabel(role)}
              </span>
            ))
          ) : (
            <span className="session-message muted">No access roles assigned.</span>
          )}
        </div>
      </div>

      <dl className="account-metadata">
        <ProfileField
          label="Language preference"
          value={preferredLanguage}
        />
      </dl>

      <details className="account-technical-details">
        <summary>Account details</summary>
        <dl className="account-metadata">
          <ProfileField label="Login name" value={account.login} />
          <ProfileField label="Identity provider" value={account.provider} />
          <ProfileField label="Account record" value={formatNumber(account.id)} />
          <ProfileField label="Last sign-in" value={account.lastLoginAt} />
          <ProfileField label="Created" value={account.createdAt} />
          <ProfileField label="Updated" value={account.updatedAt} />
        </dl>
      </details>

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
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'pl', label: 'Polish' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'no', label: 'Norwegian' },
] as const

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
  const [mutationState, setMutationState] = useState<MutationState>({
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
            Choose the language used for account and workflow messages.
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

      <MutationFeedback state={mutationState} />
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

function formatLanguagePreference(value: string | undefined) {
  const languageValue = value?.trim()

  if (!languageValue) {
    return 'No preference'
  }

  return (
    LANGUAGE_OPTIONS.find((language) => language.value === languageValue)
      ?.label ?? languageValue
  )
}

function formatRoleLabel(role: string) {
  const normalizedRole = role.trim().replace(/^ROLE_/, '').replaceAll('_', ' ')

  if (!normalizedRole) {
    return 'Access role'
  }

  return normalizedRole
    .toLocaleLowerCase('en-US')
    .replace(/\b[a-z]/g, (letter) => letter.toLocaleUpperCase('en-US'))
}
