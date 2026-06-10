const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatTimestamp(value: string | undefined) {
  if (!value) {
    return 'Unknown'
  }

  const timestamp = new Date(value)

  if (Number.isNaN(timestamp.getTime())) {
    return value
  }

  return TIMESTAMP_FORMATTER.format(timestamp)
}
