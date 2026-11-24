import { describe, expect, it } from 'vitest'
import { bodyPlan } from './fightBodyMotion'
import { createFightState } from './fightState'
import { motionOf, PREJUMP_FRAMES } from './fighterMovement'
import { keyPoseSource, keyPoseTimeline } from './keyPoseMoves'
import { keyFrameOf, sampleTimeline } from './keyPoseTimeline'
import { moveForSlot } from './movesets'
import { COMBAT_NORMALS } from './secondFiveNormals'
import type { ArcadeFighter } from './types'

const FIGHTERS = ['furykov', 'cluck', 'beyond', 'longhi', 'musse'] as const
const states = ['walk:forward', 'walk:backward', 'guard', 'prejump', 'jump', 'landing']

function plans(fighter: ArcadeFighter) {
  const motion = motionOf(fighter)
  const retreat = fighter.facing === 1 ? -1 : 1
  const variants: ArcadeFighter[] = [
    { ...fighter, pose: 'walk', motion: { ...motion, heldDirection: fighter.facing } },
    { ...fighter, pose: 'walk', motion: { ...motion, heldDirection: retreat } },
    { ...fighter, pose: 'guard' },
    { ...fighter, motion: { ...motion, prejumpFrames: PREJUMP_FRAMES - 1 } },
    { ...fighter, pose: 'jump', y: 3 },
    { ...fighter, motion: { ...motion, landingFrames: 2 } },
  ]
  return variants.map((variant) => bodyPlan(variant, { seconds: 1, progress: 0.5 }))
}

describe('seventh five Hatsu combat styles', () => {
  it.each([1, -1] as const)('keeps the six movement states distinct facing %s', (facing) => {
    const sets = FIGHTERS.map((id) => plans({ ...createFightState(id, 'hisoka').player, facing }))
    for (const plan of sets) {
      expect(plan.map((pose) => pose?.key)).toEqual(states)
      expect(plan.map((pose) => pose?.plant)).toEqual([true, true, true, true, false, true])
    }
    for (const index of states.keys()) {
      expect(new Set(sets.map((set) => JSON.stringify(set[index]?.pose))).size).toBe(5)
    }
  })

  it('has 45 dedicated normals with separate finite contact poses and active coverage', () => {
    const poses = new Set<string>()
    for (const id of FIGHTERS) {
      for (const slot of COMBAT_NORMALS) {
        const label = `${id}:${slot}`
        const timeline = keyPoseTimeline(id, slot)!
        const frames = moveForSlot(id, slot)!.tuning
        expect(keyPoseSource(id, slot), label).toBe('dedicated')
        expect(
          timeline.some((key) => key.phase === 'active' && key.at === 0),
          label,
        ).toBe(true)
        expect(
          timeline.some((key) => key.phase === 'active' && key.at === 1),
          label,
        ).toBe(true)
        const times = timeline.map((key) => keyFrameOf(key, frames))
        expect(times, label).toEqual(times.slice().sort((a, b) => a - b))
        const contact = sampleTimeline(timeline, {
          frames,
          frame: frames.startup,
          continuous: true,
        })
        expect(Object.values(contact).flat().every(Number.isFinite), label).toBe(true)
        poses.add(JSON.stringify(contact))
      }
    }
    expect(poses.size).toBe(45)
  })
})
