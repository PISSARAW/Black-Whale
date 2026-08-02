import { describe, expect, it } from 'vitest'
import { readAura } from './gyo'
import { initialDuelState } from './state'

describe('Gyo against In', () => {
  it('cannot read an aura distribution with the naked eye', () => {
    const state = initialDuelState()
    const reading = readAura(state.player, { ...state.hunter, in: true, guard: 'head' })

    expect(reading.guard).toBeNull()
    expect(reading.hidden).toBe(true)
  })

  it('reveals aura concealed with In', () => {
    const state = initialDuelState()
    const reading = readAura(
      { ...state.player, gyo: true },
      { ...state.hunter, in: true, guard: 'head' },
    )

    expect(reading.guard).toBe('head')
    expect(reading.hidden).toBe(false)
  })
})
