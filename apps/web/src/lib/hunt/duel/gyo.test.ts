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

  it('also hides the Ko tell until the hunter actually pays for Gyo', () => {
    const state = initialDuelState()
    const hidden = { ...state.hunter, in: true, ko: 'head' as const }
    expect(readAura(state.player, hidden).koCharged).toBe(false)
    expect(readAura({ ...state.player, gyo: true }, hidden).koCharged).toBe(true)
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

describe('In against the naked eye', () => {
  it('lets anyone read a guard nobody is hiding', () => {
    const state = initialDuelState()
    const reading = readAura(state.player, { ...state.hunter, guard: 'legs' })
    expect(reading.guard).toBe('legs')
    expect(reading.hidden).toBe(false)
  })
})
