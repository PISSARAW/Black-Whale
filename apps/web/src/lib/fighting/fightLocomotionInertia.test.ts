import { describe, expect, it } from 'vitest'
import { createFightState } from './fightState'
import { FIXED_STEP } from './fightClock'
import {
  createLocomotionInertia,
  physicalWalkAccent,
  withLocomotionInertia,
} from './fightLocomotionInertia'
import { fightStance, stanceAt } from './fightStance'
import { shufflePose } from './fightShuffleStep'
import { walkPose } from './fightLocomotion'
import { NEUTRAL_POSE, type BodyPlan } from './fightPose'
import { FIGHTING_ROSTER } from './roster'
import type { ArcadeFighter, FighterId } from './types'

function fighter(id: FighterId, patch: Partial<ArcadeFighter> = {}): ArcadeFighter {
  return { ...createFightState(id, 'hisoka').player, ...patch }
}

describe('fightLocomotionInertia', () => {
  it('lags on walk start, brakes forward on stop, and settles back to neutral', () => {
    const inertia = createLocomotionInertia()
    const base = fighter('kurapika', { x: 40, facing: 1, pose: 'idle' })
    expect(inertia(base, { frame: 0, seconds: 0, frozen: false })).toEqual(NEUTRAL_POSE)

    // Sudden walk start forward: upper body trails slightly backward.
    let x = 40
    let startPitch = 0
    for (let frame = 1; frame <= 4; frame++) {
      x += 0.45
      const pose = inertia(
        { ...base, x, pose: 'walk' },
        { frame, seconds: frame * FIXED_STEP, frozen: false },
      )
      startPitch = Math.min(startPitch, pose.body?.[0] ?? 0)
    }
    expect(startPitch).toBeLessThan(-0.005)

    // Cruise forward so filteredSpeed catches up.
    for (let frame = 5; frame <= 24; frame++) {
      x += 0.45
      inertia({ ...base, x, pose: 'walk' }, { frame, seconds: frame * FIXED_STEP, frozen: false })
    }

    // Sudden stop into idle: braking lean pitches forward with balanced knee flex.
    let brakePeak = 0
    for (let frame = 25; frame <= 32; frame++) {
      const pose = inertia(
        { ...base, x, pose: 'idle' },
        { frame, seconds: frame * FIXED_STEP, frozen: false },
      )
      if ((pose.body?.[0] ?? 0) > brakePeak) {
        brakePeak = pose.body?.[0] ?? 0
        expect((pose.leadHip?.[0] ?? 0) + (pose.leadKnee?.[0] ?? 0)).toBeCloseTo(0, 6)
      }
    }
    expect(brakePeak).toBeGreaterThan(0.01)

    // Settles cleanly back to neutral after enough idle frames.
    let settled = NEUTRAL_POSE
    for (let frame = 33; frame <= 90; frame++) {
      settled = inertia(
        { ...base, x, pose: 'idle' },
        { frame, seconds: frame * FIXED_STEP, frozen: false },
      )
    }
    expect(settled).toEqual(NEUTRAL_POSE)
  })

  it('freezes during hitstop and resets cleanly on teleports or rewinds', () => {
    const inertia = createLocomotionInertia()
    const base = fighter('kurapika', { x: 40, facing: 1, pose: 'walk' })
    inertia(base, { frame: 0, seconds: 0, frozen: false })
    const moving = inertia({ ...base, x: 40.5 }, { frame: 1, seconds: FIXED_STEP, frozen: false })
    const frozen = inertia(
      { ...base, x: 41.0 },
      { frame: 2, seconds: 2 * FIXED_STEP, frozen: true },
    )
    expect(frozen).toEqual(moving)

    // Teleport (> 4 units in one step) resets instead of spiking.
    const teleported = inertia(
      { ...base, x: 60 },
      { frame: 3, seconds: 3 * FIXED_STEP, frozen: false },
    )
    expect(teleported).toEqual(NEUTRAL_POSE)
  })

  it('never alters attack plans or airborne fighters', () => {
    const inertia = createLocomotionInertia()
    const attackPlan: BodyPlan = {
      pose: { body: [0.1, 0, 0] },
      plant: true,
      key: 'attack:kurapika:standingLight',
      blend: 0,
      attackFlow: { frame: 1, startup: 6, active: 3, recovery: 8, facing: 1 },
    }
    expect(withLocomotionInertia(attackPlan, { body: [0.05, 0, 0] })).toBe(attackPlan)

    const airborne = fighter('kurapika', { x: 40, y: 2, pose: 'jump' })
    expect(inertia(airborne, { frame: 0, seconds: 0, frozen: false })).toEqual(NEUTRAL_POSE)
    expect(
      inertia({ ...airborne, x: 41 }, { frame: 1, seconds: FIXED_STEP, frozen: false }),
    ).toEqual(NEUTRAL_POSE)
  })

  it('differentiates walk posture and braking weight by physical profile', () => {
    const franklin = fighter('franklin', { x: 40, facing: 1, pose: 'walk' })
    const machi = fighter('machi', { x: 40, facing: 1, pose: 'walk' })
    const franklinAccent = physicalWalkAccent(franklin, true)
    const machiAccent = physicalWalkAccent(machi, true)
    expect(franklinAccent.body![0]).toBeGreaterThan(machiAccent.body![0])

    const stride = shufflePose({ ...franklin, x: 41.3 })
    expect(Math.abs(stride.root?.[0] ?? 0)).toBeGreaterThan(0)
    expect(Math.abs(stride.body?.[2] ?? 0)).toBeGreaterThan(0)
    expect(Math.abs(stride.chest?.[1] ?? 0)).toBeGreaterThan(0)
  })

  it('keeps stance breathing organic and walk poses finite across all forty fighters', () => {
    for (const def of FIGHTING_ROSTER) {
      const stance = fightStance(def.id)
      if (!stance) continue
      const t0 = stanceAt(stance, 0)
      const t1 = stanceAt(stance, 0.7)
      expect(t0.chest?.[0]).not.toBeCloseTo(t1.chest?.[0] ?? 0, 4)

      const walking = fighter(def.id, {
        x: 42.5,
        facing: 1,
        pose: 'walk',
        motion: {
          velocityX: 0,
          prejumpFrames: 0,
          jumpDirection: 0,
          landingFrames: 0,
          dash: null,
          heldDirection: 1,
          tapDirection: 0,
          tapWindow: 0,
        },
      })
      const walked = walkPose(walking, t0)
      for (const turn of Object.values(walked.pose)) {
        if (!turn) continue
        for (const angle of turn) expect(Number.isFinite(angle)).toBe(true)
      }
    }
  })
})
