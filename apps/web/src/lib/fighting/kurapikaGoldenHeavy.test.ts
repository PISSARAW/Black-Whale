import { describe, expect, it } from 'vitest'
import { keyPoseTimeline } from './keyPoseMoves'
import { KURAPIKA_GOLDEN_HEAVY } from './kurapikaGoldenHeavy'
import { moveForSlot } from './movesets'

describe('Kurapika golden standing heavy contract', () => {
  it('freezes the competitive frame and target data', () => {
    const move = moveForSlot('kurapika', KURAPIKA_GOLDEN_HEAVY.slot)!
    expect(move.nameFr).toBe(KURAPIKA_GOLDEN_HEAVY.nameFr)
    expect(move.nameEn).toBe(KURAPIKA_GOLDEN_HEAVY.nameEn)
    expect(move.tuning).toMatchObject({
      ...KURAPIKA_GOLDEN_HEAVY.frames,
      targetZone: KURAPIKA_GOLDEN_HEAVY.target,
      reach: 11,
    })
  })

  it('uses one rear-hand hook timeline with the lead hand guarding', () => {
    const timeline = keyPoseTimeline('kurapika', KURAPIKA_GOLDEN_HEAVY.slot)!
    const contact = timeline.find(({ phase, at }) => phase === 'active' && at === 0)!
    expect(contact.pose.rearShoulder).toBeDefined()
    expect(contact.pose.rearElbow).toBeDefined()
    expect(contact.pose.leadElbow?.[0]).toBeLessThan(0)
  })
})
