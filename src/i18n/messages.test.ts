import { describe, expect, it } from 'vitest'

import { UI_MESSAGES, formatUiMessage } from './messages'

describe('formatUiMessage', () => {
  it('returns the template unchanged without parameters', () => {
    expect(formatUiMessage('Showing {count} rows')).toBe('Showing {count} rows')
  })

  it('replaces named tokens with string and numeric parameters', () => {
    expect(
      formatUiMessage('Showing {from}-{to} of {total} {label}', {
        from: 1,
        to: 20,
        total: 41,
        label: 'rows',
      }),
    ).toBe('Showing 1-20 of 41 rows')
  })

  it('leaves unknown tokens in place instead of dropping content', () => {
    expect(formatUiMessage('Hello {name}', { other: 'x' })).toBe('Hello {name}')
  })
})

describe('UI_MESSAGES registry', () => {
  it('keeps every key inside the backend message-key contract pattern', () => {
    for (const key of Object.keys(UI_MESSAGES)) {
      expect(key).toMatch(/^[a-z0-9._-]+$/)
      expect(key.length).toBeLessThanOrEqual(150)
    }
  })
})
