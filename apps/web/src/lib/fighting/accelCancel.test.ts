import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { FIXED_STEP } from './fightClock'
import {
  ACCEL_HEAT_COST,
  ACCEL_HEAT_DRAIN,
  ACCEL_HEAT_MAX,
  coolAccelHeat,
  type AccelHeat,
} from './accelCancel'
import { moveForSlot } from './movesets'
import { EMPTY_INPUT, type FightState, type FighterId, type MoveAction } from './types'

const slot = (id: string) => id.split(':')[1]
const BNB: readonly [MoveAction, object][] = [
  ['light', {}],
  ['heavy', {}],
  ['heavy', { down: true }],
  ['heavy', { right: true }],
]

interface Played {
  moves: string[]
  hits: string[]
  state: FightState
}

/** Plays each step as soon as the engine admits it, against an idle dummy. */
function hitString(fighter: FighterId, accelHeat?: AccelHeat): Played {
  let state = beginFight(createFight(fighter, 'bill', { mode: 'training' }))
  state = {
    ...state,
    player: { ...state.player, x: 44, ...(accelHeat ? { accelHeat } : {}) },
    opponent: { ...state.opponent, x: 49 },
  }
  const played: Played = { moves: [], hits: [], state }
  for (let i = 0; i < 120 && played.moves.length < BNB.length; i++) {
    const [action, held] = BNB[played.moves.length]
    const input = { ...EMPTY_INPUT, ...held }
    const next = performMove({ state, side: 'player', action, input })
    if (next.player.attack && next.player.attack !== state.player.attack) {
      const cancelled = played.moves.length === 0 || state.player.attack !== null
      played.moves.push(
        `${slot(next.player.attack.moveId!)}${cancelled ? '' : ' (after recovery)'}`,
      )
      state = next
    }
    const health = state.opponent.health
    state = tickFight(state, EMPTY_INPUT, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
    if (state.opponent.health < health) played.hits.push(slot(state.player.attack!.moveId!))
  }
  for (let i = 0; i < 40; i++) {
    const health = state.opponent.health
    state = tickFight(state, EMPTY_INPUT, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
    if (state.opponent.health < health) played.hits.push(slot(state.player.attack!.moveId!))
  }
  return { ...played, state }
}

describe('relance (special → special on hit)', () => {
  it.each([
    ['kurapika', 'forwardSpecial', 'scarlet-verdict-followup'],
    ['benjamin', 'neutralSpecial', 'absolute-command-followup'],
  ] as const)(
    '%s: the sweep relaunches into the forward heavy, never back',
    (fighter, superSlot, followup) => {
      const sweep = moveForSlot(fighter, 'lowHeavy')!
      expect(sweep.cancelInto.map(slot)).toEqual(['forwardHeavy', superSlot])
      expect(sweep.cancelOnBlockInto).toEqual([])
      expect(moveForSlot(fighter, 'forwardHeavy')!.cancelInto.map(slot)).toEqual([
        superSlot,
        followup,
      ])
    },
  )

  it('stays off for derived grammars', () => {
    const hisoka = moveForSlot('hisoka', 'lowHeavy')!
    expect(hisoka.cancelInto.some((id) => id.endsWith(':forwardHeavy'))).toBe(false)
  })

  it.each(['kurapika', 'benjamin'] as const)(
    '%s: the relaunched heavy strikes the body the sweep put down',
    (fighter) => {
      const played = hitString(fighter)
      expect(played.moves).toEqual(['standingLight', 'standingHeavy', 'lowHeavy', 'forwardHeavy'])
      expect(played.hits).toEqual(['standingLight', 'standingHeavy', 'lowHeavy', 'forwardHeavy'])
      expect(played.state.player.accelHeat?.overheated).toBe(false)
      expect(played.state.player.accelHeat!.heat).toBeGreaterThan(0)
      expect(played.state.player.accelHeat!.heat).toBeLessThan(ACCEL_HEAT_COST)
    },
  )

  it.each(['kurapika', 'benjamin'] as const)(
    '%s: a relance at the ceiling overheats the Ren',
    (fighter) => {
      // The gauge cools while the chain plays, so start well above the last free relance.
      const played = hitString(fighter, { heat: ACCEL_HEAT_MAX - 10, overheated: false })
      expect(played.moves.at(-1)).toBe('forwardHeavy')
      expect(played.state.player.accelHeat?.overheated).toBe(true)
    },
  )

  it.each(['kurapika', 'benjamin'] as const)(
    '%s: an overheated fighter cannot relaunch; the heavy waits for recovery',
    (fighter) => {
      const played = hitString(fighter, { heat: 60, overheated: true })
      expect(played.moves).toEqual([
        'standingLight',
        'standingHeavy',
        'lowHeavy',
        'forwardHeavy (after recovery)',
      ])
      expect(played.hits).toEqual(['standingLight', 'standingHeavy', 'lowHeavy'])
    },
  )

  it('cools every frame and lifts the lock only once the gauge is empty', () => {
    const frames = ACCEL_HEAT_COST / ACCEL_HEAT_DRAIN
    let heat: AccelHeat | undefined = { heat: ACCEL_HEAT_COST, overheated: true }
    for (let i = 1; i < frames; i++) heat = coolAccelHeat(heat)
    expect(heat).toEqual({ heat: ACCEL_HEAT_DRAIN, overheated: true })
    expect(coolAccelHeat(heat)).toBeUndefined()
  })
})
