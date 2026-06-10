import type { AuditLog } from '../api/operator'

export function createAuditEntryKey(entry: AuditLog, index: number) {
  return entry.id ?? `${entry.createdAt ?? 'unknown'}-${entry.summary ?? index}`
}

export function createAuditEntryLabel(entry: AuditLog, index: number) {
  return entry.id !== undefined
    ? `audit entry ${entry.id}`
    : `audit entry ${index + 1}`
}

export function formatAuditDescriptor(entry: AuditLog) {
  return [
    formatEnumValue(entry.targetType),
    formatEnumValue(entry.action),
    entry.actorLogin?.trim() ? entry.actorLogin : 'Unknown actor',
  ].join(' - ')
}

export function formatEnumValue(value: string | undefined) {
  return value?.trim() ? value : 'Unknown'
}

export function formatOptionalNumber(value: number | undefined) {
  return value === undefined ? 'Unavailable' : String(value)
}

export function hasStructuredDetails(value: unknown) {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value).length > 0
  )
}
