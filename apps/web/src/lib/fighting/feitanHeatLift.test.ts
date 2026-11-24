import { describe, expect, it } from 'vitest'
import { createFightState } from './fightState'
import { feitanHeatVictimLift } from './feitanHeatLift'

describe('Rising Sun heat presentation', () => {
  it('suspends only a scored victim and settles before the sun expires', () => {
    const state = createFightState('feitan', 'hisoka')
    state.player.hatsuEffects.painPacker = {
      injuries: 40,
      packedDamage: 40,
      armour: true,
      sun: { x: 40, y: 18, radius: 16, damage: 4, age: 45, duration: 180, scored: ['opponent'] },
    }
    expect(feitanHeatVictimLift(state, 'player')).toBe(0)
    expect(feitanHeatVictimLift(state, 'opponent')).toBeGreaterThan(0.4)
    state.player.hatsuEffects.painPacker.sun!.age = 175
    expect(feitanHeatVictimLift(state, 'opponent')).toBeLessThan(0.2)
  })
})
