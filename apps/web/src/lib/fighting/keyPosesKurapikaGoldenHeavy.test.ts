import { describe, expect, it } from 'vitest'
import { KURAPIKA_GOLDEN_HEAVY_TIMELINE } from './keyPosesKurapikaGoldenHeavy'
import { keyFrameOf } from './keyPoseTimeline'
import { KURAPIKA_GOLDEN_HEAVY } from './kurapikaGoldenHeavy'

describe('Kurapika golden heavy key poses', () => {
  it('pins the authored beats to the golden review frames', () => {
    const frames = KURAPIKA_GOLDEN_HEAVY_TIMELINE.map((key) =>
      Math.round(keyFrameOf(key, KURAPIKA_GOLDEN_HEAVY.frames)),
    )
    expect(frames).toEqual([2, 4, 6, 7, 8, 12, 14, 19, 25])
  })

  it('drives from pelvis to guarded rear-hand contact', () => {
    const contact = KURAPIKA_GOLDEN_HEAVY_TIMELINE.find(
      ({ phase, at }) => phase === 'active' && at === 0,
    )!
    expect(contact.pose.pelvis?.[1]).toBeGreaterThan(0.35)
    expect(contact.pose.rearShoulder?.[0]).toBeLessThan(-1)
    expect(contact.pose.rearElbow?.[0]).toBeLessThan(0)
    expect(contact.pose.leadElbow?.[0]).toBeLessThan(-0.7)
    expect(contact.pose.rearFoot?.[1]).toBeGreaterThan(0.2)
  })
})
