import { describe, expect, it } from 'vitest'
import { createFightState } from './fightState'
import { FIXED_STEP } from './fightClock'
import { createSecondaryMotion, withSecondaryMotion } from './fightSecondaryMotion'
import { NEUTRAL_POSE, type BodyPlan } from './fightPose'
import type { ArcadeFighter, FighterId } from './types'

function fighter(id: FighterId, patch: Partial<ArcadeFighter> = {}): ArcadeFighter {
  return { ...createFightState(id, 'hisoka').player, ...patch }
}

describe('fightSecondaryMotion', () => {
  it('absorbs landing impact on head, wrists and shoulders, then settles to neutral', () => {
    const secondary = createSecondaryMotion()
    const base = fighter('kurapika', { x: 40, y: 4, facing: 1, pose: 'jump' })
    expect(secondary(base, { frame: 0, seconds: 0, frozen: false })).toEqual(NEUTRAL_POSE)

    // Falling down toward ground.
    secondary({ ...base, y: 2.5 }, { frame: 1, seconds: FIXED_STEP, frozen: false })
    secondary({ ...base, y: 1.0 }, { frame: 2, seconds: 2 * FIXED_STEP, frozen: false })

    // Landing on ground: vertical velocity suddenly stops (ay > 0).
    let headPeak = 0
    let wristPeak = 0
    let shoulderPeak = 0
    for (let frame = 3; frame <= 10; frame++) {
      const pose = secondary(
        { ...base, y: 0, pose: 'idle' },
        { frame, seconds: frame * FIXED_STEP, frozen: false },
      )
      headPeak = Math.max(headPeak, Math.abs(pose.head?.[0] ?? 0))
      wristPeak = Math.max(wristPeak, Math.abs(pose.leadWrist?.[0] ?? 0))
      shoulderPeak = Math.max(shoulderPeak, Math.abs(pose.leadShoulder?.[0] ?? 0))
    }
    expect(headPeak).toBeGreaterThan(0.01)
    expect(wristPeak).toBeGreaterThan(0.01)
    expect(shoulderPeak).toBeGreaterThan(0.005)

    // Settles cleanly back to neutral.
    let settled = NEUTRAL_POSE
    for (let frame = 11; frame <= 90; frame++) {
      settled = secondary(
        { ...base, y: 0, pose: 'idle' },
        { frame, seconds: frame * FIXED_STEP, frozen: false },
      )
    }
    expect(settled).toEqual(NEUTRAL_POSE)
  })

  it('freezes during hitstop and resets on teleports or KO', () => {
    const secondary = createSecondaryMotion()
    const base = fighter('hisoka', { x: 40, y: 0, facing: 1, pose: 'walk' })
    secondary(base, { frame: 0, seconds: 0, frozen: false })
    const moving = secondary({ ...base, x: 41.2 }, { frame: 1, seconds: FIXED_STEP, frozen: false })
    const frozen = secondary(
      { ...base, x: 41.2 },
      { frame: 2, seconds: 2 * FIXED_STEP, frozen: true },
    )
    expect(frozen).toEqual(moving)

    const teleported = secondary(
      { ...base, x: 60 },
      { frame: 3, seconds: 3 * FIXED_STEP, frozen: false },
    )
    expect(teleported).toEqual(NEUTRAL_POSE)

    const knockedOut = secondary(
      { ...base, x: 60, pose: 'ko', health: 0 },
      { frame: 4, seconds: 4 * FIXED_STEP, frozen: false },
    )
    expect(knockedOut).toEqual(NEUTRAL_POSE)
  })

  it('preserves attack startup and active contacts while allowing recovery follow-through', () => {
    const impulse = { head: [0.04, 0, 0] as const, leadWrist: [0.06, 0, 0] as const }
    const activePlan: BodyPlan = {
      pose: { head: [0.02, 0, 0] },
      plant: true,
      key: 'attack:kurapika:standingLight',
      blend: 0,
      attackFlow: { frame: 6, startup: 6, active: 3, recovery: 8, facing: 1 },
    }
    expect(withSecondaryMotion(activePlan, impulse)).toBe(activePlan)

    const recoveryPlan: BodyPlan = {
      ...activePlan,
      attackFlow: { frame: 10, startup: 6, active: 3, recovery: 8, facing: 1 },
    }
    const layered = withSecondaryMotion(recoveryPlan, impulse)!
    expect(layered.pose.head?.[0]).toBeCloseTo(0.06, 5)
    expect(layered.pose.leadWrist?.[0]).toBeCloseTo(0.06, 5)

    const flutePlan: BodyPlan = {
      pose: { head: [0, 0, 0] },
      plant: true,
      key: 'flute-performance',
      blend: 0.1,
    }
    expect(withSecondaryMotion(flutePlan, impulse)).toBe(flutePlan)
  })
})
