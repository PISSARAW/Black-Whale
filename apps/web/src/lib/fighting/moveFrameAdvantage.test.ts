import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { FIXED_STEP } from './fightClock'
import { formatFrameAdvantage, linkWindow, moveFrameAdvantage } from './moveFrameAdvantage'
import { moveForSlot } from './movesets'
import { FIGHTING_ROSTER } from './roster'
import { setTrainingDummy } from './trainingSession'
import type { FighterMove } from './movesetTypes'
import type { TrainingMeasurement } from './trainingTypes'
import {
  EMPTY_INPUT,
  type FightInput,
  type FighterId,
  type MoveAction,
  type MoveSlot,
} from './types'

const COMMANDS: readonly (readonly [MoveSlot, MoveAction, Partial<FightInput>])[] = [
  ['standingLight', 'light', {}],
  ['standingHeavy', 'heavy', {}],
  ['lowLight', 'light', { down: true }],
  ['lowHeavy', 'heavy', { down: true }],
  ['forwardLight', 'light', { right: true }],
  ['forwardHeavy', 'heavy', { right: true }],
  ['backHeavy', 'heavy', { left: true }],
]

interface Trial {
  fighter: FighterId
  command: (typeof COMMANDS)[number]
  move: FighterMove
  blocked: boolean
}

/** Plays the move point-blank in the training lab and returns its own measurement. */
function measure(trial: Trial): { sample: TrainingMeasurement; knockedDown: boolean } {
  let state = beginFight(createFight(trial.fighter, 'bill', { mode: 'training' }))
  if (trial.blocked) {
    const behavior = trial.move.guard === 'low' ? 'crouch-guard' : 'guard'
    state = setTrainingDummy(state, { behavior })
  }
  state = { ...state, player: { ...state.player, x: 44 }, opponent: { ...state.opponent, x: 49 } }
  const [, action, input] = trial.command
  state = performMove({ state, side: 'player', action, input: { ...EMPTY_INPUT, ...input } })
  expect(state.player.attack?.moveId).toBe(trial.move.id)
  let knockedDown = false
  for (let i = 0; i < 300 && state.training?.measurement?.status !== 'complete'; i++) {
    state = tickFight(state, EMPTY_INPUT, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
    knockedDown ||= state.opponent.knockdownFrames > 0
  }
  const sample = state.training?.measurement
  expect(sample?.status, `${trial.move.id} measurement`).toBe('complete')
  return { sample: sample!, knockedDown }
}

function trials(fighter: FighterId): Trial[] {
  return COMMANDS.flatMap((command) => {
    const move = moveForSlot(fighter, command[0])
    if (!move || !moveFrameAdvantage(move)) return []
    return [false, true].map((blocked) => ({ fighter, command, move, blocked }))
  })
}

const LIGHTS = COMMANDS.filter(([, action]) => action === 'light')

/** The first roster light whose self-link window equals `window` frames. */
function lightAtWindow(window: number): Trial {
  for (const { id: fighter } of FIGHTING_ROSTER)
    for (const command of LIGHTS) {
      const move = moveForSlot(fighter, command[0])
      const frames = move && moveFrameAdvantage(move)
      if (move && frames && linkWindow(frames, frames) === window)
        return { fighter, command, move, blocked: false }
    }
  throw new Error(`No light with a ${window}-frame self-link window`)
}

/** Restarts the same light on its first free frame; returns the combo count of the second hit. */
function selfLinkCombo(trial: Trial): number {
  let state = beginFight(createFight(trial.fighter, 'bill', { mode: 'training' }))
  state = { ...state, player: { ...state.player, x: 44 }, opponent: { ...state.opponent, x: 49 } }
  const [, action, held] = trial.command
  const input = { ...EMPTY_INPUT, ...held }
  const strike = () => performMove({ state, side: 'player', action, input })
  state = strike()
  const impacts: number[] = []
  for (let i = 0; i < 120 && impacts.length < 2; i++) {
    const previous = state.impact?.sequence
    state = tickFight(state, input, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
    if (state.impact && state.impact.sequence !== previous) impacts.push(state.impact.comboHits)
    if (impacts.length === 1 && !state.player.attack && state.hitstop === 0) state = strike()
  }
  expect(impacts.length, trial.move.id).toBe(2)
  return impacts[1]
}

describe('static frame advantage of ground normals', () => {
  it.each(FIGHTING_ROSTER.map(({ id }) => id))('matches the lab measurement for %s', (fighter) => {
    const cases = trials(fighter)
    expect(cases.length).toBeGreaterThan(0)
    for (const trial of cases) {
      const expected = moveFrameAdvantage(trial.move)!
      const { sample, knockedDown } = measure(trial)
      const label = `${trial.move.id} ${trial.blocked ? 'block' : 'hit'}`
      expect(sample.blocked, label).toBe(trial.blocked)
      if (trial.blocked) expect(sample.advantage, label).toBe(expected.onBlock)
      else if (expected.onHit === 'knockdown') expect(knockedDown, label).toBe(true)
      else {
        expect(knockedDown, label).toBe(false)
        expect(sample.advantage, label).toBe(expected.onHit)
      }
    }
  })

  it('reports positive recovery links while capping every light self-link', () => {
    const boundary = lightAtWindow(0)
    const frames = moveFrameAdvantage(boundary.move)!
    expect(linkWindow(frames, { startup: frames.startup - 1 })).toBe(1)
    for (const { id } of FIGHTING_ROSTER)
      for (const [slot] of LIGHTS) {
        const move = moveForSlot(id, slot)
        if (!move) continue
        const own = moveFrameAdvantage(move)
        if (own) expect(linkWindow(own, own), move.id).toBeLessThanOrEqual(0)
      }
    expect(selfLinkCombo(boundary)).toBe(1)
  })

  it('formats advantages with a typographic minus', () => {
    expect(formatFrameAdvantage(6, 'fr')).toBe('+6')
    expect(formatFrameAdvantage(-2, 'fr')).toBe('−2')
    expect(formatFrameAdvantage(0, 'en')).toBe('0')
    expect(formatFrameAdvantage('knockdown', 'en')).toBe('KD')
  })
})
