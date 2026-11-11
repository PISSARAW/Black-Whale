import { createNenTechniqueState, transitionNen } from '@black-whale/nen-engine'
import { describe, expect, it, vi } from 'vitest'
import { pressTen, wasRefused } from './nenPress'

describe('controlled Nen feedback', () => {
  it('keeps arena and hunt refusals distinct from success or no verdict', () => {
    expect(wasRefused(false)).toBe(true)
    expect(wasRefused(true)).toBe(false)
    expect(wasRefused(undefined)).toBe(false)
  })

  it('respects the transition verdict from the tour session', () => {
    const state = createNenTechniqueState()
    expect(wasRefused({ state, accepted: false })).toBe(true)
    expect(wasRefused(transitionNen(state, { type: 'REN' }))).toBe(false)
  })
})

describe('Ten before and after awakening', () => {
  it('requests awakening even when the starting state already holds Ten', () => {
    const useNen = vi.fn()
    const setComfort = vi.fn()
    pressTen({
      awakened: false,
      nen: createNenTechniqueState(),
      restingAura: true,
      setComfort,
      useNen,
    })
    expect(useNen).toHaveBeenCalledWith({ type: 'TEN' })
    expect(setComfort).toHaveBeenCalledWith({ restingAura: true })
  })

  it('hides an awakened resting aura without closing the nodes', () => {
    const useNen = vi.fn()
    const setComfort = vi.fn()
    pressTen({
      awakened: true,
      nen: createNenTechniqueState(),
      restingAura: true,
      setComfort,
      useNen,
    })
    expect(useNen).not.toHaveBeenCalled()
    expect(setComfort).toHaveBeenCalledWith({ restingAura: false })
  })
})
