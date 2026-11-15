import { describe, expect, it } from 'vitest'
import { resolveFightImpacts } from './combatImpact'
import {
  beginFight,
  createFight,
  nextRound,
  performAttack,
  performThrow,
  tickFight,
} from './engine'
import { attackData } from './frameData'
import { EMPTY_INPUT, type FightState } from './types'

function close(): FightState {
  const state = beginFight(createFight('morena', 'machi', 'knockout'))
  return {
    ...state,
    player: { ...state.player, x: 46, aura: 100 },
    opponent: { ...state.opponent, x: 51, aura: 100 },
  }
}

function resolveActive(state: FightState, side: 'player' | 'opponent' = 'player'): FightState {
  const fighter = state[side]
  if (!fighter.attack) return state
  const armed = {
    ...state,
    [side]: {
      ...fighter,
      attack: {
        ...fighter.attack,
        frame: attackData(fighter.attack.kind, fighter).startup,
      },
    },
  }
  return resolveFightImpacts(armed, [])
}

function step(state: FightState, frames: number): FightState {
  let next = state
  for (let frame = 0; frame < frames; frame++) next = tickFight(next, EMPTY_INPUT, 1 / 60)
  return next
}

describe('complete 2D combat grammar', () => {
  it('knocks down, wakes up invulnerable, and accepts a reversal buffer', () => {
    let state = resolveActive(performThrow(close(), 'player'))
    expect(state.opponent.knockdownFrames).toBeGreaterThan(0)
    state = performAttack(state, 'opponent', 'heavy')
    expect(state.opponent.bufferedAttack?.kind).toBe('heavy')
    while (state.opponent.knockdownFrames > 0) state = step(state, 1)
    expect(state.opponent.wakeupInvulnerableFrames).toBeGreaterThan(0)
    expect(state.opponent.attack?.reversal).toBe(true)
  })

  it('labels counter hits and punishes from the defender attack phase', () => {
    let counter = performAttack(performAttack(close(), 'opponent', 'heavy'), 'player', 'light')
    counter = resolveActive(counter)
    expect(counter.impact).toMatchObject({ counterHit: true, punish: false })

    let punish = performAttack(performAttack(close(), 'opponent', 'heavy'), 'player', 'light')
    punish.opponent.attack!.frame =
      attackData('heavy', punish.opponent).startup + attackData('heavy', punish.opponent).active
    punish = resolveActive(punish)
    expect(punish.impact).toMatchObject({ counterHit: false, punish: true })
  })

  it('scales combos and enforces the airborne juggle limit', () => {
    let state = resolveActive(performAttack(close(), 'player', 'light'))
    const firstDamage = state.impact!.damage
    state.player.attack = null
    state = resolveActive(performAttack(state, 'player', 'light'))
    expect(state.impact).toMatchObject({ comboHits: 2, damageScale: 0.9 })
    expect(state.impact!.damage).toBeLessThan(firstDamage)

    state.player.attack = null
    state.opponent = { ...state.opponent, y: 4, juggleCount: 3 }
    const sequence = state.impact!.sequence
    state = resolveActive(performAttack(state, 'player', 'heavy'))
    expect(state.impact!.sequence).toBe(sequence)
  })

  it('plays a best-of-three match while preserving round wins', () => {
    let state = close()
    state.opponent.health = 1
    state = resolveActive(performAttack(state, 'player', 'light'))
    expect(state.roundsWon.player).toBe(1)
    expect(state.matchWinner).toBeNull()

    state = beginFight(nextRound(state))
    state = {
      ...state,
      player: { ...state.player, x: 46 },
      opponent: { ...state.opponent, x: 51, health: 1 },
    }
    state = resolveActive(performAttack(state, 'player', 'light'))
    expect(state.roundsWon.player).toBe(2)
    expect(state.matchWinner).toBe('player')
  })
})
