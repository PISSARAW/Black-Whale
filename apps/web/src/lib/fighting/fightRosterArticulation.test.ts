import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { createFightState } from './fightState'
import { movesetFor } from './movesets'
import { FIGHTING_ROSTER } from './roster'
import type { ArcadeFighter } from './types'

const glow = (color: number, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

describe('P20 controlled roster rollout', () => {
  it.each(FIGHTING_ROSTER)(
    '$name receives articulated joints, responsive extremities and an identity contract',
    ({ id }) => {
      const fighter = createFightState(id, 'hisoka').player
      const before = JSON.stringify(fighter)
      const model = buildFightFigure({ THREE, glow, fighter })
      const camera = fightCamera()
      expect(model.root.getObjectByName('fight-joint-volumes')?.userData.rollout).toBe(
        'roster-articulated-anatomy',
      )
      expect(model.turns.userData.materialResponse).toBe('roster-extremities-and-tailoring')
      const identity = model.root.getObjectByName('fight-gameplay-identity')!
      expect(identity.userData.identityAnchors).toHaveLength(3)
      for (const anchor of identity.userData.identityAnchors)
        expect(model.root.getObjectByName(anchor), `${id}:${anchor}`).toBeDefined()

      for (const side of ['left', 'right'] as const) {
        const hand = model.root.getObjectByName(`hand-${side}`) as THREE.Mesh
        if (id === 'franklin') {
          expect(hand.scale.x, `${id}:${side}:finger-rig-scale`).toBeGreaterThan(1)
          expect(
            hand.children.filter((child) => child.name.startsWith(`franklin-finger-${side}`)),
            `${id}:${side}:grip`,
          ).toHaveLength(5)
        } else {
          expect(hand.scale.toArray(), `${id}:${side}:held-child-scale`).toEqual([1, 1, 1])
          expect(hand.geometry.userData.fightGripMorph, `${id}:${side}:grip`).toBe(true)
        }
        expect(
          model.root.getObjectByName(`fight-elbow-volume-${side}`),
          `${id}:${side}:elbow`,
        ).toBeDefined()
        expect(
          model.root.getObjectByName(`fight-knee-volume-${side}`),
          `${id}:${side}:knee`,
        ).toBeDefined()
      }

      for (const facing of [1, -1] as const) {
        model.root.rotation.y = facing * 1.25
        const move = movesetFor(id)!.moves.find((candidate) => candidate.slot === 'lowHeavy')!
        const posed: ArcadeFighter = {
          ...fighter,
          facing,
          pose: move.kind,
          attack: {
            kind: move.kind,
            variant: move.variant,
            moveId: move.id,
            frame: move.tuning.startup,
            impacted: false,
            auraCharged: false,
            concealed: false,
            hatsuSource: null,
            projectileSpawned: false,
            reversal: false,
          },
        }
        const lead = facing === 1 ? 1 : 0
        const shoe = model.root.getObjectByName(lead === 0 ? 'knee-left' : 'knee-right')!
          .children[1]
        const restZ = shoe.scale.z
        model.animate(facing === 1 ? 1 : 2, 'idle', {
          transitionSeconds: 0,
          motion: fightBodyMotion({ fighter: posed, seconds: 1, progress: 0.5 }),
        })
        expect(shoe.scale.z, `${id}:${facing}:shoe-response`).toBeGreaterThanOrEqual(restZ)
      }
      model.root.updateMatrixWorld(true)
      for (const anchor of identity.userData.identityAnchors)
        expect(
          projectedMajorAxis(model.root.getObjectByName(anchor)!, camera),
          `${id}:${anchor}:camera`,
        ).toBeGreaterThanOrEqual(3)
      expect(JSON.stringify(fighter)).toBe(before)
    },
  )

  it('shares one joint buffer and keeps hand morph variants bounded across forty fighters', () => {
    const jointGeometry = new Set<THREE.BufferGeometry>()
    const handGeometry = new Set<THREE.BufferGeometry>()
    for (const { id } of FIGHTING_ROSTER) {
      const model = buildFightFigure({
        THREE,
        glow,
        fighter: createFightState(id, 'hisoka').player,
      })
      jointGeometry.add(
        (model.root.getObjectByName('fight-elbow-volume-left')!.children[0] as THREE.Mesh).geometry,
      )
      handGeometry.add((model.root.getObjectByName('hand-left') as THREE.Mesh).geometry)
    }
    expect(jointGeometry.size).toBe(1)
    expect(handGeometry.size).toBeLessThanOrEqual(8)
  })
})

function fightCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(34, 1280 / 560, 0.1, 30)
  camera.position.set(0, 2.25, 9.2)
  camera.lookAt(0, 1, 0)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)
  return camera
}

function projectedMajorAxis(part: THREE.Object3D, camera: THREE.Camera): number {
  const box = new THREE.Box3().setFromObject(part)
  const points: THREE.Vector3[] = []
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z])
        points.push(new THREE.Vector3(x, y, z).project(camera))
  const width =
    (Math.max(...points.map((point) => point.x)) - Math.min(...points.map((p) => p.x))) * 640
  const height =
    (Math.max(...points.map((point) => point.y)) - Math.min(...points.map((p) => p.y))) * 280
  return Math.max(width, height)
}
