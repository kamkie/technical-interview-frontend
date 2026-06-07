export type RoleBearingAccount = {
  roles?: readonly string[]
}

export function hasAdminRole(account: RoleBearingAccount) {
  return (account.roles ?? []).includes('ADMIN')
}
