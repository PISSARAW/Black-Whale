import { describe, expect, it } from 'vitest'
import { bodyPlan } from './fightBodyMotion'
import { createFightState } from './fightState'
import { motionOf, PREJUMP_FRAMES } from './fighterMovement'
import { fighterKeyedMove } from './fighterKeyedMove'
import { projectHanzo, steerHanzoProjection } from './hanzoProjection'
import { keyPoseSource, keyPoseTimeline } from './keyPoseMoves'
import { keyFrameOf, sampleTimeline } from './keyPoseTimeline'
import { moveForSlot } from './movesets'
import { COMBAT_NORMALS } from './secondFiveNormals'
import { blinkyCarryAngle } from './shizukuToolMotion'
import { EMPTY_INPUT, type ArcadeFighter } from './types'

const FIGHTERS = ['shizuku', 'hinrigh', 'mizaistom', 'leorio', 'hanzo'] as const
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

describe('fourth five Hatsu combat styles', () => {
  it.each([1, -1] as const)('draws six personal movement states facing %s', (facing) => {
    const states = FIGHTERS.map((id) =>
      movementPoses({ ...createFightState(id, 'hisoka').player, facing }),
    )
    for (const poses of states) {
      expect(poses.map((plan) => plan?.key)).toEqual([
        'walk:forward',
        'walk:backward',
        'guard',
        'prejump',
        'jump',
        'landing',
      ])
      expect(poses.map((plan) => plan?.plant)).toEqual([true, true, true, true, false, true])
    }
    for (let state = 0; state < states[0].length; state++) {
      expect(new Set(states.map((poses) => JSON.stringify(poses[state]?.pose))).size).toBe(5)
    }
  })

  it('has 45 different dedicated contact poses with active coverage', () => {
    const contacts = new Set<string>()
    for (const id of FIGHTERS) {
      for (const slot of COMBAT_NORMALS) {
        const label = `${id}:${slot}`
        const frames = moveForSlot(id, slot)!.tuning
        const timeline = keyPoseTimeline(id, slot)!
        expect(keyPoseSource(id, slot), label).toBe('dedicated')
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
        contacts.add(JSON.stringify(contact))
      }
    }
    expect(contacts.size).toBe(45)
  })

  it('changes Blinky’s tool carriage from walking to bracing and jumping', () => {
    const shizuku = createFightState('shizuku', 'hanzo').player
    const carriage = (['walk', 'guard', 'jump'] as const).map((pose) =>
      blinkyCarryAngle({ ...shizuku, pose }),
    )
    expect(carriage.every(Boolean)).toBe(true)
    expect(new Set(carriage.map((angle) => JSON.stringify(angle))).size).toBe(3)
  })

  it.each([1, -1] as const)(
    'gives Hanzo’s double nine different suspended attacks facing %s',
    (facing) => {
      const body = { ...createFightState('hanzo', 'shizuku').player, facing }
      const astral = projectHanzo(body)
      astral.hanzoProjection!.startupFrames = 0
      const floated = steerHanzoProjection(astral, { ...EMPTY_INPUT, right: true, jump: true })
      expect(bodyPlan(astral, context)).toMatchObject({ key: 'astral-double', plant: false })
      expect(bodyPlan(floated, context)).toMatchObject({ key: 'astral-double:glide', plant: false })
      expect(bodyPlan(floated, context)?.pose).not.toEqual(bodyPlan(astral, context)?.pose)
      const silhouettes = new Set<string>()
      for (const slot of COMBAT_NORMALS) {
        const move = moveForSlot('hanzo', slot)!
        const { kind, variant } = move
        const attack: NonNullable<ArcadeFighter['attack']> = {
          moveId: move.id,
          kind,
          variant,
          frame: move.tuning.startup,
          impacted: false,
          auraCharged: false,
          concealed: false,
          hatsuSource: null,
          projectileSpawned: false,
          reversal: false,
        }
        const physical: ArcadeFighter = { ...body, pose: kind, attack }
        const double: ArcadeFighter = { ...astral, pose: kind, attack }
        expect(fighterKeyedMove(double, slot).timeline).not.toEqual(
          fighterKeyedMove(physical, slot).timeline,
        )
        const projected = bodyPlan(double, context)
        expect(projected).toMatchObject({ key: `astral-double:attack:${slot}`, plant: false })
        expect(projected?.pose).not.toEqual(bodyPlan(physical, context)?.pose)
        expect(projected?.supportFoot).toBeUndefined()
        silhouettes.add(JSON.stringify(projected?.pose))
      }
      expect(silhouettes.size).toBe(9)
    },
  )
})
