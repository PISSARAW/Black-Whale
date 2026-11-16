import { describe, expect, it } from 'vitest'
import { advanceAiCadence } from './aiCadence'
import { beginFight, createFight, tickFight } from './engine'
import { FIXED_STEP } from './frameData'
import { interpolatedPosition } from './fightInterpolation'
import { jumpProgress, LANDING_FRAMES, motionOf, PREJUMP_FRAMES } from './fighterMovement'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'

const frame = (state: FightState, input: Partial<FightInput> = {}) =>
  tickFight(state, { ...EMPTY_INPUT, ...input }, FIXED_STEP + 1e-9)

function frames(state: FightState, count: number, input: Partial<FightInput> = {}) {
  let next = state
  for (let index = 0; index < count; index += 1) next = frame(next, input)
  return next
}

const fight = () => beginFight(createFight('kurapika', 'hisoka', { mode: 'versus-local' }))

describe('fighter movement', () => {
  it('walks backward slower than forward', () => {
    const start = fight()
    const forward = frames(start, 30, { right: true }).player.x - start.player.x
    const backward = start.player.x - frames(start, 30, { left: true }).player.x
    expect(backward).toBeGreaterThan(0)
    expect(backward).toBeLessThan(forward)
  })

  it('dashes on a double tap and covers more ground than a walk', () => {
    const start = fight()
    let state = frames(start, 2, { right: true })
    state = frames(state, 2)
    state = frame(state, { right: true })
    expect(motionOf(state.player).dash).not.toBeNull()
    const dashed = frames(state, 17).player.x - start.player.x
    const walked = frames(start, 22, { right: true }).player.x - start.player.x
    expect(dashed).toBeGreaterThan(walked * 1.5)
  })

  it('backdashes away from the opponent', () => {
    const start = fight()
    let state = frames(start, 2, { left: true })
    state = frames(state, 2)
    state = frames(state, 16, { left: true })
    expect(state.player.x).toBeLessThan(start.player.x - 8)
  })

  it('does not dash on two taps too far apart', () => {
    let state = frames(fight(), 2, { right: true })
    state = frames(state, 20)
    state = frame(state, { right: true })
    expect(motionOf(state.player).dash).toBeNull()
  })

  it('leaves the ground after a short prejump and drifts with its take-off direction', () => {
    const start = fight()
    const crouched = frames(start, PREJUMP_FRAMES - 1, { jump: true, right: true })
    expect(crouched.player.y).toBe(0)
    let state = frames(crouched, 2, { jump: true, right: true })
    expect(state.player.y).toBeGreaterThan(0)
    const takeOffX = state.player.x
    state = frames(state, 10, { left: true })
    expect(state.player.x).toBeGreaterThan(takeOffX)
  })

  it('lands in under forty frames and stays put for the landing', () => {
    let state = frames(fight(), PREJUMP_FRAMES + 1, { jump: true })
    let airborne = 0
    while (state.player.y > 0 && airborne < 80) {
      state = frame(state)
      airborne += 1
    }
    expect(airborne).toBeLessThan(40)
    expect(motionOf(state.player).landingFrames).toBe(LANDING_FRAMES)
    const x = state.player.x
    state = frame(state, { right: true })
    expect(state.player.x).toBe(x)
  })

  it('reports jump progress from take-off to landing', () => {
    const fighter = fight().player
    expect(jumpProgress({ ...fighter, velocityY: 54 })).toBeCloseTo(0)
    expect(jumpProgress({ ...fighter, velocityY: 0 })).toBeCloseTo(0.5)
    expect(jumpProgress({ ...fighter, velocityY: -200 })).toBe(1)
  })
})

describe('render interpolation', () => {
  it('draws a fighter between its last two simulated positions', () => {
    const state = frames(fight(), 10, { right: true })
    const previous = state.previousPositions!.player.x
    const halfway = { ...state, frameAccumulator: FIXED_STEP / 2 }
    expect(interpolatedPosition(halfway, 'player').x).toBeCloseTo(
      (previous + state.player.x) / 2,
      5,
    )
  })

  it('snaps instead of sweeping across a reset', () => {
    const state = frames(fight(), 2)
    const reset = { ...state, player: { ...state.player, x: 80 }, frameAccumulator: 0 }
    expect(interpolatedPosition(reset, 'player').x).toBe(80)
  })
})

describe('AI cadence', () => {
  it('decides every 16 to 24 simulated frames', () => {
    let state: FightState = { ...fight(), aiCooldown: 1 }
    const decisions: number[] = []
    for (let index = 0; index < 200; index += 1) {
      state = advanceAiCadence({ ...state, frame: index }, (current) => {
        decisions.push(current.frame)
        return { ...current, rng: (current.rng * 1103515245 + 12345) >>> 0 }
      })
    }
    const gaps = decisions.slice(1).map((at, index) => at - decisions[index])
    expect(gaps.length).toBeGreaterThan(5)
    gaps.forEach((gap) => {
      expect(gap).toBeGreaterThanOrEqual(16)
      expect(gap).toBeLessThanOrEqual(24)
    })
  })
})
