import { describe, expect, it } from 'vitest'
import { initialCombatState } from '../combat/types'
import { arenaDuelPresence } from './duelPresence'

describe('Arena duel presence', () => {
  it('turns Ren and authored resolve into felt POV pressure', () => {
    const base = initialCombatState()
    const state = { ...base, opponent: { ...base.opponent, mode: 'ren' as const } }
    const presence = arenaDuelPresence({
      state,
      subject: 'opponent',
      fighterId: 'hisoka',
      motion: 'idle',
    })

    expect(presence.pressure).toBe('high')
    expect(presence.ren.pressure).toBeGreaterThan(0.5)
    expect(presence.detail).toBeNull()
  })

  it('does not leak a presence concealed from the viewer', () => {
    const base = initialCombatState()
    const state = {
      ...base,
      opponent: { ...base.opponent, mode: 'ren' as const, in: true },
    }
    const presence = arenaDuelPresence({
      state,
      subject: 'opponent',
      fighterId: 'hisoka',
      motion: 'idle',
    })

    expect(presence.pressure).toBe('silent')
    expect(presence.ren.pressure).toBe(0)
  })

  it('reveals aura stability and intent only through Gyo', () => {
    const base = initialCombatState()
    const state = {
      ...base,
      player: { ...base.player, gyo: true },
      opponent: {
        ...base.opponent,
        mode: 'ren' as const,
        intent: { zone: 'head' as const, remaining: 0.2, targetAt: [0, 0] as [number, number] },
      },
    }
    const presence = arenaDuelPresence({
      state,
      subject: 'opponent',
      fighterId: 'feitan',
      motion: 'attack',
    })

    expect(presence.detail).toEqual({ stability: 'steady', intent: 'hostile' })
    expect(presence.expression).toBe('hostile')
  })

  it('makes a received hit visible without changing combat state', () => {
    const state = initialCombatState()
    const before = JSON.stringify(state)
    const presence = arenaDuelPresence({
      state,
      subject: 'opponent',
      fighterId: 'kurapika',
      motion: 'hit',
    })

    expect(presence.expression).toBe('anxious')
    expect(JSON.stringify(state)).toBe(before)
  })
})
