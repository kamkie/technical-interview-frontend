import { useEffect, useState } from 'react'

import {
  fetchCurrentAccount,
  updateAccountLanguage,
  type UserAccount,
} from '../api/account'
import type { SessionResponse } from '../api/session'
import { publishAccountUpdate } from './useCurrentAccount'
import { useI18n, type UiTranslate } from '../i18n/useI18n'
import {
  createLoadError,
  getApiDisplayMessage,
  getLoadErrorMessage,
  type LoadState,
  type MutationState,
} from '../ui/asyncState'
import { formatTimestamp } from '../ui/format'
import { MutationFeedback } from '../ui/MutationFeedback'
import { StateBlock } from '../ui/StateBlock'
import {
  LANGUAGE_OPTIONS,
  formatLanguagePreference,
} from './languageOptions'

export function AccountProfile({ session }: { session: SessionResponse }) {
  const { t } = useI18n()
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
          setAccountState(
            createLoadError(error, 'Account profile could not be loaded.'),
          )
        }
      })

    return () => {
      ignore = true
    }
  }, [session])

  return (
    <section className="account-panel" aria-label={t('ui.account.panel-label')}>
      {accountState.status === 'loading' && (
        <StateBlock
          message={t('ui.account.loading-message')}
          title={t('ui.account.loading-title')}
          variant="loading"
        />
      )}

      {accountState.status === 'error' && (
        <StateBlock
          message={getLoadErrorMessage(t, accountState)}
          title={t('ui.account.error-title')}
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
  const { t } = useI18n()
  const displayName =
    account.displayName ||
    account.login ||
    account.email ||
    t('ui.account.current-user')
  const roles = (account.roles ?? []).filter(Boolean)
  const contactLabel =
    account.email || account.login || t('ui.account.contact-unavailable')
  const preferredLanguage = formatLanguagePreference(account.preferredLanguage, t)

  return (
    <div className="account-profile">
      <div className="account-summary">
        <div>
          <p className="account-name">{displayName}</p>
          <p className="account-subtitle">{contactLabel}</p>
        </div>
        <div className="account-roles" aria-label={t('ui.account.access-label')}>
          {roles.length > 0 ? (
            roles.map((role) => (
              <span className="role-pill" key={role}>
                {formatRoleLabel(role, t)}
              </span>
            ))
          ) : (
            <span className="session-message muted">
              {t('ui.account.no-roles')}
            </span>
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
          label={t('ui.account.language-preference')}
          value={preferredLanguage}
        />
        <ProfileField label={t('ui.account.login-name')} value={account.login} />
        <ProfileField
          label={t('ui.account.identity-provider')}
          value={account.provider}
        />
        <ProfileField
          label={t('ui.account.account-record')}
          value={formatNumber(account.id)}
        />
        <ProfileField
          label={t('ui.account.last-sign-in')}
          value={formatProfileTimestamp(account.lastLoginAt)}
        />
        <ProfileField
          label={t('ui.account.created')}
          value={formatProfileTimestamp(account.createdAt)}
        />
        <ProfileField
          label={t('ui.account.updated')}
          value={formatProfileTimestamp(account.updatedAt)}
        />
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
  const { language, t } = useI18n()
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
    !LANGUAGE_OPTIONS.some((option) => option.value === currentLanguage)

  async function submitLanguage(preferredLanguage: string) {
    setMutationState({ status: 'submitting' })

    try {
      const updatedAccount = await updateAccountLanguage(
        session,
        preferredLanguage,
      )
      publishAccountUpdate(session, updatedAccount)
      onAccountChange(updatedAccount)
      setLanguageInput(updatedAccount.preferredLanguage?.trim() ?? '')
      setMutationState({
        status: 'success',
        message: preferredLanguage
          ? t('ui.account.preference-updated')
          : t('ui.account.preference-cleared'),
      })
    } catch (error: unknown) {
      setMutationState({
        status: 'error',
        message: getApiDisplayMessage(t, error, t('ui.language.save-failed')),
      })
    }
  }

  return (
    <form
      className="language-preference"
      aria-label={t('ui.account.language-preference')}
      onSubmit={(event) => {
        event.preventDefault()
        void submitLanguage(languageInput)
      }}
    >
      <div className="language-preference-header">
        <div>
          <h2>{t('ui.account.language-preference')}</h2>
          <p className="section-description">
            {t('ui.account.language-hint')}
          </p>
        </div>
      </div>

      <div className="language-preference-controls">
        <label htmlFor="preferred-language">{t('ui.account.language')}</label>
        <select
          id="preferred-language"
          value={languageInput}
          disabled={submitting}
          onChange={(event) => {
            setLanguageInput(event.currentTarget.value)
            setMutationState({ status: 'idle' })
          }}
        >
          <option value="">{t('ui.account.no-preference')}</option>
          {unknownCurrentLanguage && (
            <option value={currentLanguage}>{currentLanguage}</option>
          )}
          {LANGUAGE_OPTIONS.map((option) => (
            // Labels match the topbar language menu: translated names without
            // code suffixes, in the shared LANGUAGE_OPTIONS order.
            <option key={option.value} value={option.value}>
              {t(`ui.language.${option.value}`)}
            </option>
          ))}
        </select>
      </div>

      {currentLanguage === '' && (
        <p className="session-message muted">
          {t('ui.account.no-preference-hint', {
            language: t(`ui.language.${language}`),
          })}
        </p>
      )}

      <div className="language-preference-actions">
        <button type="submit" disabled={submitting || unchanged}>
          {submitting ? t('ui.account.saving') : t('ui.account.save-language')}
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
          {t('ui.account.clear-preference')}
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
  const { t } = useI18n()

  return (
    <div>
      <dt>{label}</dt>
      <dd>{value ?? t('ui.common.unavailable')}</dd>
    </div>
  )
}

function formatNumber(value: number | undefined) {
  return value === undefined ? undefined : String(value)
}

// Missing values fall through to ProfileField's shared 'Unavailable' text.
function formatProfileTimestamp(value: string | undefined) {
  return value ? formatTimestamp(value) : undefined
}

function formatRoleLabel(role: string, t: UiTranslate) {
  const normalizedRole = role.trim().replace(/^ROLE_/, '').replaceAll('_', ' ')

  if (!normalizedRole) {
    return t('ui.account.access-role')
  }

  return normalizedRole
    .toLocaleLowerCase('en-US')
    .replace(/\b[a-z]/g, (letter) => letter.toLocaleUpperCase('en-US'))
}
