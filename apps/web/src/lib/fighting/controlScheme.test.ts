import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performMove, tickFight } from './engine'
import { FIXED_STEP } from './fightClock'
import { SIMPLIFIED_SUPER_DAMAGE, controlSchemeOf, refusedByScheme } from './controlScheme'
import { moveForAction } from './movesets'
import { MOTION_LOG_FRAMES, numpadDirection, quarterCircleForward } from './motionInput'
import { initialReplayState } from './fightReplayCommands'
import { replaySetup } from './fightReplayRecorder'
import { setTrainingResources } from './trainingSession'
import type { ControlScheme } from './controlScheme'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type FighterId,
} from './types'

type Direction = 'down' | 'downForward' | 'forward' | 'back' | 'neutral'

/** Absolute input for a relative direction of the fighter on `side`. */
function held(state: FightState, side: FightSide, direction: Direction): FightInput {
  const forwardKey = state[side].facing === 1 ? 'right' : 'left'
  const backKey = forwardKey === 'right' ? 'left' : 'right'
  return {
    ...EMPTY_INPUT,
    down: direction === 'down' || direction === 'downForward',
    [forwardKey]: direction === 'forward' || direction === 'downForward',
    [backKey]: direction === 'back',
  }
}

function fight(options: {
  fighter: FighterId
  scheme?: ControlScheme
  side?: FightSide
  mirrored?: boolean
}): FightState {
  const side = options.side ?? 'player'
  const other: FighterId = options.fighter === 'bill' ? 'hisoka' : 'bill'
  const [player, opponent] = side === 'player' ? [options.fighter, other] : [other, options.fighter]
  let state = beginFight(
    createFight(player, opponent, {
      mode: 'training',
      controls: options.scheme ? { [side]: options.scheme } : undefined,
    }),
  )
  state = setTrainingResources(state, side, { aura: 100, infiniteAura: true, infiniteHealth: true })
  const [near, far] = options.mirrored ? [54, 49] : [44, 49]
  const x = { player: side === 'player' ? near : far, opponent: side === 'player' ? far : near }
  state = {
    ...state,
    player: { ...state.player, x: x.player, facing: x.player < x.opponent ? 1 : -1 },
    opponent: { ...state.opponent, x: x.opponent, facing: x.opponent < x.player ? 1 : -1 },
  }
  return state
}

/** Holds each direction for `ticks` simulated frames on `side`, as render batches would. */
function sweep(options: {
  state: FightState
  side: FightSide
  steps: readonly Direction[]
  ticks: number
}): FightState {
  let state = options.state
  for (const direction of options.steps)
    for (let tick = 0; tick < options.ticks; tick++) {
      const input = held(state, options.side, direction)
      state = tickFight(state, options.side === 'player' ? input : EMPTY_INPUT, {
        dt: FIXED_STEP,
        opponentInput: options.side === 'opponent' ? input : EMPTY_INPUT,
        ai: false,
      })
    }
  return state
}

function special(state: FightState, side: FightSide, direction: Direction): string | undefined {
  const pressed = performMove({
    state,
    side,
    action: 'special',
    input: held(state, side, direction),
  })
  return pressed[side].attack?.moveId
}

const QCF: readonly Direction[] = ['down', 'downForward', 'forward']

describe('numpad notation and quarter-circle forward', () => {
  it('reads directions relative to facing', () => {
    const forward = { ...EMPTY_INPUT, right: true }
    expect(numpadDirection(1, forward)).toBe(6)
    expect(numpadDirection(-1, forward)).toBe(4)
    expect(numpadDirection(1, { ...forward, down: true })).toBe(3)
    expect(numpadDirection(-1, { ...EMPTY_INPUT, down: true, left: true })).toBe(3)
    expect(numpadDirection(1, EMPTY_INPUT)).toBe(5)
  })
  it('accepts 2 3 6 in order, with repeats or noise, ending forward', () => {
    expect(quarterCircleForward([2, 3], 6)).toBe(true)
    expect(quarterCircleForward([5, 2, 2, 1, 3, 3, 6], 6)).toBe(true)
    expect(quarterCircleForward([2, 3, 6], 3)).toBe(true)
    expect(quarterCircleForward([2, 3], 3)).toBe(false)
    expect(quarterCircleForward([3, 2], 6)).toBe(false)
    expect(quarterCircleForward([2, 6], 6)).toBe(false)
    expect(quarterCircleForward([2, 3, 6], 5)).toBe(false)
  })
})

describe('classic and simplified schemes', () => {
  it('defaults to simplified and keeps the authored commands', () => {
    const state = fight({ fighter: 'kurapika' })
    expect(controlSchemeOf(state.player)).toBe('simplified')
    expect(special(state, 'player', 'forward')).toBe('kurapika:forwardSpecial')
  })

  it('classic refuses the super without its motion, and never falls back to a generic attack', () => {
    const state = fight({ fighter: 'kurapika', scheme: 'classic' })
    const pressed = performMove({
      state,
      side: 'player',
      action: 'special',
      input: held(state, 'player', 'forward'),
    })
    expect(pressed).toBe(state)
    expect(special(state, 'player', 'back')).toBe('kurapika:backSpecial')
  })

  for (const side of ['player', 'opponent'] as const)
    for (const mirrored of [false, true])
      for (const [hz, ticks] of [
        [120, 1],
        [60, 1],
        [30, 2],
        [20, 3],
      ] as const)
        it(`classic 236 performs the super: ${side}, ${mirrored ? 'facing left' : 'facing right'}, ${hz} Hz`, () => {
          for (const [fighter, expected] of [
            ['kurapika', 'kurapika:forwardSpecial'],
            ['benjamin', 'benjamin:neutralSpecial'],
          ] as const) {
            const start = fight({ fighter, scheme: 'classic', side, mirrored })
            const ready = sweep({ state: start, side, steps: QCF.slice(0, 2), ticks })
            expect(special(ready, side, 'forward'), `${fighter}`).toBe(expected)
          }
        })

  it('lets a motion expire after the log window', () => {
    let state = fight({ fighter: 'kurapika', scheme: 'classic' })
    state = sweep({ state, side: 'player', steps: ['down', 'downForward'], ticks: 1 })
    state = sweep({ state, side: 'player', steps: ['neutral'], ticks: MOTION_LOG_FRAMES })
    expect(special(state, 'player', 'forward')).toBeUndefined()
  })

  it('keeps Benjamin’s other forward special without a motion', () => {
    const state = fight({ fighter: 'benjamin', scheme: 'classic' })
    expect(special(state, 'player', 'forward')).toBe('benjamin:forwardSpecial')
    expect(special(state, 'player', 'neutral')).toBeUndefined()
  })

  it('leaves fighters without the grammar untouched in classic', () => {
    const state = fight({ fighter: 'hisoka', scheme: 'classic' })
    const forward = held(state, 'player', 'forward')
    expect(moveForAction(state.player, 'special', forward)?.slot).toBe('forwardSpecial')
    expect(refusedByScheme(state.player, forward, 'forwardSpecial')).toBe(false)
    const ticked = sweep({ state, side: 'player', steps: ['down'], ticks: 1 })
    expect(ticked.player.motionLog).toEqual([2])
  })

  it('keeps no motion log in simplified, so its state is unchanged', () => {
    const state = sweep({
      state: fight({ fighter: 'kurapika' }),
      side: 'player',
      steps: QCF,
      ticks: 1,
    })
    expect(state.player.motionLog).toBeUndefined()
  })

  it('removes a fifth of the super damage in simplified only', () => {
    const damage = (scheme: ControlScheme) => {
      let state = fight({ fighter: 'kurapika', scheme })
      state = sweep({ state, side: 'player', steps: QCF.slice(0, 2), ticks: 1 })
      state = performMove({
        state,
        side: 'player',
        action: 'special',
        input: held(state, 'player', 'forward'),
      })
      const before = state.opponent.health
      for (let i = 0; i < 60 && state.opponent.health === before; i++)
        state = tickFight(state, EMPTY_INPUT, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
      return before - state.opponent.health
    }
    const classic = damage('classic')
    expect(classic).toBeGreaterThan(0)
    expect(damage('simplified')).toBe(Math.floor(classic * SIMPLIFIED_SUPER_DAMAGE))
  })

  it('keeps the scheme across rounds and inside replay setups', () => {
    const state = fight({ fighter: 'kurapika', scheme: 'classic' })
    const next = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(controlSchemeOf(next.player)).toBe('classic')
    expect(next.player.motionLog).toBeUndefined()
    const replayed = initialReplayState(replaySetup(state)!)
    expect(controlSchemeOf(replayed.player)).toBe('classic')
  })
})
