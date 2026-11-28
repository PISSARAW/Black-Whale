import { expect, it } from 'vitest'
import * as THREE from 'three'
import { createFightState } from './fightState'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion, bodyPlan } from './fightBodyMotion'
import { fightRigOf } from './fightRig'
import { createSeparationSupport, settleFightSupport } from './fightSeparationSupport'
import { reachLimb } from './fightLimbReach'
import { closeBodyPlan } from './fightClosePosture'
import { humanAnimationRig } from '$lib/tour/humanAnimation'

const glow = (color: number) => new THREE.MeshBasicMaterial({ color })

it('leaves authored airborne choreography free even when simulation y is still on the floor', () => {
  const { fighter, model, rig } = setup()
  model.animate(1, 'idle', {
    motion: fightBodyMotion({
      fighter,
      seconds: 1,
      progress: 0,
      plan: { key: 'throw-lift', plant: false, blend: 0, pose: { root: [0, 1.2, 0] } },
    }),
  })
  const before = rig.ankles.map((ankle) => ankle.getWorldPosition(new THREE.Vector3()).toArray())
  const support = createSeparationSupport()
  support.prepare(model.turns, fighter, { frame: 60, frozen: false })
  support(model.turns, fighter, { frame: 60, frozen: false })
  settleFightSupport(rig, fighter)
  expect(rig.ankles.map((ankle) => ankle.getWorldPosition(new THREE.Vector3()).toArray())).toEqual(
    before,
  )
})
function setup() {
  const fighter = createFightState('benjamin', 'leorio').player
  const model = buildFightFigure({ THREE, glow, fighter })
  model.root.rotation.y = 1.25
  model.animate(0, 'idle', {
    transitionSeconds: 0,
    motion: fightBodyMotion({ fighter, seconds: 0, progress: 0 }),
  })
  const rig = fightRigOf(humanAnimationRig(model.turns)!)
  return { fighter, model, rig }
}

it('keeps a supporting sole in world space through a small separation correction', () => {
  const { fighter, model, rig } = setup()
  const support = createSeparationSupport()
  support(model.turns, fighter, { frame: 0, frozen: false })
  const soles = rig.ankles.map((a) => a.getWorldPosition(new THREE.Vector3()))
  const index = soles[0].y <= soles[1].y ? 0 : 1
  model.root.position.x += 0.06
  support(model.turns, fighter, { frame: 1, frozen: false })
  const after = rig.ankles[index].getWorldPosition(new THREE.Vector3())
  expect(Math.abs(after.x - soles[index].x)).toBeLessThan(0.015)
  expect(Math.abs(after.z - soles[index].z)).toBeLessThan(0.015)
})

it('reaches within bone lengths and never stretches an unreachable limb', () => {
  const { rig } = setup()
  const chain = { root: rig.human.legs[0], hinge: rig.human.knees[0], end: rig.ankles[0] }
  const boneTransforms = () =>
    [chain.root, chain.hinge, chain.end].map((bone) => [
      ...bone.position.toArray(),
      ...bone.scale.toArray(),
    ])
  const before = boneTransforms()
  const bent = chain.hinge.rotation.x
  chain.hinge.rotation.x += 0.1
  const target = chain.end.getWorldPosition(new THREE.Vector3())
  chain.hinge.rotation.x = bent
  expect(reachLimb(chain, target)).toBeLessThan(0.005)
  reachLimb(chain, target.addScalar(5))
  expect(boneTransforms()).toEqual(before)
})

it('anticipates a crowded trunk through the chest while preserving distance and immaterial exceptions', () => {
  const state = createFightState('benjamin', 'leorio')
  const plan = {
    ...bodyPlan(state.player, { seconds: 0, progress: 0 })!,
    pose: { body: [0.6, 0, 0] as const },
  }
  const close = closeBodyPlan(plan, { ...state.player, x: 48 }, { ...state.opponent, x: 52 })
  expect(close.pose.body![0]).toBeLessThan(0.3)
  expect(close.pose.chest![0]).toBeGreaterThan(0)
  expect(closeBodyPlan(plan, state.player, state.opponent).pose).toEqual(plan.pose)
})
