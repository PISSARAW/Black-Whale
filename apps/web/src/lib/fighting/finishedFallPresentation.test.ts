import { describe, expect, it } from 'vitest'
import { createFinishedFallPresentation } from './finishedFallPresentation'
import { createFightState, nextFightRound } from './fightState'
import { performMove, tickFight } from './engine'
import { advanceAirborne } from './fighterMovement'
import { fightReplayHash } from './fightReplayHash'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function airborneKnockout(side: FightSide, velocityY = 35): FightState {
  const base = createFightState('kurapika', 'hisoka', { mode: 'versus-local' })
  const attacker = side === 'player' ? 'opponent' : 'player'
  let state: FightState = {
    ...base,
    phase: 'fighting',
    [attacker]: { ...base[attacker], x: side === 'player' ? 50 : 44 },
    [side]: {
      ...base[side],
      x: side === 'player' ? 44 : 50,
      y: velocityY < 0 ? 8 : 2,
      velocityY,
      health: 1,
    },
  }
  state = performMove({ state, side: attacker, action: velocityY < 0 ? 'light' : 'heavy' })
  for (let frame = 0; frame < 60 && state.phase === 'fighting'; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  expect(state.phase).toBe('finished')
  expect(state[side].pose).toBe('ko')
  expect(state[side].y).toBeGreaterThan(0)
  return state
}

describe.each(['player', 'opponent'] as const)('%s aerial KO presentation', (side) => {
  it('also lands a real KO received while descending, without an anti-air relaunch', () => {
    const state = airborneKnockout(side, -20)
    expect(state[side].velocityY).toBeLessThan(0)
    const present = createFinishedFallPresentation()
    const input = { fighter: state[side], position: state[side], seconds: 0 }
    present(state, side, input)
    expect(present(state, side, { ...input, seconds: 2 }).position.y).toBe(0)
  })
  it.each([120, 60, 30, 20])(
    'finishes a real aerial knockout at %i Hz with an immutable verdict',
    (hz) => {
      const state = airborneKnockout(side)
      const original = JSON.stringify(state)
      const hash = fightReplayHash(state)
      const present = createFinishedFallPresentation()
      let y = state[side].y
      let progress = 0
      for (let frame = 0; frame <= hz * 2; frame++) {
        const result = present(state, side, {
          fighter: state[side],
          position: state[side],
          seconds: frame / hz,
        })
        y = result.position.y
        progress = result.progress ?? 0
        expect(y).toBeGreaterThanOrEqual(0)
      }
      expect(y).toBe(0)
      expect(progress).toBe(1)
      expect(JSON.stringify(state)).toBe(original)
      expect(fightReplayHash(state)).toBe(hash)
      expect(tickFight(state, EMPTY_INPUT, 1 / 60)).toBe(state)
    },
  )

  it('uses the ordinary gravity for both rising and falling bodies, independently of render cadence', () => {
    const state = airborneKnockout(side)
    for (const velocityY of [35, -35]) {
      const source = { ...state, [side]: { ...state[side], y: 8, velocityY } }
      const present = createFinishedFallPresentation()
      const input = { fighter: source[side], position: source[side], seconds: 0 }
      present(source, side, input)
      let expected = source[side]
      for (let frame = 1; frame <= 90; frame++) {
        expected = { ...expected, ...advanceAirborne(expected) }
        const actual = present(source, side, { ...input, seconds: frame / 60 })
        expect(actual.position.y).toBeCloseTo(expected.y, 8)
      }
    }
  })

  it('holds when the presentation clock is paused and clears on a new round or recording', () => {
    const state = airborneKnockout(side)
    const present = createFinishedFallPresentation()
    const input = { fighter: state[side], position: state[side], seconds: 0 }
    present(state, side, input)
    const paused = present(state, side, { ...input, seconds: 0.1 })
    expect(present(state, side, { ...input, seconds: 0.1 })).toEqual(paused)
    expect(present({ ...state }, side, { ...input, seconds: 10 }).position.y).toBe(0)
    expect(
      present({ ...state, frame: state.frame + 1 }, side, { ...input, seconds: 10 }).position.y,
    ).toBe(state[side].y)
    const next = nextFightRound(state)
    expect(
      present(next, side, { fighter: next[side], position: next[side], seconds: 11 }).position.y,
    ).toBe(0)
  })

  it('does not restart when identical final snapshots arrive over the network', () => {
    const state = airborneKnockout(side)
    const present = createFinishedFallPresentation()
    let y = state[side].y
    for (let frame = 0; frame <= 120; frame++) {
      const received = JSON.parse(JSON.stringify(state)) as FightState
      y = present(received, side, {
        fighter: received[side],
        position: received[side],
        seconds: frame / 60,
      }).position.y
    }
    expect(y).toBe(0)
  })

  it('puts a surviving airborne winner back in a grounded stance after landing', () => {
    const base = airborneKnockout(side)
    const state: FightState = {
      ...base,
      winner: side,
      [side]: { ...base[side], health: 100, y: 8, pose: 'jump', attack: null },
    }
    const present = createFinishedFallPresentation()
    const input = { fighter: state[side], position: state[side], seconds: 0 }
    present(state, side, input)
    const landed = present(state, side, { ...input, seconds: 2 })
    expect(landed.fighter).toMatchObject({ y: 0, velocityY: 0, pose: 'idle', attack: null })
    expect(state[side].pose).toBe('jump')
  })

  it('completes a surviving winner’s knockdown even when its stun counter freezes at the verdict', () => {
    const base = airborneKnockout(side)
    const state: FightState = {
      ...base,
      winner: side,
      [side]: { ...base[side], health: 100, y: 0, pose: 'down', knockdownFrames: 42 },
    }
    const present = createFinishedFallPresentation()
    const input = { fighter: state[side], position: state[side], seconds: 0 }
    expect(present(state, side, input).progress).toBe(0)
    expect(present(state, side, { ...input, seconds: 2 }).progress).toBe(1)
    expect(state[side].knockdownFrames).toBe(42)
  })
})
