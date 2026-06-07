export function appendString(
  search: URLSearchParams,
  name: string,
  value: string | undefined,
) {
  const trimmed = value?.trim()

  if (trimmed) {
    search.set(name, trimmed)
  }
}

export function appendStringList(
  search: URLSearchParams,
  name: string,
  values: readonly string[] | undefined,
) {
  for (const value of values ?? []) {
    const trimmed = value.trim()

    if (trimmed) {
      search.append(name, trimmed)
    }
  }
}

export function appendNumber(
  search: URLSearchParams,
  name: string,
  value: number | undefined,
) {
  if (value !== undefined && Number.isFinite(value)) {
    search.set(name, String(value))
  }
}
