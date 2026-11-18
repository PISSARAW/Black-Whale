import { fightBodyMotion, bodyPlan, type BodyMotionOptions } from '../fightBodyMotion'
import type { BodyPlan } from '../fightPose'
import { usesRightHandPose } from '../fightHandConvention'
import { introShot, type IntroFrame } from './introPlayback'
import type { FightSide } from '../types'
import { introPerformance } from './introPerformances'
import { sampleIntroPose } from './introPerformanceSample'

interface IntroMotionOptions extends BodyMotionOptions {
  introFrame: IntroFrame | null
  side: FightSide
}

/** Dedicated entrance choreography; no action or simulation state is manufactured. */
export function introBodyPlan(options: IntroMotionOptions): BodyPlan | undefined {
  const frame = options.introFrame
  if (!frame || frame.waiting || frame.mode !== 'full') return undefined
  const shot = introShot(frame)
  if (shot.side !== options.side) return undefined
  const fighter = options.fighter
  const performance = introPerformance(fighter.id)
  const standing = bodyPlan(fighter, { ...options, seconds: frame.elapsed })
  if (!performance || !standing) return undefined
  return {
    plant: true,
    blend: 0,
    key: `intro:${fighter.id}`,
    pose: sampleIntroPose(
      performance,
      {
        standing: standing.pose,
        mirrorHands: fighter.facing === -1 && usesRightHandPose(fighter, 'intro'),
      },
      shot.progress,
    ),
  }
}

export function introBodyMotion(options: IntroMotionOptions) {
  return fightBodyMotion({ ...options, plan: introBodyPlan(options) })
}
