import { describe, expect, it } from 'vitest'
import { readAura } from './perception'
import { impactOf } from './resolve'
import { combatReducer, initialCombatState, KO_COST, SCORE_TO_WIN } from './reducer'

describe('Nen perception', () => {
  it('lets Gyo reveal a Ryu distribution concealed with In', () => {
    const state = initialCombatState()
    const hidden = { ...state.opponent, in: true, guard: 'head' as const }

    expect(readAura(state.player, hidden).guard).toBeNull()
    expect(readAura({ ...state.player, gyo: true }, hidden).guard).toBe('head')
  })
})

describe('qualitative exchanges', () => {
  it('resolves impacts without health or damage fields', () => {
    expect(impactOf(0.5, 1)).toBe('blocked')
    expect(impactOf(1, 1)).toBe('clean')
    expect(impactOf(2, 1)).toBe('knockdown')
    expect(impactOf(1, 0)).toBe('ko')
    expect(Object.keys(initialCombatState().player)).not.toContain('health')
    expect(Object.keys(initialCombatState().player)).not.toContain('damage')
  })

  it('makes Zetsu recover aura while leaving no defence', () => {
    let state = initialCombatState()
    state = { ...state, player: { ...state.player, aura: 50 } }
    state = combatReducer(state, { type: 'MODE', side: 'player', mode: 'zetsu' })
    state = combatReducer(state, { type: 'TICK', dt: 1 })
    expect(state.player.aura).toBeGreaterThan(50)

    state = { ...state, opponent: { ...state.opponent, position: [1.5, 0] } }
    state = combatReducer(state, { type: 'STRIKE', side: 'opponent', zone: 'torso' })
    expect(state.outcome).toBe('lost')
  })

  it('charges Ko, exposes the rest of the body and lands after a wind-up', () => {
    let state = initialCombatState()
    state = { ...state, opponent: { ...state.opponent, position: [1.5, 0] } }
    state = combatReducer(state, { type: 'MODE', side: 'player', mode: 'ren' })
    state = combatReducer(state, { type: 'KO', side: 'player', zone: 'head' })
    expect(state.player.aura).toBe(100 - KO_COST)
    expect(state.player.attackShare).toBe(1)
    state = combatReducer(state, { type: 'TICK', dt: 1 })
    expect(state.lastEvent?.technique).toBe('ko')
  })

  it('ends a match at the arena score limit', () => {
    let state = initialCombatState()
    state = {
      ...state,
      player: { ...state.player, score: SCORE_TO_WIN - 1, position: [0, 0] },
      opponent: { ...state.opponent, position: [1.5, 0], guard: 'head' },
    }
    state = combatReducer(state, { type: 'MODE', side: 'player', mode: 'ren' })
    state = combatReducer(state, {
      type: 'RYU',
      side: 'player',
      attackShare: 0.5,
      guard: 'torso',
    })
    state = combatReducer(state, { type: 'STRIKE', side: 'player', zone: 'head' })
    expect(state.player.score).toBeGreaterThanOrEqual(SCORE_TO_WIN)
    expect(state.outcome).toBe('won')
  })

  it('uses room walls for movement and line of sight', () => {
    let state = initialCombatState({
      playerAt: [0, 0],
      opponentAt: [1.5, 0],
      terrain: {
        id: 'partitioned-room',
        footprint: [
          [-5, -5],
          [5, -5],
          [5, 5],
          [-5, 5],
        ],
        walls: [{ spaceId: 'partitioned-room', start: [0.75, -1], end: [0.75, 1] }],
      },
    })

    state = combatReducer(state, { type: 'STRIKE', side: 'player', zone: 'torso' })
    expect(state.lastEvent?.impact).toBe('miss')

    state = combatReducer(state, { type: 'MOVE', side: 'player', vector: [1, 0] })
    state = combatReducer(state, { type: 'TICK', dt: 0.5 })
    expect(state.player.position[0]).toBeLessThan(0.75)
  })
})
