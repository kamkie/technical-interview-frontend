import type { AuditLog } from '../api/operator'

export function createAuditEntryKey(entry: AuditLog, index: number) {
  return (
    entry.id ??
    `${entry.createdAt ?? 'unknown'}-${entry.summary ?? 'unknown'}-${index}`
  )
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
    formatActor(entry.actorLogin),
  ].join(' - ')
}

// Callers pass localized fallback text (for example `t('ui.common.unknown')`)
// for missing values; the English defaults keep older call sites compiling.
export function formatActor(
  actorLogin: string | undefined,
  fallback = 'Unknown actor',
) {
  return actorLogin?.trim() ? actorLogin : fallback
}

export function formatSummary(
  summary: string | undefined,
  fallback = 'No summary',
) {
  return summary?.trim() ? summary : fallback
}

export function formatEnumValue(value: string | undefined, fallback = 'Unknown') {
  return value?.trim() ? value : fallback
}

export function formatOptionalNumber(
  value: number | undefined,
  fallback = 'Unavailable',
) {
  return value === undefined ? fallback : String(value)
}

export function hasStructuredDetails(value: unknown) {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value).length > 0
  )
}
