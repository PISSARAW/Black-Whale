import { describe, it, expect } from 'vitest'
import { poolOf } from '../aura'
import { chargeKo } from './ko'
import { raiseKen } from './ken'
import { setRyu, STRIKE_THRESHOLD, coveredZones } from './ryu'
import { checkExhaustion, isExposedAt, resolveStrike } from './resolve'
import { initialDuelState, type DuelState, type DuelistState } from './state'

function duel(): DuelState {
  return initialDuelState({ player: poolOf(100), hunter: poolOf(100) })
}

function pushedForward(duelist: DuelistState): DuelistState {
  return setRyu(duelist, { attack: STRIKE_THRESHOLD + 0.2, guard: 'torso' })
}

describe('what a guard covers', () => {
  it('covers a second zone when the aura is held back', () => {
    const settled = setRyu(initialDuelState().player, { attack: 0.2, guard: 'head' })
    expect(coveredZones(settled)).toHaveLength(2)
  })

  it('narrows to one when it is pushed forward to strike', () => {
    expect(coveredZones(pushedForward(initialDuelState().player))).toEqual(['torso'])
  })

  it('covers everything under Ken', () => {
    expect(coveredZones(raiseKen(initialDuelState().player, true))).toHaveLength(4)
  })

  it('covers only the gathered point under Ko — total exposure elsewhere', () => {
    const gathered = chargeKo(pushedForward(initialDuelState().player), 'legs')
    expect(coveredZones(gathered)).toEqual(['legs'])
    expect(isExposedAt(gathered, 'head')).toBe(true)
  })

  it('covers nothing at all when held, spent, or in Zetsu', () => {
    const base = initialDuelState().player
    expect(coveredZones({ ...base, held: 3 })).toEqual([])
    expect(coveredZones({ ...base, broken: true })).toEqual([])
    expect(coveredZones({ ...base, zetsu: true })).toEqual([])
  })
})

describe('a Ko that is thrown', () => {
  it('lands on a zone the other one is not covering', () => {
    const state = duel()
    state.player = chargeKo(pushedForward(state.player), 'head')
    state.hunter = setRyu(state.hunter, { attack: 0.7, guard: 'legs' })
    expect(resolveStrike(state, 'player').outcome).toBe('won')
  })

  it('does not land on the zone the other one guessed right', () => {
    const state = duel()
    state.player = chargeKo(pushedForward(state.player), 'head')
    state.hunter = setRyu(state.hunter, { attack: 0.7, guard: 'head' })
    const after = resolveStrike(state, 'player')
    expect(after.outcome).toBe('playing')
    expect(after.player.ko).toBeNull()
  })

  it('does not land on Ken, wherever it is aimed', () => {
    const state = duel()
    state.hunter = raiseKen(state.hunter, true)
    for (const zone of ['head', 'torso', 'arms', 'legs'] as const) {
      state.player = chargeKo(pushedForward({ ...state.player, ko: null }), zone)
      expect(resolveStrike(state, 'player').outcome).toBe('playing')
    }
  })

  it('is spent whether it lands or not', () => {
    const state = duel()
    state.player = chargeKo(pushedForward(state.player), 'head')
    state.hunter = setRyu(state.hunter, { attack: 0.7, guard: 'head' })
    expect(state.player.pool.available).toBe(80)
    expect(resolveStrike(state, 'player').player.ko).toBeNull()
  })

  it('does nothing when none was gathered', () => {
    const state = duel()
    expect(resolveStrike(state, 'player')).toBe(state)
  })
})

describe('a hunter who has been held — the junction, as the duel sees it', () => {
  it('cannot answer anything, so the blow lands wherever it is aimed', () => {
    const state = duel()
    state.hunter = { ...raiseKen(state.hunter, true), held: 6 }
    state.player = chargeKo(pushedForward(state.player), 'arms')
    expect(resolveStrike(state, 'player').outcome).toBe('won')
  })
})

describe('exhaustion — invariant I3', () => {
  it('ends the duel when a reservoir reaches zero, with no blow struck', () => {
    const state = { ...duel(), hunter: { ...duel().hunter, pool: poolOf(0) } }
    const judged = checkExhaustion(state)
    expect(judged.hunter.broken).toBe(true)
    expect(judged.outcome).toBe('won')
  })

  it('is a defeat when it is the player who runs out', () => {
    const state = { ...duel(), player: { ...duel().player, pool: poolOf(0) } }
    expect(checkExhaustion(state).outcome).toBe('lost')
  })

  it('goes to the hunter when both run out at once — the player is the prey', () => {
    const both = duel()
    both.player = { ...both.player, pool: poolOf(0) }
    both.hunter = { ...both.hunter, pool: poolOf(0) }
    expect(checkExhaustion(both).outcome).toBe('lost')
  })

  it('leaves a duel with aura on both sides alone', () => {
    expect(checkExhaustion(duel()).outcome).toBe('playing')
  })
})

describe('no statistics anywhere — invariant I1', () => {
  it('has no field on a duelist that could be a quantity of harm', () => {
    const fields = Object.keys(initialDuelState().player)
    for (const suspect of ['health', 'hp', 'damage', 'power', 'strength', 'defence']) {
      expect(fields).not.toContain(suspect)
    }
  })

  it('never decides an outcome by comparing the two sides’ numbers', () => {
    // The same blow, against the same guard, with wildly different splits: the
    // result is decided by which zone, never by how much.
    const weak = duel()
    weak.player = chargeKo(setRyu(weak.player, { attack: 0.51, guard: 'torso' }), 'head')
    weak.hunter = setRyu(weak.hunter, { attack: 0.99, guard: 'legs' })

    const strong = duel()
    strong.player = chargeKo(setRyu(strong.player, { attack: 0.99, guard: 'torso' }), 'head')
    strong.hunter = setRyu(strong.hunter, { attack: 0.51, guard: 'legs' })

    expect(resolveStrike(weak, 'player').outcome).toBe(resolveStrike(strong, 'player').outcome)
  })
})
