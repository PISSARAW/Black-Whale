import { describe, expect, it } from 'vitest'
import { attackData } from './frameData'
import { bodyPlan } from './fightBodyMotion'
import { FIGHT_JOINTS, type FightPose } from './fightPose'
import { createFightState } from './fightState'
import { moveForSlot } from './movesets'
import type { ArcadeFighter, FighterId, MoveSlot } from './types'

const FLUID_MOVES: ReadonlyArray<readonly [FighterId, MoveSlot]> = [
  ['gel', 'downSpecial'],
  ['gel', 'backSpecial'],
  ['gel', 'neutralSpecial'],
  ['illumi', 'neutralSpecial'],
  ['hisoka', 'forwardSpecial'],
  ['terebellum', 'downSpecial'],
  ['musse', 'neutralSpecial'],
  ['hinrigh', 'neutralSpecial'],
  ['chrollo', 'downSpecial'],
  ['chrollo', 'backSpecial'],
  ['halkenburg', 'downSpecial'],
  ['machi', 'forwardSpecial'],
  ['biscuit', 'downSpecial'],
]

describe('natural technique motion', () => {
  it.each(FLUID_MOVES)('%s %s reaches contact without a one-frame limb snap', (id, slot) => {
    const fighter = attacking(id, slot)
    const frames = attackData(fighter.attack!.kind, fighter)
    let previous: FightPose | undefined
    let largest = 0
    for (let frame = 0; frame <= frames.startup; frame++) {
      fighter.attack = { ...fighter.attack!, frame }
      const pose = bodyPlan(fighter, { seconds: frame / 60, progress: 0 })!.pose
      if (previous) largest = Math.max(largest, largestPoseStep(previous, pose))
      previous = pose
    }
    expect(largest).toBeLessThan(0.9)
  })

  it('keeps Lynch question gesture compact despite its one-frame utility startup', () => {
    const fighter = attacking('lynch', 'neutralSpecial')
    fighter.attack!.frame = attackData(fighter.attack!.kind, fighter).startup
    const pose = bodyPlan(fighter, { seconds: 1 / 60, progress: 0 })!.pose
    expect(Math.abs(pose.rearShoulder?.[0] ?? 0)).toBeLessThan(0.4)
    expect(Math.abs(pose.body?.[0] ?? 0)).toBeLessThan(0.15)
  })

  it('keeps Bonolenov low heavy inside the authored knee budget', () => {
    const fighter = attacking('bonolenov', 'lowHeavy')
    const frames = attackData(fighter.attack!.kind, fighter)
    for (let frame = 0; frame <= frames.startup; frame++) {
      fighter.attack = { ...fighter.attack!, frame }
      const pose = bodyPlan(fighter, { seconds: frame / 60, progress: 0 })!.pose
      expect(pose.leadKnee?.[0] ?? 0).toBeLessThanOrEqual(2.35)
      expect(pose.rearKnee?.[0] ?? 0).toBeLessThanOrEqual(2.35)
    }
  })
})

function attacking(id: FighterId, slot: MoveSlot): ArcadeFighter {
  const fighter = createFightState(id, 'kurapika').player
  const move = moveForSlot(id, slot)!
  return {
    ...fighter,
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
}

function largestPoseStep(from: FightPose, to: FightPose): number {
  let largest = 0
  for (const joint of FIGHT_JOINTS) {
    const before = from[joint] ?? [0, 0, 0]
    const after = to[joint] ?? [0, 0, 0]
    for (let axis = 0; axis < 3; axis++)
      largest = Math.max(largest, Math.abs(after[axis] - before[axis]))
  }
  return largest
}
