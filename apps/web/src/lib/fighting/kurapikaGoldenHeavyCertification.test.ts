import { describe, expect, it } from 'vitest'
import { createFightState } from './fightState'
import { bodyPlan } from './fightBodyMotion'
import { addPoses, FIGHT_JOINTS } from './fightPose'
import { sampleTimeline } from './keyPoseTimeline'
import { KURAPIKA_GOLDEN_HEAVY_TIMELINE } from './keyPosesKurapikaGoldenHeavy'
import { KURAPIKA_GOLDEN_HEAVY } from './kurapikaGoldenHeavy'
import {
  goldenHeavyCertificationCases,
  goldenHeavyCertificationDrawCount,
  goldenHeavyReviewSeconds,
} from './kurapikaGoldenHeavyCertification'
import { kurapikaGoldenHeavyOutcomePose } from './kurapikaGoldenHeavyOutcome'
import { kurapikaGoldenHeavySupport } from './kurapikaGoldenHeavySupport'

const frames = KURAPIKA_GOLDEN_HEAVY.frames

function fighter(frame: number, outcome: 'hit' | 'block' | 'whiff', facing: 1 | -1) {
  const made = createFightState('kurapika', 'hisoka').player
  made.facing = facing
  made.pose = 'heavy'
  made.attack = {
    moveId: 'kurapika:standingHeavy',
    variant: 'standing',
    kind: 'heavy',
    frame,
    impacted: outcome !== 'whiff',
    confirmedHit: outcome === 'hit',
    confirmedBlock: outcome === 'block',
    auraCharged: false,
    concealed: false,
    hatsuSource: null,
    projectileSpawned: false,
    reversal: false,
  }
  return made
}

function certifiedPose(frame: number, outcome: 'hit' | 'block' | 'whiff', facing: 1 | -1) {
  const actor = fighter(frame, outcome, facing)
  return addPoses(
    sampleTimeline(KURAPIKA_GOLDEN_HEAVY_TIMELINE, { frame, frames, continuous: true }),
    kurapikaGoldenHeavyOutcomePose(actor, { frame, frames }),
  )
}

describe('Kurapika golden heavy certification', () => {
  it('covers 288 scenarios and 2,880 review draws without duplicate cases', () => {
    const cases = goldenHeavyCertificationCases()
    expect(cases).toHaveLength(2 * 3 * 3 * 4 * 4)
    expect(new Set(cases.map((entry) => JSON.stringify(entry))).size).toBe(cases.length)
    expect(goldenHeavyCertificationDrawCount()).toBe(2880)
  })

  it('keeps authored gameplay frames invariant at every playback speed', () => {
    for (const frame of KURAPIKA_GOLDEN_HEAVY.reviewFrames) {
      const times = [0.25, 0.5, 1, 2].map((rate) => goldenHeavyReviewSeconds(frame, rate))
      expect(times.map((time, index) => time * [0.25, 0.5, 1, 2][index])).toEqual(
        times.map(() => frame / 60),
      )
    }
  })

  it('returns finite, deterministic poses across every facing and outcome', () => {
    for (const facing of [1, -1] as const) {
      for (const outcome of ['hit', 'block', 'whiff'] as const) {
        for (const frame of KURAPIKA_GOLDEN_HEAVY.reviewFrames) {
          const pose = certifiedPose(frame, outcome, facing)
          expect(certifiedPose(frame, outcome, facing)).toEqual(pose)
          for (const joint of FIGHT_JOINTS)
            expect(
              (pose[joint] ?? []).every(Number.isFinite),
              `${facing}:${outcome}:${frame}:${joint}`,
            ).toBe(true)
          const support = kurapikaGoldenHeavySupport(fighter(frame, outcome, facing), frames)!
          expect(support).toMatchObject({ supportFoot: 'lead', pivotFoot: 'rear' })
          expect(support.pivotAngle).toBeGreaterThanOrEqual(0)
          expect(support.pivotAngle).toBeLessThanOrEqual(0.24)
        }
      }
    }
  })

  it('shares contact in both facings, then branches into three readable recoveries', () => {
    const contact = frames.startup
    for (const facing of [1, -1] as const) {
      const active = (['hit', 'block', 'whiff'] as const).map((outcome) =>
        certifiedPose(contact, outcome, facing),
      )
      expect(active[1]).toEqual(active[0])
      expect(active[2]).toEqual(active[0])
      const recovery = (['hit', 'block', 'whiff'] as const).map((outcome) =>
        certifiedPose(frames.startup + frames.active + 2, outcome, facing),
      )
      expect(new Set(recovery.map((pose) => JSON.stringify(pose))).size).toBe(3)
    }
  })

  it('keeps the semantic support lock in the production body plan', () => {
    for (const facing of [1, -1] as const) {
      const actor = fighter(frames.startup, 'hit', facing)
      expect(bodyPlan(actor, { seconds: 1, progress: 0 })).toMatchObject({
        key: 'attack:kurapika:standingHeavy',
        supportFoot: 'lead',
        pivotFoot: 'rear',
      })
    }
  })
})
