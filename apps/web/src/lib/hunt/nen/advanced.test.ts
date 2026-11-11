import { describe, expect, it } from 'vitest'
import { fullPool } from '../aura'
import {
  acceptVow,
  applyShu,
  capabilitiesOf,
  initialAdvancedNen,
  tickRen,
  toggleRen,
  wound,
} from './advanced'

describe('advanced Nen for Hunt V3', () => {
  it('makes Ren a continuous claim on the single aura pool', () => {
    const active = toggleRen(initialAdvancedNen())
    expect(tickRen(active, fullPool(), 2).pool.available).toBe(92)
  })

  it('charges Shu once and names the object carrying aura', () => {
    const result = applyShu(initialAdvancedNen(), fullPool(), { itemId: 'pipe-1' })
    expect(result.state.shuItem).toBe('pipe-1')
    expect(result.pool.available).toBe(90)
    expect(applyShu(result.state, result.pool, { itemId: 'pipe-1' }).pool.available).toBe(90)
    expect(
      applyShu(result.state, result.pool, { itemId: 'pipe-1', on: false }).state.shuItem,
    ).toBeNull()
  })

  it('turns wounds into verbs lost rather than damage points', () => {
    let state = wound(initialAdvancedNen(), 'left-leg')
    state = wound(state, 'right-arm')
    expect(capabilitiesOf(state)).toMatchObject({ movementMultiplier: 0.65, canUseTwoHands: false })
  })

  it('makes Ren faster and Shu improve placed-aura efficiency', () => {
    const ren = toggleRen(initialAdvancedNen())
    expect(capabilitiesOf(ren).movementMultiplier).toBeGreaterThan(1)
    const shu = applyShu(initialAdvancedNen(), fullPool(), { itemId: 'floor' }).state
    expect(capabilitiesOf(shu).placedAuraEfficiency).toBeGreaterThan(1)
  })

  it('accepts a vow only before play and enforces its restriction', () => {
    const vowed = acceptVow(initialAdvancedNen(), 'silent-hunt', 0)
    expect(capabilitiesOf(vowed)).toMatchObject({ canSweepEn: false, placedAuraEfficiency: 1.35 })
    expect(acceptVow(vowed, 'no-retreat', 1)).toBe(vowed)
  })
})
