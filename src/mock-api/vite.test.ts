import { describe, expect, it } from 'vitest'

import { isMockApiRequestPath } from './vite'

describe('mock API Vite middleware routing', () => {
  it('handles backend-shaped API paths without intercepting Vite source modules', () => {
    expect(isMockApiRequestPath('/api/session')).toBe(true)
    expect(isMockApiRequestPath('/api/books?page=0&size=10')).toBe(true)
    expect(isMockApiRequestPath('/api/session.ts')).toBe(false)
    expect(isMockApiRequestPath('/api/catalog.ts?import')).toBe(false)
    expect(isMockApiRequestPath('/src/main.tsx')).toBe(false)
  })
})
