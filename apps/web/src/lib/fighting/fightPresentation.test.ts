import { describe, expect, it } from 'vitest'
import { attackMotionAccent } from './fightAttackMotion'
import { bodyPlan } from './fightBodyMotion'
import { attackData } from './frameData'
import { impactPresentation } from './fightImpactPresentation'
import { createFightState } from './fightState'
import { fighterMotionProfile } from './fighterMotionProfile'
import { fighterMovementBible } from './fighterMovementBible'
import { LANDING_FRAMES, motionOf, PREJUMP_FRAMES } from './fighterMovement'
import { FIGHTING_ROSTER } from './roster'
import type { ArcadeFighter, FighterDash } from './types'

function striking(kind: 'light' | 'heavy' | 'special', frame: number): ArcadeFighter {
  const fighter = createFightState('benjamin', 'hisoka').player
  return withStrike(fighter, kind, frame)
}

function withStrike(
  fighter: ArcadeFighter,
  kind: 'light' | 'heavy' | 'special',
  frame: number,
): ArcadeFighter {
  return {
    ...fighter,
    pose: kind,
    attack: {
      kind,
      variant: 'standing',
      frame,
      impacted: false,
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
      projectileSpawned: false,
      reversal: false,
    },
  }
}

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
    expect(forward.pose.root?.[2]).toBeGreaterThan(backward.pose.root?.[2] ?? 0)
    expect(forward.pose.body?.[0]).toBeGreaterThan(backward.pose.body?.[0] ?? 0)
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

  it('loads the legs before driving the whole body into contact', () => {
    const base = striking('heavy', 0)
    const frames = attackData('heavy', base)
    const loaded = { ...base, attack: { ...base.attack!, frame: frames.startup - 1 } }
    const contact = { ...base, attack: { ...base.attack!, frame: frames.startup } }
    const windup = attackMotionAccent({ fighter: loaded, frames, authored: false })
    const drive = attackMotionAccent({ fighter: contact, frames, authored: false })
    expect(windup.rearKnee?.[0]).toBeGreaterThan(drive.rearKnee?.[0] ?? 0)
    expect(drive.body?.[0]).toBeGreaterThan(windup.body?.[0] ?? 0)
    expect(drive.root?.[2]).toBeGreaterThan(windup.root?.[2] ?? 0)
  })

  it('settles kinetic overshoot through recovery', () => {
    const base = striking('special', 0)
    const frames = attackData('special', base)
    const recoveryStart = frames.startup + frames.active
    const early = { ...base, attack: { ...base.attack!, frame: recoveryStart } }
    const late = {
      ...base,
      attack: { ...base.attack!, frame: recoveryStart + frames.recovery - 1 },
    }
    const overshoot = attackMotionAccent({ fighter: early, frames, authored: false })
    const settled = attackMotionAccent({ fighter: late, frames, authored: false })
    expect(Math.abs(overshoot.body?.[0] ?? 0)).toBeGreaterThan(Math.abs(settled.body?.[0] ?? 0))
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

  it('presents Kurapika standing heavy as a compact horizontal body blow', () => {
    const generic = impactPresentation({
      kind: 'heavy',
      blocked: false,
      critical: false,
      knockdown: false,
      wallSplat: false,
    })
    const golden = impactPresentation(
      {
        kind: 'heavy',
        blocked: false,
        critical: false,
        knockdown: false,
        wallSplat: false,
      },
      'kurapika',
      'kurapika:standingHeavy',
    )
    expect(golden.shakeX).toBeGreaterThan(generic.shakeX)
    expect(golden.shakeY).toBeLessThan(generic.shakeY)
    expect(golden.sparks).toBeLessThan(generic.sparks)
  })

  it('gives every playable fighter a complete individual motion profile', () => {
    const signatures = FIGHTING_ROSTER.map(({ id }) => {
      const profile = fighterMotionProfile(id)
      const bible = fighterMovementBible(id)
      const normalized = [
        profile.walk / bible.locomotion,
        profile.dash / bible.burst,
        profile.jump / bible.air,
        profile.landing / bible.weight,
        profile.attack / bible.commitment,
        profile.impact / (bible.weight * bible.exaggeration),
      ]
      for (const value of normalized) {
        expect(Number.isFinite(value), id).toBe(true)
        expect(value, id).toBeGreaterThanOrEqual(0.78)
        expect(value, id).toBeLessThanOrEqual(1.17)
      }
      return Object.values(profile)
        .map((value) => value.toFixed(3))
        .join(':')
    })
    expect(new Set(signatures).size).toBeGreaterThan(FIGHTING_ROSTER.length * 0.75)
  })

  it('routes every playable fighter through all four presentation passes', () => {
    for (const definition of FIGHTING_ROSTER) {
      const base = createFightState(definition.id, 'hisoka').player
      const motion = motionOf(base)
      const context = { seconds: 1, progress: 0 }
      const walk = bodyPlan(
        { ...base, pose: 'walk', motion: { ...motion, heldDirection: base.facing } },
        context,
      )
      const dash = bodyPlan(
        {
          ...base,
          pose: 'walk',
          motion: {
            ...motion,
            heldDirection: base.facing,
            dash: { direction: base.facing, frame: 8, frames: 18, peak: 96 },
          },
        },
        context,
      )
      const prejump = bodyPlan(
        { ...base, motion: { ...motion, prejumpFrames: PREJUMP_FRAMES - 1 } },
        context,
      )
      const landing = bodyPlan(
        { ...base, motion: { ...motion, landingFrames: LANDING_FRAMES } },
        context,
      )
      expect([walk?.key, dash?.key, prejump?.key, landing?.key]).toEqual([
        definition.id === 'bonolenov' ? 'bonolenov:step:true' : 'walk:forward',
        definition.id === 'bonolenov' ? 'bonolenov:pivot:true' : 'dash:true',
        'prejump',
        'landing',
      ])
      const started = withStrike(base, 'heavy', 0)
      const contact = withStrike(base, 'heavy', attackData('heavy', started).startup)
      expect(bodyPlan(contact, context)?.key).toBe('attack:heavy')
      const impact = impactPresentation(
        {
          kind: 'heavy',
          blocked: false,
          critical: false,
          knockdown: false,
          wallSplat: false,
        },
        definition.id,
      )
      expect(impact.shakeX).toBeGreaterThan(0)
    }
  })
})
