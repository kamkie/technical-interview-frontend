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
import {
  LANGUAGE_OPTIONS,
  formatLanguagePreference,
} from './languageOptions'

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
    <section className="account-panel" aria-label="Account profile">
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

      <LanguagePreferenceForm
        account={account}
        key={account.id ?? 'current'}
        session={session}
        onAccountChange={onAccountChange}
      />

      <dl className="account-metadata">
        <ProfileField
          label="Language preference"
          value={preferredLanguage}
        />
        <ProfileField label="Login name" value={account.login} />
        <ProfileField label="Identity provider" value={account.provider} />
        <ProfileField label="Account record" value={formatNumber(account.id)} />
        <ProfileField label="Last sign-in" value={account.lastLoginAt} />
        <ProfileField label="Created" value={account.createdAt} />
        <ProfileField label="Updated" value={account.updatedAt} />
      </dl>
    </div>
  )
}

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
  const [languageInput, setLanguageInput] = useState(currentLanguage)
  const [mutationState, setMutationState] = useState<MutationState>({
    status: 'idle',
  })
  const submitting = mutationState.status === 'submitting'
  const unchanged = languageInput === currentLanguage
  const canClear = Boolean(currentLanguage || languageInput)
  // A stored preference outside the supported list still needs a visible,
  // selectable entry so the select reflects the account state faithfully.
  const unknownCurrentLanguage =
    currentLanguage !== '' &&
    !LANGUAGE_OPTIONS.some((language) => language.value === currentLanguage)

  async function submitLanguage(preferredLanguage: string) {
    setMutationState({ status: 'submitting' })

    try {
      const updatedAccount = await updateAccountLanguage(
        session,
        preferredLanguage,
      )
      onAccountChange(updatedAccount)
      setLanguageInput(updatedAccount.preferredLanguage?.trim() ?? '')
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
        void submitLanguage(languageInput)
      }}
    >
      <div className="language-preference-header">
        <div>
          <h2>Language preference</h2>
          <p className="section-description">
            Choose the language used for account and workflow messages.
          </p>
        </div>
      </div>

      <div className="language-preference-controls">
        <label htmlFor="preferred-language">Language</label>
        <select
          id="preferred-language"
          value={languageInput}
          disabled={submitting}
          onChange={(event) => {
            setLanguageInput(event.currentTarget.value)
            setMutationState({ status: 'idle' })
          }}
        >
          <option value="">No preference</option>
          {unknownCurrentLanguage && (
            <option value={currentLanguage}>{currentLanguage}</option>
          )}
          {LANGUAGE_OPTIONS.map((language) => (
            <option key={language.value} value={language.value}>
              {language.label} ({language.value})
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
            setLanguageInput('')
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

function formatRoleLabel(role: string) {
  const normalizedRole = role.trim().replace(/^ROLE_/, '').replaceAll('_', ' ')

  if (!normalizedRole) {
    return 'Access role'
  }

  return normalizedRole
    .toLocaleLowerCase('en-US')
    .replace(/\b[a-z]/g, (letter) => letter.toLocaleUpperCase('en-US'))
}
