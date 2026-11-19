import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  activateHatsu,
  closeHatsuGate,
  deactivateHatsu,
  forcedZetsuUntil,
  openHatsuGate,
} from '$lib/nen/hatsuState'
import { HATSU_PROFILES } from '$lib/nen/hatsuRegistry'
import { trackEvent } from './client'

vi.mock('./client', () => ({ trackEvent: vi.fn() }))
afterEach(() => {
  closeHatsuGate()
  forcedZetsuUntil.set(0)
  deactivateHatsu()
  vi.clearAllMocks()
})
describe('Hatsu selection metrics', () => {
  it('does not count session restoration as a selection', () => {
    expect(activateHatsu(HATSU_PROFILES[0], 'restore')).toBe(true)
    expect(trackEvent).not.toHaveBeenCalled()
    expect(activateHatsu(HATSU_PROFILES[0])).toBe(true)
    expect(trackEvent).toHaveBeenCalledWith('hatsu_select', {
      hatsu: HATSU_PROFILES[0].id,
      kind: HATSU_PROFILES[0].kind,
    })
  })
  it('counts a refused activation without counting a selection', () => {
    openHatsuGate({ admits: () => false, reason: 'mode' })
    expect(activateHatsu(HATSU_PROFILES[0])).toBe(false)
    expect(trackEvent).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledWith('hatsu_blocked', {
      hatsu: HATSU_PROFILES[0].id,
      reason: 'mode-gate',
    })
  })
})
