import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { createFightState } from './fightState'
import { fightStrikeLimb } from './fightStrikeLimb'
import {
  boundedGoldenHeavyContact,
  GOLDEN_HEAVY_CONTACT_CORRECTION,
} from './kurapikaGoldenHeavyContact'

function attacking() {
  const fighter = createFightState('kurapika', 'hisoka').player
  fighter.attack = {
    moveId: 'kurapika:standingHeavy',
    variant: 'standing',
    kind: 'heavy',
    frame: 8,
    impacted: false,
    auraCharged: false,
    concealed: false,
    hatsuSource: null,
    projectileSpawned: false,
    reversal: false,
  }
  return fighter
}

describe('Kurapika golden heavy contact', () => {
  it('identifies the authored rear hand in both facings', () => {
    const right = attacking()
    const left = { ...attacking(), facing: -1 as const }
    expect(fightStrikeLimb(right, 'hands')).toBe('left')
    expect(fightStrikeLimb(left, 'hands')).toBe('right')
  })

  it('accepts a nearby torso target and bounds an impossible correction', () => {
    const fighter = attacking()
    const current = new Vector3(0, 1, 0)
    const near = new Vector3(0.08, 1.02, 0)
    expect(boundedGoldenHeavyContact(fighter, current, near)).toEqual(near)

    const far = boundedGoldenHeavyContact(fighter, current, new Vector3(1, 2, 0))
    expect(far.distanceTo(current)).toBeCloseTo(GOLDEN_HEAVY_CONTACT_CORRECTION)
  })
})
