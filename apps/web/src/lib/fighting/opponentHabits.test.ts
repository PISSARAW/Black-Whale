import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove, tickFight } from './engine'
import {
  rememberOpponentHabits,
  repeatedHabit,
  habitGuardInput,
  habitAttackSlots,
} from './opponentHabits'
import { knownOpponentTarget, perceivedOpponentGap } from './opponentAwareness'
import { moveCounterplayOpponent } from './counterplayOpponent'
import { planOpponentNen } from './opponentNenPlan'
import { EMPTY_INPUT, type FightState, type FightProjectile } from './types'

function fight(): FightState {
  const state = beginFight(
    createFight('benjamin', 'kurapika', { mode: 'versus-ai', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 53, aura: 100 },
  }
}
function low(state: FightState, frame: number): FightState {
  const player = performMove({
    state: { ...state, player: { ...state.player, attack: null } },
    side: 'player',
    action: 'heavy',
    input: { ...EMPTY_INPUT, down: true },
  }).player
  return { ...state, frame, player: { ...player, crouching: true } }
}
function remember(state: FightState): FightState {
  return { ...state, opponent: rememberOpponentHabits(state, state.opponent) }
}
function threeLows(): FightState {
  let state = fight()
  for (let i = 0; i < 3; i++) {
    state = remember({ ...state, frame: i * 40, player: { ...state.player, attack: null } })
    state = remember(low(state, i * 40 + 1))
  }
  return state
}
function shot(id: number): FightProjectile {
  return {
    id,
    owner: 'player',
    fighterId: 'franklin',
    x: 35,
    y: 6,
    velocityX: 82,
    width: 0.5,
    height: 0.2,
    damage: 10,
    hitstun: 12,
    blockstun: 8,
    hitstop: 4,
    knockback: 1,
    targetZone: 'torso',
    shape: 'bullet',
    colour: '#fff',
    age: 0,
    lifetime: 200,
    matter: 'nen',
  }
}

describe('bounded AI knowledge and adaptation', () => {
  it('records a visible action once rather than once per render or hitstop', () => {
    let state = remember(low(fight(), 1))
    const first = state.opponent.observedHabits
    state = remember(state)
    expect(state.opponent.observedHabits).toBe(first)
    state = remember({
      ...state,
      frame: 8,
      player: { ...state.player, attack: { ...state.player.attack!, frame: 1 } },
    })
    expect(state.opponent.observedHabits?.sightings).toHaveLength(1)
  })
  it('learns repeated visible lows, but waits before changing its guard', () => {
    let state = threeLows()
    expect(repeatedHabit(state.opponent, 'low')).toBe(true)
    expect(habitGuardInput(state, state.opponent)).toBeNull()
    state = {
      ...state,
      frame: state.frame + 14,
      player: { ...state.player, attack: { ...state.player.attack!, frame: 14 } },
    }
    expect(habitGuardInput(state, state.opponent)).toMatchObject({ guard: true, down: true })
    const result = moveCounterplayOpponent({ state, fighter: state.opponent, target: state.player })
    expect(result.blocking).toBe(true)
    expect(result.crouching).toBe(true)
  })
  it('does not turn habit knowledge into guard while hands are occupied', () => {
    let state = threeLows()
    state = {
      ...state,
      frame: state.frame + 14,
      opponent: { ...state.opponent, pluggingWounds: true },
    }
    const next = moveCounterplayOpponent({ state, fighter: state.opponent, target: state.player })
    expect(next.blocking).toBe(false)
  })
  it('does not record a queued input, private reply or concealed technique as a sighting', () => {
    const state = low(fight(), 1)
    state.player.attack = { ...state.player.attack!, concealed: true }
    state.player.bufferedAttack = {
      kind: 'heavy',
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
    }
    const next = remember(state)
    expect(next.opponent.observedHabits?.sightings).toEqual([])
    const noAttack = remember({ ...state, player: { ...state.player, attack: null } })
    expect(noAttack.opponent.observedHabits?.sightings).toEqual([])
  })
  it('does not record concealed aura projectiles without available perception', () => {
    const state = { ...fight(), frame: 1, projectiles: [{ ...shot(1), concealed: true }] }
    expect(remember(state).opponent.observedHabits?.sightings).toEqual([])
    state.opponent.nen.gyo = true
    expect(remember(state).opponent.observedHabits?.sightings).toContainEqual({
      kind: 'projectile',
      at: 1,
    })
  })
  it('adapts to repeated perceived shots with a delayed ordinary approach jump', () => {
    let state = fight()
    for (let i = 1; i <= 3; i++)
      state = remember({ ...state, frame: i * 30, projectiles: [shot(i)] })
    expect(repeatedHabit(state.opponent, 'projectile')).toBe(true)
    state.opponent.counterplayRead = { key: 'projectile:3', frames: 14, coveringEars: false }
    const result = moveCounterplayOpponent({ state, fighter: state.opponent, target: state.player })
    expect(result.motion?.prejumpFrames).toBeGreaterThan(0)
    expect(result.motion?.jumpDirection).toBe(-1)
    expect(result.wakeupInvulnerableFrames).toBe(0)
  })
  it('prefers an anti-air only after repeated airborne manifestations and current visual contact', () => {
    const state = threeLows()
    state.opponent.observedHabits = {
      ...state.opponent.observedHabits!,
      sightings: [1, 2, 3].map((at) => ({ kind: 'air', at })),
    }
    state.player.y = 8
    expect(habitAttackSlots(state)).toContain('standingHeavy')
    state.opponent.hatsuEffects.senseSeals = 1
    expect(habitAttackSlots(state)).toBeNull()
  })
  it('remembers a last known position temporarily, without tracking a blind target’s new position', () => {
    let state = remember(fight())
    state.opponent.hatsuEffects.senseSeals = 1
    state = { ...state, frame: 30, player: { ...state.player, x: 90 } }
    const next = remember(state)
    expect(knownOpponentTarget(next)?.x).toBe(44)
    expect(perceivedOpponentGap(next)).toBe(9)
    expect(knownOpponentTarget({ ...next, frame: 121 })).toBeNull()
  })
  it('does not move or choose a hidden defense differently when the blind target changes unseen', () => {
    const state = fight()
    state.opponent.hatsuEffects.senseSeals = 1
    const move = (s: FightState) =>
      moveCounterplayOpponent({ state: s, fighter: s.opponent, target: s.player })
    const base = move(state)
    const changed = low({ ...state, player: { ...state.player, x: 90 } }, 0)
    expect(move(changed).x).toBe(base.x)
    expect(move(changed).observedHabits?.sightings).toEqual([])
    expect(planOpponentNen(changed).opponent.nen).toEqual(planOpponentNen(state).opponent.nen)
  })
  it('uses En only inside its actual radius and does not keep that information under forced Zetsu', () => {
    const state = fight()
    state.opponent.hatsuEffects.senseSeals = 1
    state.opponent.nen.en = { radius: 18 }
    expect(knownOpponentTarget(state)?.x).toBe(44)
    expect(knownOpponentTarget({ ...state, player: { ...state.player, x: 10 } })).toBeNull()
    state.opponent.moonlightZetsu = true
    expect(knownOpponentTarget(state)).toBeNull()
  })
  it('expires old habits and keeps a bounded sample history', () => {
    let state = threeLows()
    state = remember({ ...state, frame: 1200, player: { ...state.player, attack: null } })
    expect(state.opponent.observedHabits?.sightings).toEqual([])
    for (let i = 0; i < 30; i++)
      state = remember({ ...state, frame: 1201 + i, projectiles: [shot(20 + i)] })
    expect(state.opponent.observedHabits!.sightings.length).toBeLessThanOrEqual(12)
  })
  it('does not add adaptive memory to a local controlled opponent', () => {
    const state = fight()
    const next = tickFight(state, EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: EMPTY_INPUT,
      ai: false,
    })
    expect(next.opponent.observedHabits).toBeUndefined()
  })
})
