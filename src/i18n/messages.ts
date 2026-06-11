// Frontend chrome message keys with their English default text. This registry
// is the single owner of the key list; backend catalog rows override these
// defaults per language at runtime, and missing rows fall back to the text
// recorded here. Keys follow the backend `^[a-z0-9._-]+$` contract pattern.
export const UI_MESSAGES = {
  'ui.area.account': 'Account',
  'ui.area.admin': 'Admin',
  'ui.area.catalog': 'Public catalog',
  'ui.area.operations': 'Operations',
  'ui.common.cancel': 'Cancel',
  'ui.common.disabled': 'Disabled',
  'ui.common.none': 'None',
  'ui.common.unavailable': 'Unavailable',
  'ui.language.de': 'German',
  'ui.language.en': 'English',
  'ui.language.es': 'Spanish',
  'ui.language.fr': 'French',
  'ui.language.menu-label': 'Language preference, currently {label}',
  'ui.language.no': 'Norwegian',
  'ui.language.no-preference-inline': 'no preference',
  'ui.language.pl': 'Polish',
  'ui.language.save-failed': 'Language preference could not be saved.',
  'ui.language.uk': 'Ukrainian',
  'ui.nav.admin': 'Admin',
  'ui.nav.admin-label': 'Admin workflows',
  'ui.nav.catalog': 'Catalog',
  'ui.nav.catalog-admin': 'Catalog admin',
  'ui.nav.diagnostics': 'Diagnostics',
  'ui.nav.localizations': 'Localizations',
  'ui.nav.operations': 'Operations',
  'ui.nav.operations-console': 'Operations console',
  'ui.nav.operations-label': 'Operations workflows',
  'ui.nav.primary-label': 'Primary navigation',
  'ui.nav.users': 'Users',
  'ui.pagination.next': 'Next page',
  'ui.pagination.page': 'Page {page}',
  'ui.pagination.page-of': 'Page {page} of {total}',
  'ui.pagination.previous': 'Previous page',
  'ui.pagination.rows-per-page': 'Rows per page',
  'ui.route.account.description':
    'Review the current profile and manage account preferences for this session.',
  'ui.route.account.title': 'Account settings',
  'ui.route.admin-catalog.description':
    'Manage book records and categories through backend-authorized catalog tools.',
  'ui.route.admin-catalog.title': 'Catalog administration',
  'ui.route.admin-localization.description':
    'Maintain localized messages without treating translated text as program logic.',
  'ui.route.admin-localization.title': 'Localization administration',
  'ui.route.admin-users.description':
    'Review application users and role-grant provenance through admin workflows.',
  'ui.route.admin-users.title': 'User administration',
  'ui.route.catalog.description':
    'Search the approved collection and review catalog availability.',
  'ui.route.catalog.title': 'Book catalog',
  'ui.route.diagnostics.description':
    'Review build, runtime, and health evidence for support escalations.',
  'ui.route.diagnostics.title': 'System diagnostics',
  'ui.route.operator.description':
    'Review operator audit evidence with URL-backed filters, pagination, and read-only details.',
  'ui.route.operator.title': 'Operations console',
  'ui.session.account': 'Account',
  'ui.session.account-endpoint': 'Account endpoint',
  'ui.session.account-menu-label': 'Account menu',
  'ui.session.account-settings': 'Account settings',
  'ui.session.checking': 'Checking sign-in...',
  'ui.session.connection-details': 'Connection details',
  'ui.session.connection-eyebrow': 'Connection',
  'ui.session.connection-issue': 'Connection issue',
  'ui.session.connection-menu-label': 'Connection menu',
  'ui.session.cookie': 'Session cookie',
  'ui.session.csrf-label': 'Cookie {cookie}; header {header}',
  'ui.session.guest': 'Browsing as guest',
  'ui.session.loading': 'Loading session...',
  'ui.session.login-providers-label': 'Login providers',
  'ui.session.logout-failed': 'Logout failed.',
  'ui.session.no-providers':
    'No sign-in options are available for this session.',
  'ui.session.sign-in': 'Sign in',
  'ui.session.sign-in-hint':
    'Choose one of the sign-in options supplied by the current session.',
  'ui.session.sign-in-options-label': 'Sign in options',
  'ui.session.sign-in-title': 'Sign in to your workspace',
  'ui.session.sign-in-with': 'Sign in with {provider}',
  'ui.session.sign-out': 'Sign out',
  'ui.session.sign-out-endpoint': 'Sign-out endpoint',
  'ui.session.sign-out-unavailable': 'Sign out is unavailable for this session.',
  'ui.session.signed-in': 'Signed in',
  'ui.session.signing-out': 'Signing out...',
  'ui.session.status-label': 'Session status',
  'ui.session.write-protection': 'Write protection',
  'ui.shell.brand': 'Library Console',
  'ui.shell.skip-link': 'Skip to main content',
  'ui.sort.ascending': 'ascending',
  'ui.sort.button-label':
    'Sort by {label}; currently {indicator}. Activate to sort {direction}.',
  'ui.sort.descending': 'descending',
  'ui.sort.not-sorted': 'not sorted',
  'ui.theme.dark': 'Dark',
  'ui.theme.group-label':
    'Theme preference, currently {label} using {mode} mode',
  'ui.theme.light': 'Light',
  'ui.theme.mode.dark': 'dark',
  'ui.theme.mode.light': 'light',
  'ui.theme.option-title': '{label} theme',
  'ui.theme.system': 'System',
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
