import { describe, expect, it } from 'vitest'

import { formatTimestamp } from './format'

// The expected output is rebuilt with the same Intl options instead of a
// literal string so the test stays locale-independent on any host machine.
const EXPECTED_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

describe('formatTimestamp', () => {
  it('formats parseable timestamps with the medium date and short time styles', () => {
    const value = '2026-06-07T09:00:00Z'

    expect(formatTimestamp(value)).toBe(
      EXPECTED_FORMATTER.format(new Date(value)),
    )
  })

  it('returns missing values as the provided localized fallback', () => {
    expect(formatTimestamp(undefined, 'Nieznane')).toBe('Nieznane')
    expect(formatTimestamp('', 'Nieznane')).toBe('Nieznane')
  })

  it('keeps the English fallback for call sites that pass no fallback', () => {
    expect(formatTimestamp(undefined)).toBe('Unknown')
  })

  it('returns unparseable values verbatim instead of the fallback', () => {
    expect(formatTimestamp('not-a-timestamp', 'Nieznane')).toBe(
      'not-a-timestamp',
    )
  })
})
