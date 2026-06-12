const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

// Callers pass localized fallback text (for example `t('ui.common.unknown')`)
// for missing values; the English default keeps older call sites compiling.
export function formatTimestamp(value: string | undefined, fallback = 'Unknown') {
  if (!value) {
    return fallback
  }

  const timestamp = new Date(value)

  if (Number.isNaN(timestamp.getTime())) {
    return value
  }

  return TIMESTAMP_FORMATTER.format(timestamp)
}
