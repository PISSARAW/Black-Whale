import { describe, expect, it } from 'vitest'
import { bodyPlan } from './fightBodyMotion'
import { impactPresentation } from './fightImpactPresentation'
import { createFightState } from './fightState'
import { LANDING_FRAMES, motionOf, PREJUMP_FRAMES } from './fighterMovement'
import type { ArcadeFighter, FighterDash } from './types'

function dashing(direction: -1 | 1, frame = 5): ArcadeFighter {
  const fighter = createFightState('kurapika', 'hisoka').player
  const dash: FighterDash = { direction, frame, frames: 18, peak: 96 }
  return { ...fighter, pose: 'walk', motion: { ...motionOf(fighter), dash } }
}

describe('fight presentation', () => {
  it('draws forward and backward dashes as distinct authored actions', () => {
    const forward = bodyPlan(dashing(1), { seconds: 1, progress: 0 })!
    const backward = bodyPlan(dashing(-1), { seconds: 1, progress: 0 })!
    expect(forward.key).toBe('dash:true')
    expect(backward.key).toBe('dash:false')
    expect(forward.pose.body?.[0]).toBeGreaterThan(0)
    expect(backward.pose.body?.[0]).toBeLessThan(0)
  })

  it('carries family-specific momentum over each fighter stance', () => {
    const striker = bodyPlan(dashing(1, 9), { seconds: 1, progress: 0 })!
    const bruteBase = createFightState('benjamin', 'hisoka').player
    const bruteDash: FighterDash = { direction: 1, frame: 9, frames: 18, peak: 96 }
    const brute = bodyPlan(
      { ...bruteBase, pose: 'walk', motion: { ...motionOf(bruteBase), dash: bruteDash } },
      { seconds: 1, progress: 0 },
    )!
    expect(brute.pose.rearKnee?.[0]).toBeGreaterThan(striker.pose.rearKnee?.[0] ?? 0)
    expect(brute.pose.leadShoulder?.[2]).not.toBe(striker.pose.leadShoulder?.[2])
  })

  it('shows anticipation before take-off and compression on landing', () => {
    const base = createFightState('kurapika', 'hisoka').player
    const prejump = bodyPlan(
      {
        ...base,
        motion: { ...motionOf(base), prejumpFrames: PREJUMP_FRAMES - 1 },
      },
      { seconds: 1, progress: 0 },
    )!
    const landing = bodyPlan(
      {
        ...base,
        motion: { ...motionOf(base), landingFrames: LANDING_FRAMES },
      },
      { seconds: 1, progress: 0 },
    )!
    expect(prejump.key).toBe('prejump')
    expect(landing.key).toBe('landing')
    expect(landing.pose.leadKnee?.[0]).toBeGreaterThan(prejump.pose.leadKnee?.[0] ?? 0)
  })

  it('keeps a tighter retreat than advance while preserving family posture', () => {
    const base = createFightState('feitan', 'hisoka').player
    const walking = (direction: -1 | 1) =>
      bodyPlan(
        {
          ...base,
          pose: 'walk',
          motion: { ...motionOf(base), heldDirection: direction },
        },
        { seconds: 1, progress: 0 },
      )!
    const advance = walking(1)
    const retreat = walking(-1)
    expect(advance.key).toBe('walk:forward')
    expect(retreat.key).toBe('walk:backward')
    expect(advance.pose.body?.[0]).toBeGreaterThan(retreat.pose.body?.[0] ?? 0)
  })

  it('gives heavier and decisive impacts more visual weight', () => {
    const light = impactPresentation({
      kind: 'light',
      blocked: false,
      critical: false,
      knockdown: false,
      wallSplat: false,
    })
    const heavy = impactPresentation({
      kind: 'heavy',
      blocked: false,
      critical: true,
      knockdown: true,
      wallSplat: false,
    })
    expect(heavy.sparks).toBeGreaterThan(light.sparks)
    expect(heavy.shakeMs).toBeGreaterThan(light.shakeMs)
    expect(heavy.shakeX).toBeGreaterThan(light.shakeX)
  })
})
