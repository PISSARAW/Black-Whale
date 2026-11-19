import { describe, expect, it } from 'vitest'
import { combatReducer, initialCombatState } from './reducer'

const setup = {
  playerAt: [0, 0] as const,
  opponentAt: [1.5, 0] as const,
  terrain: initialCombatState().terrain,
}

describe('Fighting moves in the 3D Arena', () => {
  it('projects authored startup, reach and recovery onto the Arena plane', () => {
    let state = initialCombatState(setup)
    state = combatReducer(state, {
      type: 'FIGHTING_MOVE',
      side: 'player',
      fighterId: 'kurapika',
      slot: 'standingLight',
      targetAt: [3, 0],
    })

    expect(state.player.intent?.remaining).toBeCloseTo(4 / 60)
    expect(state.player.aura).toBe(100)
    state = combatReducer(state, { type: 'TICK', dt: 4 / 60 })
    expect(state.lastEvent?.attacker).toBe('player')
    expect(state.lastEvent?.impact).not.toBe('miss')
    expect(state.player.cooldown).toBeGreaterThan(0)
  })

  it('uses the selected character special and pays its Fighting aura cost', () => {
    const state = combatReducer(initialCombatState(setup), {
      type: 'FIGHTING_MOVE',
      side: 'player',
      fighterId: 'hisoka',
      slot: 'neutralSpecial',
      targetAt: [5, 0],
    })

    expect(state.player.aura).toBe(60)
    expect(state.player.intent?.technique).toBe('hatsu')
    expect(state.player.intent?.range).toBeGreaterThan(3)
  })

  it('refuses a special when the Arena fighter cannot pay its cost', () => {
    const base = initialCombatState(setup)
    const exhausted = { ...base, player: { ...base.player, aura: 10 } }
    const state = combatReducer(exhausted, {
      type: 'FIGHTING_MOVE',
      side: 'player',
      fighterId: 'hisoka',
      slot: 'neutralSpecial',
      targetAt: [5, 0],
    })

    expect(state).toBe(exhausted)
  })
})
