import { describe, expect, it, vi } from 'vitest'
import { beginFight, createFight, opponentAttack, performAttack, tickFight } from './engine'
import { EMPTY_INPUT } from './types'

describe('fighting engine', () => {
  it('starts a duel with the selected Black Whale fighters', () => {
    const state = createFight('kurapika', 'hisoka')
    expect(state.player.id).toBe('kurapika')
    expect(state.opponent.id).toBe('hisoka')
    expect(beginFight(state).phase).toBe('fighting')
  })

  it('deals damage when a strike is in range', () => {
    let state = beginFight(createFight('benjamin', 'morena'))
    state = { ...state, player: { ...state.player, x: 46 }, opponent: { ...state.opponent, x: 52 } }
    const struck = performAttack(state, 'player', 'heavy')
    expect(struck.opponent.health).toBeLessThan(100)
    expect(struck.impact?.kind).toBe('heavy')
  })

  it('reduces damage while guarding', () => {
    let state = beginFight(createFight('kurapika', 'chrollo'))
    state = {
      ...state,
      player: { ...state.player, x: 46 },
      opponent: { ...state.opponent, x: 52, blocking: true },
    }
    const struck = performAttack(state, 'player', 'heavy')
    expect(struck.impact?.blocked).toBe(true)
    expect(struck.impact?.damage).toBeLessThan(12)
  })

  it('spends aura on a special attack', () => {
    let state = beginFight(createFight('hisoka', 'tserriednich'))
    state = {
      ...state,
      player: { ...state.player, x: 40, aura: 70 },
      opponent: { ...state.opponent, x: 58 },
    }
    const struck = performAttack(state, 'player', 'special')
    expect(struck.player.aura).toBe(30)
    expect(struck.opponent.health).toBeLessThan(100)
  })

  it('ends on time and awards the healthier fighter', () => {
    let state = beginFight(createFight('kurapika', 'hisoka'))
    state = { ...state, time: 0.01, opponent: { ...state.opponent, health: 60 } }
    const ended = tickFight(state, EMPTY_INPUT, 0.02)
    expect(ended.phase).toBe('finished')
    expect(ended.winner).toBe('player')
  })

  it('lets the opponent attack at close range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    let state = beginFight(createFight('kurapika', 'benjamin'))
    state = { ...state, player: { ...state.player, x: 47 }, opponent: { ...state.opponent, x: 53 } }
    expect(opponentAttack(state).player.health).toBeLessThan(100)
    vi.restoreAllMocks()
  })
})
