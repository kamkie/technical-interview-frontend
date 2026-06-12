import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  isUnreachableLoadError,
  requestConnectionRecovery,
  subscribeToConnectionRecovery,
  useHasPageConnectionSurface,
  usePageConnectionSurface,
} from './asyncState'

describe('isUnreachableLoadError', () => {
  it('matches only error states flagged unreachable', () => {
    expect(
      isUnreachableLoadError({ status: 'error', unreachable: true }),
    ).toBe(true)
    expect(
      isUnreachableLoadError({ status: 'error', unreachable: false }),
    ).toBe(false)
    expect(isUnreachableLoadError({ status: 'error' })).toBe(false)
    expect(isUnreachableLoadError({ status: 'loading' })).toBe(false)
    expect(
      isUnreachableLoadError({ status: 'ready', unreachable: true }),
    ).toBe(false)
  })
})

describe('connection recovery channel', () => {
  it('notifies subscribers on each recovery signal until they unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToConnectionRecovery(listener)

    requestConnectionRecovery()
    requestConnectionRecovery()

    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    requestConnectionRecovery()

    expect(listener).toHaveBeenCalledTimes(2)
  })
})

describe('page connection surface registry', () => {
  it('reports a page surface only while a registrant is active', () => {
    const { result } = renderHook(() => useHasPageConnectionSurface())

    expect(result.current).toBe(false)

    const surface = renderHook(
      ({ active }: { active: boolean }) => usePageConnectionSurface(active),
      { initialProps: { active: true } },
    )

    expect(result.current).toBe(true)

    surface.rerender({ active: false })

    expect(result.current).toBe(false)
  })

  it('keeps reporting a surface until every registrant unmounts', () => {
    const { result } = renderHook(() => useHasPageConnectionSurface())
    const first = renderHook(() => usePageConnectionSurface(true))
    const second = renderHook(() => usePageConnectionSurface(true))

    expect(result.current).toBe(true)

    first.unmount()

    expect(result.current).toBe(true)

    second.unmount()

    expect(result.current).toBe(false)
  })
})
