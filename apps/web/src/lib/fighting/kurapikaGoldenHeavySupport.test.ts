import { describe, expect, it } from 'vitest'
import { createFightState } from './fightState'
import { footIndex } from './fightPlantedPose'
import { KURAPIKA_GOLDEN_HEAVY } from './kurapikaGoldenHeavy'
import { kurapikaGoldenHeavySupport } from './kurapikaGoldenHeavySupport'

const frames = KURAPIKA_GOLDEN_HEAVY.frames

function kurapika(frame: number) {
  const fighter = createFightState('kurapika', 'hisoka').player
  fighter.attack = {
    moveId: 'kurapika:standingHeavy',
    variant: 'standing',
    kind: 'heavy',
    frame,
    impacted: false,
    auraCharged: false,
    concealed: false,
    hatsuSource: null,
    projectileSpawned: false,
    reversal: false,
  }
  return fighter
}

describe('Kurapika golden heavy support', () => {
  it('locks the lead foot and peaks the rear pivot at contact', () => {
    const load = kurapikaGoldenHeavySupport(kurapika(2), frames)!
    const contact = kurapikaGoldenHeavySupport(kurapika(frames.startup), frames)!
    const settled = kurapikaGoldenHeavySupport(kurapika(25), frames)!
    expect(contact).toMatchObject({ supportFoot: 'lead', pivotFoot: 'rear' })
    expect(contact.pivotAngle).toBeGreaterThan(load.pivotAngle)
    expect(settled.pivotAngle).toBeLessThan(contact.pivotAngle)
  })

  it('mirrors semantic feet to rig indices', () => {
    expect(footIndex('lead', 1)).toBe(1)
    expect(footIndex('rear', 1)).toBe(0)
    expect(footIndex('lead', -1)).toBe(0)
    expect(footIndex('rear', -1)).toBe(1)
  })
})
