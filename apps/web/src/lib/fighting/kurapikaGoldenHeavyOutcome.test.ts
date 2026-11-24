import { describe, expect, it } from 'vitest'
import { createFightState } from './fightState'
import { addPoses } from './fightPose'
import { sampleTimeline } from './keyPoseTimeline'
import { KURAPIKA_GOLDEN_HEAVY_TIMELINE } from './keyPosesKurapikaGoldenHeavy'
import { KURAPIKA_GOLDEN_HEAVY } from './kurapikaGoldenHeavy'
import { goldenHeavyOutcome, kurapikaGoldenHeavyOutcomePose } from './kurapikaGoldenHeavyOutcome'

const frames = KURAPIKA_GOLDEN_HEAVY.frames

function fighter(frame: number, outcome: 'hit' | 'block' | 'whiff') {
  const made = createFightState('kurapika', 'hisoka').player
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

describe('Kurapika golden heavy outcomes', () => {
  it('shares one contact silhouette before branching', () => {
    for (const outcome of ['hit', 'block', 'whiff'] as const) {
      const actor = fighter(frames.startup, outcome)
      expect(kurapikaGoldenHeavyOutcomePose(actor, { frame: frames.startup, frames })).toEqual({})
    }
  })

  it('draws distinct hit, block and whiff follow-throughs in recovery', () => {
    const frame = frames.startup + frames.active + 2
    const base = sampleTimeline(KURAPIKA_GOLDEN_HEAVY_TIMELINE, { frame, frames })
    const poses = (['hit', 'block', 'whiff'] as const).map((outcome) => {
      const actor = fighter(frame, outcome)
      expect(goldenHeavyOutcome(actor, frames)).toBe(outcome)
      return addPoses(base, kurapikaGoldenHeavyOutcomePose(actor, { frame, frames }))
    })
    expect(new Set(poses.map((pose) => JSON.stringify(pose))).size).toBe(3)
    expect(poses[1].root?.[2]).toBeLessThan(poses[0].root?.[2] ?? 0)
    expect(poses[2].root?.[2]).toBeGreaterThan(poses[0].root?.[2] ?? 0)
  })

  it('fades every presentation branch before the move ends', () => {
    for (const outcome of ['hit', 'block', 'whiff'] as const) {
      const actor = fighter(26, outcome)
      expect(kurapikaGoldenHeavyOutcomePose(actor, { frame: 26, frames })).toEqual({})
    }
  })
})
