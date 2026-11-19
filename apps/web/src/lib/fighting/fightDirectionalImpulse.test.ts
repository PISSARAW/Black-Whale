import { expect, it } from 'vitest'
import { createFightState } from './fightState'
import { fightPhysicalProfile } from './fightPhysicalProfile'
import { impactTwist, directionalImpulse } from './fightDirectionalImpulse'
import { physicalHitPose, type PhysicalHit } from './fightHitResponse'
import { physicalFallPose } from './fightFallResponse'
import { FIGHTING_ROSTER } from './roster'

it.each(FIGHTING_ROSTER.map((f) => f.id))(
  '%s reacts asymmetrically to direction and articulates its fall',
  (id) => {
    const fighter = createFightState(id, 'hisoka').player
    const hit: PhysicalHit = {
      sequence: 1,
      duration: 24,
      victim: id,
      zone: 'torso',
      force: 1,
      twist: 1,
      crush: false,
      rising: false,
      profile: fightPhysicalProfile(fighter),
    }
    const left = directionalImpulse(hit, 6),
      right = directionalImpulse({ ...hit, twist: -1 }, 6)
    expect(left.chest![1]).toBe(-right.chest![1])
    expect(left.leadShoulder![0]).not.toBe(left.rearShoulder![0])
    expect(directionalImpulse({ ...hit, rising: true }, 6).chest![0]).toBeLessThan(0)
    expect(directionalImpulse({ ...hit, crush: true }, 6).chest![0]).toBeGreaterThan(0)
    const first = physicalHitPose(hit, 0),
      later = physicalHitPose(hit, 0.3)
    expect(Math.abs(later.chest![1])).toBeGreaterThan(Math.abs(first.chest![1]))
    const fall = physicalFallPose(hit, { progress: 0.35, grounded: true })
    expect(fall.leadKnee![0]).not.toBe(fall.rearKnee![0])
    expect(fall.leadElbow![0]).not.toBe(fall.rearElbow![0])
    expect(Object.values(fall).flat().every(Number.isFinite)).toBe(true)
    expect(Number.isFinite(impactTwist(fighter, 'hook'))).toBe(true)
  },
)
