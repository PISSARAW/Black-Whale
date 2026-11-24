import { describe, expect, it } from 'vitest'
import { bodyPlan } from './fightBodyMotion'
import { createFightState } from './fightState'
import { motionOf, PREJUMP_FRAMES } from './fighterMovement'
import { keyPoseSource, keyPoseTimeline } from './keyPoseMoves'
import { keyFrameOf, sampleTimeline } from './keyPoseTimeline'
import { moveForSlot } from './movesets'
import { COMBAT_NORMALS } from './secondFiveNormals'
import type { ArcadeFighter } from './types'

const FIGHTERS = ['franklin', 'machi', 'illumi', 'kalluto', 'bonolenov'] as const
const context = { seconds: 1, progress: 0.5 }

function movementPoses(fighter: ArcadeFighter) {
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
  return variants.map((variant) => bodyPlan(variant, context))
}

describe('third five Hatsu combat styles', () => {
  it.each([1, -1] as const)('draws six personal movement states facing %s', (facing) => {
    const states = FIGHTERS.map((id) =>
      movementPoses({ ...createFightState(id, 'hisoka').player, facing }),
    )
    for (const [index, poses] of states.entries()) {
      const walks =
        FIGHTERS[index] === 'bonolenov'
          ? ['bonolenov:step:true', 'bonolenov:step:false']
          : ['walk:forward', 'walk:backward']
      expect(poses.map((plan) => plan?.key)).toEqual([
        ...walks,
        'guard',
        'prejump',
        'jump',
        'landing',
      ])
      expect(poses.map((plan) => plan?.plant)).toEqual([true, true, true, true, false, true])
      expect(poses[0]?.pose).not.toEqual(poses[1]?.pose)
    }
    for (let state = 0; state < states[0].length; state++) {
      expect(new Set(states.map((poses) => JSON.stringify(poses[state]?.pose))).size).toBe(5)
    }
  })

  it('has 45 dedicated contacts with ordered preparation and recovery', () => {
    const contacts = new Set<string>()
    for (const id of FIGHTERS) {
      for (const slot of COMBAT_NORMALS) {
        const label = `${id}:${slot}`
        const frames = moveForSlot(id, slot)!.tuning
        const timeline = keyPoseTimeline(id, slot)!
        expect(keyPoseSource(id, slot), label).toBe('dedicated')
        expect(
          timeline.some((key) => key.phase === 'startup'),
          label,
        ).toBe(true)
        expect(
          timeline.some((key) => key.phase === 'active' && key.at === 1),
          label,
        ).toBe(true)
        expect(
          timeline.some((key) => key.phase === 'recovery'),
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
        contacts.add(JSON.stringify(contact))
      }
    }
    expect(contacts.size).toBe(45)
  })
})
