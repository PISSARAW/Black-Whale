import { CATS_NAME_FRAMES } from './camillaCat'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAttack, performMove, tickFight } from './engine'
import { finishFight } from './combatVerdict'
import { camillaHatsu } from './hatsu/camilla'
import { healthBars, healthPercent } from './health'
import { EMPTY_INPUT } from './types'

describe('multiple life bars', () => {
  it.each(['arcade', 'knockout'] as const)('starts %s with three full bars', (formatId) => {
    const state = createFight('bill', 'hisoka', formatId)
    for (const fighter of [state.player, state.opponent]) {
      expect(fighter.health).toBe(300)
      expect(fighter.maxHealth).toBe(300)
      expect(healthBars(fighter.health, fighter.maxHealth)).toEqual([100, 100, 100])
    }
    expect(state.time).toBe(120)
  })

  it.each([
    [201, [100, 100, 1]],
    [200, [100, 100, 0]],
    [199, [100, 99, 0]],
    [100, [100, 0, 0]],
    [99, [99, 0, 0]],
    [0, [0, 0, 0]],
  ])('shows the remaining reserve at %s HP', (health, bars) => {
    expect(healthBars(health as number, 300)).toEqual(bars)
  })

  it('keeps Tour health on a single bar', () => {
    const state = createFight('bill', 'hisoka', 'heavens-arena')
    expect(healthBars(state.player.health, state.player.maxHealth)).toEqual([100])
  })

  it.each([201, 101, 1])('carries damage across a bar boundary at %s HP', (health) => {
    let state = beginFight(createFight('bill', 'hisoka', { mode: 'versus-local' }))
    state.player.x = 46
    state.opponent = { ...state.opponent, x: 52, health }
    state = performAttack(state, 'player', 'light')
    for (let frame = 0; frame < 10; frame++) {
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    }
    expect(state.impact!.damage).toBeGreaterThan(1)
    expect(state.opponent.health).toBe(Math.max(0, health - state.impact!.damage))
    expect(state.phase).toBe(health === 1 ? 'finished' : 'fighting')
  })

  it('restores all bars for the next round', () => {
    const state = beginFight(createFight('bill', 'hisoka'))
    state.player.health = 42
    state.opponent.health = 0
    const next = nextRound(finishFight(state, 'player'))
    expect(next.player.health).toBe(300)
    expect(next.opponent.health).toBe(300)
    expect(next.roundsWon.player).toBe(1)
  })

  it('heals across bars and caps Holy Chain at the full reserve', () => {
    const heal = (health: number) => {
      let state = beginFight(createFight('kurapika', 'hisoka', { mode: 'versus-local' }))
      state.player.health = health
      state = performMove({
        state,
        side: 'player',
        action: 'special',
        input: { ...EMPTY_INPUT, down: true },
      })
      for (let frame = 0; frame < 40; frame++)
        state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
      return state.player.health
    }
    expect(heal(198)).toBe(216)
    expect(heal(298)).toBe(300)
  })

  it('revives Camilla with all bars', () => {
    const state = beginFight(createFight('camilla', 'hisoka'))
    state.player.health = 0
    let revived = camillaHatsu.onDeath!({ state, victimSide: 'player', killerSide: 'opponent' })
    expect(revived.player.health).toBe(0)
    for (let frame = 0; frame < CATS_NAME_FRAMES; frame++)
      revived = tickFight(revived, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(revived.player.health).toBe(300)
    expect(revived.opponent.health).toBe(0)
  })

  it('restores the training dummy to the full reserve after a lethal hit', () => {
    let state = beginFight(createFight('bill', 'hisoka', { mode: 'training' }))
    state.player.x = 46
    state.opponent = { ...state.opponent, x: 52, health: 1 }
    state = performAttack(state, 'player', 'light')
    for (let frame = 0; frame < 10; frame++) state = tickFight(state, EMPTY_INPUT, 1 / 60)
    expect(state.opponent.health).toBe(300)
    expect(state.phase).toBe('fighting')
  })

  it('uses the whole reserve for tactical thresholds', () => {
    const state = createFight('bill', 'hisoka')
    expect(healthPercent({ ...state.player, health: 150 })).toBe(50)
  })
})
