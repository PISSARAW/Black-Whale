import { describe, expect, it } from 'vitest'
import { MAX_CATCH_UP_SECONDS, safeFrameDebt } from './lifecycle'

describe('hunt lifecycle resilience', () => {
  it('caps debt after a suspended tab', () => {
    expect(safeFrameDebt(0, 30)).toBe(MAX_CATCH_UP_SECONDS)
  })

  it('rejects corrupt elapsed values', () => {
    expect(safeFrameDebt(0.1, Number.NaN)).toBe(0.1)
    expect(safeFrameDebt(0.1, -2)).toBe(0.1)
  })
})
