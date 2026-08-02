import { describe, it, expect } from 'vitest'
import { poolOf } from '../aura'
import { duelReducer } from './reducer'
import { GYO_PER_SECOND } from './gyo'
import { IN_PER_SECOND } from './in'
import { KEN_PER_SECOND } from './ken'
import { KO_COST } from './ko'
import { BREAK_AWAY_AFTER } from './disengage'
import { initialDuelState, type DuelState } from './state'

function duel(player = 100, hunter = 100): DuelState {
  return initialDuelState({ player: poolOf(player), hunter: poolOf(hunter) })
}

function run(state: DuelState, seconds: number, dt = 0.1): DuelState {
  let current = state
  for (let elapsed = 0; elapsed < seconds - 1e-9; elapsed += dt) {
    current = duelReducer(current, { type: 'TICK', dt })
  }
  return current
}

describe('the continuous principles', () => {
  it('charge Gyo, In and Ken at their own rates', () => {
    for (const [action, rate] of [
      ['GYO', GYO_PER_SECOND],
      ['IN', IN_PER_SECOND],
      ['KEN', KEN_PER_SECOND],
    ] as const) {
      const on = duelReducer(duel(), { type: action, side: 'player', on: true })
      expect(run(on, 1).player.pool.available).toBeCloseTo(100 - rate, 5)
    }
  })

  it('drop rather than go negative when the reservoir runs out', () => {
    const on = duelReducer(duel(4), { type: 'KEN', side: 'player', on: true })
    const spent = run(on, 2)
    expect(spent.player.ken).toBe(false)
    expect(spent.player.pool.available).toBeGreaterThanOrEqual(0)
  })

  it('cost nothing in Zetsu, which is the absence of aura and not a technique', () => {
    let state = duelReducer(duel(), { type: 'KEN', side: 'player', on: true })
    state = duelReducer(state, { type: 'ZETSU', on: true })
    const after = run(state, 1)
    expect(after.player.ken).toBe(false)
    expect(after.player.pool.available).toBe(100)
  })
})

describe('gathering a Ko', () => {
  it('takes twenty, once Ryu is pushed forward', () => {
    let state = duelReducer(duel(), { type: 'RYU', side: 'player', setting: { attack: 0.8 } })
    state = duelReducer(state, { type: 'KO', side: 'player', zone: 'head' })
    expect(state.player.ko).toBe('head')
    expect(state.player.pool.available).toBe(100 - KO_COST)
  })

  it('is refused with the aura held back — the split is a real trade', () => {
    let state = duelReducer(duel(), { type: 'RYU', side: 'player', setting: { attack: 0.2 } })
    state = duelReducer(state, { type: 'KO', side: 'player', zone: 'head' })
    expect(state.player.ko).toBeNull()
    expect(state.player.pool.available).toBe(100)
  })

  it('is refused from behind Ken: there is no strike from cover', () => {
    let state = duelReducer(duel(), { type: 'RYU', side: 'player', setting: { attack: 0.8 } })
    state = duelReducer(state, { type: 'KEN', side: 'player', on: true })
    state = duelReducer(state, { type: 'KO', side: 'player', zone: 'head' })
    expect(state.player.ko).toBeNull()
  })

  it('is put down again when the aura is moved back', () => {
    let state = duelReducer(duel(), { type: 'RYU', side: 'player', setting: { attack: 0.8 } })
    state = duelReducer(state, { type: 'KO', side: 'player', zone: 'head' })
    state = duelReducer(state, { type: 'RYU', side: 'player', setting: { attack: 0.1 } })
    expect(state.player.ko).toBeNull()
  })
})

describe('breaking away — T3.7', () => {
  it('takes three unread seconds of Zetsu', () => {
    const dropped = duelReducer(duel(), { type: 'ZETSU', on: true })
    expect(run(dropped, BREAK_AWAY_AFTER - 1).outcome).toBe('playing')
    expect(run(dropped, BREAK_AWAY_AFTER + 0.5).outcome).toBe('broke')
  })

  it('makes no progress while the hunter is looking', () => {
    let state = duelReducer(duel(), { type: 'GYO', side: 'hunter', on: true })
    state = duelReducer(state, { type: 'ZETSU', on: true })
    const after = run(state, BREAK_AWAY_AFTER + 2)
    expect(after.outcome).toBe('playing')
    expect(after.breaking).toBe(0)
  })

  it('loses whatever progress it had when the aura is picked back up', () => {
    let state = duelReducer(duel(), { type: 'ZETSU', on: true })
    state = run(state, 1)
    expect(state.breaking).toBeGreaterThan(0)
    state = duelReducer(state, { type: 'ZETSU', on: false })
    expect(state.breaking).toBe(0)
  })
})

describe('a finished duel', () => {
  it('stops answering actions', () => {
    const over = run(duelReducer(duel(1), { type: 'KEN', side: 'player', on: true }), 1)
    expect(over.outcome).toBe('lost')
    expect(duelReducer(over, { type: 'RYU', side: 'player', setting: { attack: 1 } })).toBe(over)
  })
})
