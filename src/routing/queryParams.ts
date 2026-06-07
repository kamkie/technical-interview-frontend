export function getFirstTrimmedValue(
  searchParams: URLSearchParams,
  name: string,
) {
  return searchParams.getAll(name).map(trimValue).find(Boolean) ?? ''
}

export function parseNonNegativeInteger(value: string | null, fallback: number) {
  if (value === null || value.trim() === '') {
    return fallback
  }

  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

export function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = parseNonNegativeInteger(value, fallback)

  return parsed > 0 ? parsed : fallback
}

export function appendStringParam(
  searchParams: URLSearchParams,
  name: string,
  value: string,
) {
  const trimmed = trimValue(value)

  if (trimmed) {
    searchParams.set(name, trimmed)
  }
}

export function appendRepeatedParams(
  searchParams: URLSearchParams,
  name: string,
  values: readonly string[],
  options: { unique?: boolean } = {},
) {
  const normalized =
    options.unique === false ? trimmedValues(values) : uniqueTrimmedValues(values)

  for (const value of normalized) {
    searchParams.append(name, value)
  }
}

export function uniqueTrimmedValues(values: readonly string[]) {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const value of values) {
    const trimmed = trimValue(value)

    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed)
      normalized.push(trimmed)
    }
  }

  return normalized
}

export function trimmedValues(values: readonly string[]) {
  return values.map(trimValue).filter(Boolean)
}

export function sameValues(left: readonly string[], right: readonly string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  )
}

function trimValue(value: string) {
  return value.trim()
}
