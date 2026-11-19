import { describe, expect, it } from 'vitest'
import { attackData } from './frameData'
import { bodyPlan } from './fightBodyMotion'
import { createFightPoseContinuity } from './fightPoseContinuity'
import type { FightPose } from './fightPose'
import { createFightState } from './fightState'
import { fightStance } from './fightStance'
import { moveForSlot } from './movesets'
import { strikingStance } from './strikingLegs'
import type { ArcadeFighter } from './types'

const LARGE_FRAMES = ['beyond', 'franklin'] as const

describe('upright fighters strike from a lunge', () => {
  it.each(['benjamin', 'tserriednich', ...LARGE_FRAMES] as const)(
    '%s steps the lead foot forward',
    (id) => {
      const standing = fightStance(id)!.pose
      const striking = strikingStance(id, standing)
      // Lead hip swings further forward and the knees bend more than in the idle stance.
      expect(striking.leadHip![0]).toBeLessThan(standing.leadHip![0])
      expect(striking.leadKnee![0]).toBeGreaterThan(standing.leadKnee![0])
      expect(striking.rearHip![0]).toBeGreaterThan(standing.rearHip![0])
      // The upper body keeps the fighter's own stance.
      expect(striking.chest).toEqual(standing.chest)
    },
  )
  it('leaves every other fighter on its own stance', () => {
    const standing = fightStance('kurapika')!.pose
    expect(strikingStance('kurapika', standing)).toBe(standing)
  })
})

it.each(LARGE_FRAMES)('%s drives its heavy strike through a continuous lunge', (id) => {
  const idle = createFightState(id, 'hisoka').player
  const move = moveForSlot(id, 'standingHeavy')!
  const fighter: ArcadeFighter = {
    ...idle,
    pose: move.kind,
    attack: {
      kind: move.kind,
      variant: move.variant,
      moveId: move.id,
      frame: 0,
      impacted: false,
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
      projectileSpawned: false,
      reversal: false,
    },
  }
  const frames = attackData(move.kind, fighter)
  const continuity = createFightPoseContinuity()
  continuity(bodyPlan(idle, { seconds: 0, progress: 0 })!, 0)

  let previous: readonly number[] | undefined
  let largestJointStep = 0
  let contact: FightPose | undefined
  for (let frame = 0; frame <= frames.startup; frame++) {
    fighter.attack = { ...fighter.attack!, frame }
    const seconds = (frame + 1) / 60
    const pose = continuity(bodyPlan(fighter, { seconds, progress: 0 })!, seconds)
    const legs = [
      pose.leadHip?.[0] ?? 0,
      pose.leadKnee?.[0] ?? 0,
      pose.rearHip?.[0] ?? 0,
      pose.rearKnee?.[0] ?? 0,
    ]
    if (previous)
      largestJointStep = Math.max(
        largestJointStep,
        ...legs.map((value, index) => Math.abs(value - previous![index])),
      )
    previous = legs
    contact = pose
  }

  expect(contact?.root?.[2] ?? 0).toBeGreaterThan(0.05)
  expect(contact?.leadHip?.[0] ?? 0).toBeLessThan(-0.4)
  expect(contact?.leadKnee?.[0] ?? 0).toBeGreaterThan(0.8)
  expect(contact?.rearHip?.[0] ?? 0).toBeGreaterThan(0.25)
  expect(contact?.rearKnee?.[0] ?? 0).toBeGreaterThan(0.5)
  expect(largestJointStep).toBeLessThan(0.23)
})
