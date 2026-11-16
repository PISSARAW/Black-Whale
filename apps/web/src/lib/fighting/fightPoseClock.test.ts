import { describe, expect, it } from 'vitest'
import { createFightPoseClock } from './fightPoseClock'
import { createStrideClocks } from './sceneMotion'
import { createFightState } from './fightState'
import { keyedMove } from './keyPoseMoves'
import { sampleTimeline } from './keyPoseTimeline'
import { moveForSlot } from './movesets'
import type { FighterId, MoveSlot } from './types'

const who = createFightState('kurapika', 'hisoka').player

describe('reaction clock', () => {
  it.each([8, 18, 38])(
    'starts a %i-frame hit at full recoil and recovers over its own duration',
    (duration) => {
      const clock = createFightPoseClock()
      expect(
        clock('player', { ...who, pose: 'hit', hitStun: duration }, { seconds: 0, impact: 1 }),
      ).toBe(0)
      expect(
        clock('player', { ...who, pose: 'hit', hitStun: duration / 2 }, { seconds: 1, impact: 1 }),
      ).toBeCloseTo(0.5)
    },
  )
  it('holds the reaction during hitstop regardless of render time', () => {
    const clock = createFightPoseClock()
    const fighter = { ...who, pose: 'hit' as const, hitStun: 12 }
    expect(clock('player', fighter, { seconds: 0, impact: 1 })).toBe(0)
    expect(clock('player', fighter, { seconds: 10, impact: 1 })).toBe(0)
    expect(clock('opponent', { ...fighter, hitStun: 30 }, { seconds: 10, impact: 2 })).toBe(0)
  })
  it('snaps back into recoil on another hit even when the stun is shorter', () => {
    const clock = createFightPoseClock()
    clock('player', { ...who, pose: 'hit', hitStun: 30 }, { seconds: 0, impact: 1 })
    expect(
      clock('player', { ...who, pose: 'hit', hitStun: 10 }, { seconds: 0.2, impact: 1 }),
    ).toBeGreaterThan(0.6)
    expect(clock('player', { ...who, pose: 'hit', hitStun: 8 }, { seconds: 0.3, impact: 2 })).toBe(
      0,
    )
  })
  it('does not restart a reaction when the previous impact is no longer displayed', () => {
    const clock = createFightPoseClock()
    clock('player', { ...who, pose: 'hit', hitStun: 20 }, { seconds: 0, impact: 1 })
    expect(clock('player', { ...who, pose: 'hit', hitStun: 10 }, { seconds: 1 })).toBe(0.5)
  })
  it('tracks actual knockdown and wakeup counters separately', () => {
    const clock = createFightPoseClock()
    clock('player', { ...who, pose: 'down', knockdownFrames: 70 }, { seconds: 0 })
    expect(clock('player', { ...who, pose: 'down', knockdownFrames: 35 }, { seconds: 1 })).toBe(0.5)
    expect(
      clock('player', { ...who, pose: 'wakeup', wakeupInvulnerableFrames: 12 }, { seconds: 2 }),
    ).toBe(0)
    expect(
      clock('player', { ...who, pose: 'wakeup', wakeupInvulnerableFrames: 6 }, { seconds: 3 }),
    ).toBe(0.5)
  })
})

const normals: MoveSlot[] = [
  'standingLight',
  'standingHeavy',
  'lowLight',
  'lowHeavy',
  'airLight',
  'airHeavy',
  'forwardLight',
  'forwardHeavy',
  'backHeavy',
]
const fighters: FighterId[] = ['kurapika', 'hisoka', 'chrollo', 'benjamin']
describe.each(fighters)('%s authored contact silhouettes', (id) => {
  it.each(normals)(
    'holds %s through its actual active frames and settles after recovery',
    (slot) => {
      const move = moveForSlot(id, slot)!
      const { timeline, authored } = keyedMove(id, slot)
      expect(authored).toBe(true)
      const frames = {
        startup: move.tuning.startup,
        active: move.tuning.active,
        recovery: move.tuning.recovery,
      }
      const contact = sampleTimeline(timeline, { frame: frames.startup, frames })
      for (let frame = frames.startup; frame < frames.startup + frames.active; frame++)
        expect(sampleTimeline(timeline, { frame, frames })).toEqual(contact)
      const end = sampleTimeline(timeline, {
        frame: frames.startup + frames.active + frames.recovery + 2,
        frames,
      })
      expect(
        Object.values(end)
          .flat()
          .every((value) => Math.abs(value) < 1e-6),
      ).toBe(true)
    },
  )
})

describe('distance-driven walk cadence', () => {
  it('keeps the same stride at 60 Hz and at 20 Hz instead of freezing the legs', () => {
    const smooth = createStrideClocks()
    const sparse = createStrideClocks()
    smooth('player', 20, 1)
    sparse('player', 20, 1)
    let first = 0
    let second = 0
    for (let i = 1; i <= 60; i++) first = smooth('player', 20 + i * 0.4, 1)
    for (let i = 1; i <= 20; i++) second = sparse('player', 20 + i * 1.2, 1)
    expect(second).toBeCloseTo(first)
    expect(second).toBeGreaterThan(0)
    expect(sparse('player', 90, 1)).toBe(second)
  })
  it('reverses a retreating stride while keeping the other fighter independent', () => {
    const clock = createStrideClocks()
    clock('player', 44, 1)
    clock('opponent', 50, -1)
    expect(clock('player', 42, 1)).toBeLessThan(0)
    expect(clock('opponent', 48, -1)).toBeGreaterThan(0)
  })
})
