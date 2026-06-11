// Frontend chrome message keys with their English default text. This registry
// is the single owner of the key list; backend catalog rows override these
// defaults per language at runtime, and missing rows fall back to the text
// recorded here. Keys follow the backend `^[a-z0-9._-]+$` contract pattern.
export const UI_MESSAGES = {
  'ui.nav.admin': 'Admin',
  'ui.nav.catalog': 'Catalog',
  'ui.nav.catalog-admin': 'Catalog admin',
  'ui.nav.diagnostics': 'Diagnostics',
  'ui.nav.localizations': 'Localizations',
  'ui.nav.operations': 'Operations',
  'ui.nav.operations-console': 'Operations console',
  'ui.nav.users': 'Users',
  'ui.session.account-settings': 'Account settings',
  'ui.session.guest': 'Browsing as guest',
  'ui.session.sign-in': 'Sign in',
  'ui.session.sign-out': 'Sign out',
  'ui.session.signed-in': 'Signed in',
  'ui.session.signing-out': 'Signing out...',
  'ui.shell.brand': 'Library Console',
  'ui.shell.skip-link': 'Skip to main content',
} as const satisfies Record<string, string>

export type UiMessageKey = keyof typeof UI_MESSAGES

export type UiMessageParams = Record<string, string | number>

// Replaces `{name}` tokens with the matching parameter and leaves unknown
// tokens in place so a stale catalog template cannot drop user-facing data.
export function formatUiMessage(template: string, params?: UiMessageParams) {
  if (!params) {
    return template
  }

  return template.replace(/\{([a-z0-9_]+)\}/gi, (token, name: string) =>
    name in params ? String(params[name]) : token,
  )
}
