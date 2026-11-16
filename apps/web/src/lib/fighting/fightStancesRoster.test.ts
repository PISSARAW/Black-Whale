import { describe, expect, it } from 'vitest'
import { FIGHT_JOINTS, type FightPose } from './fightPose'
import { fightStance } from './fightStance'
import { FIGHTING_ROSTER } from './roster'

/** Sum of absolute joint differences between two poses. */
function distance(a: FightPose, b: FightPose): number {
  return FIGHT_JOINTS.reduce((total, joint) => {
    const from = a[joint] ?? [0, 0, 0]
    const to = b[joint] ?? [0, 0, 0]
    return total + from.reduce((sum, value, axis) => sum + Math.abs(value - to[axis]), 0)
  }, 0)
}

describe('idle stances', () => {
  it('gives every playable fighter a stance', () => {
    const missing = FIGHTING_ROSTER.filter((fighter) => !fightStance(fighter.id))
    expect(missing.map((fighter) => fighter.id)).toEqual([])
  })

  it('keeps every pair of stances visibly apart', () => {
    const stances = FIGHTING_ROSTER.map((fighter) => ({
      id: fighter.id,
      pose: fightStance(fighter.id)!.pose,
    }))
    const tooClose: string[] = []
    stances.forEach((a, index) =>
      stances.slice(index + 1).forEach((b) => {
        if (distance(a.pose, b.pose) < 0.6) tooClose.push(`${a.id}/${b.id}`)
      }),
    )
    expect(tooClose).toEqual([])
  })
})
