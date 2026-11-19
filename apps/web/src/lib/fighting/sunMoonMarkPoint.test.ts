import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight, nextRound } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { advanceArena } from './arenaSimulation'
import { advanceArenaUtility } from './arenaUtility'
import { updateEntity } from './preparationWorld'
import { objectMarkPoint } from './sunMoonMarkPoint'
import { performCrossGameAction } from './crossGameAction'
import { crossGameBusy } from './crossGame'
import { offerMoonlightContract, respondMoonlightContract } from './moonlightContract'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'

function ready(other: FighterId = 'theta'): FightState {
  const state = beginFight(
    createFight('chrollo', other, {
      mode: 'versus-local',
      environment: { arenaInteractions: true },
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 27, aura: 100 },
    opponent: { ...state.opponent, x: 78 },
  }
}
const use = (state: FightState, command: ArsenalCommand, side: FightSide = 'player') =>
  performArsenalAction({ state, side, command }, performAuraAttack)
const entry = (state: FightState, x = 34) =>
  state.battlefield!.entities.find((e) => e.id === `arena:crate:${x}`)!
function markedPair(): FightState {
  let state = use(ready(), { action: 'sun-moon-charge-sun', target: 'arena:crate:34' })
  state = use(state, { action: 'sun-moon-release' })
  state = {
    ...state,
    player: {
      ...state.player,
      x: 59,
      chrolloBook: { ...state.player.chrolloBook!, open: false, bookmark: 'sun-and-moon' },
    },
  }
  state = use(state, { action: 'sun-moon-charge-moon', target: 'arena:crate:66' })
  return use(state, { action: 'sun-moon-release' })
}
function adjacent(state: FightState): FightState {
  return updateEntity(state, 'arena:crate:66', { x: 40 })
}
function turnSun(state: FightState): FightState {
  return use(
    { ...state, player: { ...state.player, x: 27 } },
    { action: 'arena-turn-object', target: 'arena:crate:34' },
  )
}

describe('Sun and Moon detonate only when the actual indelible signs meet', () => {
  it('does not confuse touching unmarked faces with touching signs', () => {
    const state = adjacent(markedPair())
    expect(objectMarkPoint(entry(state), 'sun')).toEqual({ x: 31, y: 8 })
    expect(objectMarkPoint(entry(state, 66), 'moon')).toEqual({ x: 37, y: 8 })
    const safe = advanceArena(state)
    expect(entry(safe).health).toBe(40)
    expect(entry(safe, 66).health).toBe(40)
  })
  it('physically turns a marked crate, preserves its original local sign, and detonates on genuine sign contact', () => {
    const state = adjacent(markedPair())
    const turned = turnSun(state)
    expect(entry(turned).arena!.sunPoint).toEqual(entry(state).arena!.sunPoint)
    expect(objectMarkPoint(entry(turned), 'sun')).toEqual({ x: 37, y: 8 })
    const exploded = advanceArena(turned)
    expect(entry(exploded).health).toBe(0)
    expect(entry(exploded, 66).health).toBe(0)
    expect(entry(state).health).toBe(40)
  })
  it('refuses a detonation when even touching marked faces carry their signs at different heights', () => {
    let state = turnSun(adjacent(markedPair()))
    state = updateEntity(state, 'arena:crate:66', { y: 1 })
    expect(entry(advanceArena(state)).health).toBe(40)
  })
  it('does not invent a contact position for an unlocated mark supplied in an authored scenario', () => {
    let state = turnSun(adjacent(markedPair()))
    state = updateEntity(state, 'arena:crate:34', {
      arena: { ...entry(state).arena!, sunPoint: undefined },
    })
    expect(entry(advanceArena(state)).health).toBe(40)
  })
  it('requires a physical free hand and actual reach to turn a crate, without charging aura', () => {
    let state = markedPair()
    state = {
      ...state,
      player: { ...state.player, x: 27, aura: 0, nen: { ...state.player.nen, mode: 'zetsu' } },
    }
    const turned = use(state, { action: 'arena-turn-object', target: 'arena:crate:34' })
    expect(entry(turned).arena!.facing).toBe(-1)
    expect(turned.player.aura).toBe(0)
    const far = { ...state, player: { ...state.player, x: 10 } }
    expect(use(far, { action: 'arena-turn-object', target: 'arena:crate:34' })).toBe(far)
    const injured: FightState = {
      ...state,
      player: { ...state.player, bodyDamage: { parts: ['left-forearm', 'right-forearm'] } },
    }
    expect(use(injured, { action: 'arena-turn-object', target: 'arena:crate:34' })).toBe(injured)
  })
  it('interrupts a continuous charge when another body turns the contacted sign away from its palm', () => {
    let state = use(ready(), { action: 'sun-moon-charge-sun', target: 'arena:crate:34' })
    for (let i = 0; i < 30; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    state = { ...state, opponent: { ...state.opponent, x: 39 } }
    const turned = use(state, { action: 'arena-turn-object', target: 'arena:crate:34' }, 'opponent')
    expect(entry(turned).arena!.facing).toBe(-1)
    const stopped = advanceArenaUtility(turned, 'player')
    expect(stopped.arena!.pending.player).toBeUndefined()
    expect(entry(stopped).arena!.sunCharge).toBe(30)
  })
  it('does not recharge a sign through the opposite face of its material support', () => {
    const state = turnSun(markedPair())
    expect(use(state, { action: 'sun-moon-charge-sun', target: 'arena:crate:34' })).toBe(state)
  })
  it('preserves both the material sign and its orientation through an ordinary round transition', () => {
    const state = turnSun(markedPair())
    const next = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(entry(next).arena!.sunPoint).toEqual(entry(state).arena!.sunPoint)
    expect(objectMarkPoint(entry(next), 'sun')).toEqual(objectMarkPoint(entry(state), 'sun'))
  })
  it('applies the actual Cross Game order before any mark or charge can take effect', () => {
    let state = ready('mizaistom')
    state = { ...state, opponent: { ...state.opponent, x: 38 } }
    state = performCrossGameAction({
      state,
      side: 'opponent',
      kind: 'special',
      moveId: 'mizaistom:neutralSpecial',
      auraCharged: false,
    })!
    expect(state.player.crossGame).toBeDefined()
    for (let i = 0; i < 180; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(state.player.crossGame?.noticeFrames).toBe(0)
    const stopped = use(state, { action: 'sun-moon-charge-sun', target: 'arena:crate:34' })
    expect(crossGameBusy(stopped.player)).toBe(true)
    expect(entry(stopped).arena!.sun).toBeUndefined()
    expect(stopped.arena!.pending.player).toBeUndefined()
    const physical = use(state, { action: 'arena-turn-object', target: 'arena:crate:34' })
    expect(crossGameBusy(physical.player)).toBe(true)
    expect(entry(physical).arena!.facing).toBeUndefined()
  })
  it('honours a real signed Moonlight Act truce before producing a bomb mark', () => {
    let state = ready('longhi')
    state = {
      ...state,
      opponent: { ...state.opponent, x: 38 },
      player: {
        ...state.player,
        chrolloBook: { ...state.player.chrolloBook!, open: false, bookmark: 'sun-and-moon' },
      },
    }
    state = offerMoonlightContract({ state, side: 'opponent' })
    state = respondMoonlightContract({ state, side: 'player', accept: true })
    expect(state.moonlight?.active).toBeDefined()
    const stopped = use(state, { action: 'sun-moon-charge-sun', target: 'arena:crate:34' })
    expect(stopped.player.moonlightPenaltyFrames).toBeGreaterThan(0)
    expect(entry(stopped).arena!.sun).toBeUndefined()
    expect(stopped.arena!.pending.player).toBeUndefined()
  })
})
