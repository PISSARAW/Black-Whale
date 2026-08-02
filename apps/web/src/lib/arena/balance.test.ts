import { describe, expect, it } from 'vitest'
import { initialCombatState } from '../combat/types'
import { advanceArena, type ArenaDifficulty, type OpponentDoctrine } from './ai'

const doctrines: OpponentDoctrine[] = ['counter', 'binder', 'artillery', 'deceiver']
const difficulties: ArenaDifficulty[] = ['initiate', 'fighter', 'master']

describe('Arena balance smoke simulations', () => {
  for (const doctrine of doctrines) {
    for (const difficulty of difficulties) {
      it(`${doctrine} remains finite and referee-safe on ${difficulty}`, () => {
        let state = initialCombatState()
        for (let frame = 0; frame < 60 * 45 && state.outcome === 'playing'; frame += 1) {
          state = advanceArena(state, 1 / 60, doctrine, difficulty)
        }

        for (const fighter of [state.player, state.opponent]) {
          expect(Number.isFinite(fighter.position[0])).toBe(true)
          expect(Number.isFinite(fighter.position[1])).toBe(true)
          expect(fighter.aura).toBeGreaterThanOrEqual(0)
          expect(fighter.aura).toBeLessThanOrEqual(fighter.capacity)
          expect(fighter.score).toBeGreaterThanOrEqual(0)
        }
      })
    }
  }
})
