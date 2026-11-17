import * as THREE from 'three'
import { createVisitHatsuModel } from '../visitHatsuModel'
import type { VictoryContext } from './types'
import type { HinrighVictoryPose } from './hinrighPose'
import { HINRIGH_LOCKS } from './hinrighPose'
import { localToHead, reachVictoryHand } from './pose'
import { disposeVictoryObject, ease } from './resources'

function box(size: [number, number, number], colour: number) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshBasicMaterial({ color: colour }),
  )
}
function makeCase() {
  const root = new THREE.Group()
  root.name = 'hinrigh-carried-equipment-case'
  const base = box([0.92, 0.07, 0.48], 0x242931)
  const lining = box([0.86, 0.025, 0.42], 0x445148)
  lining.position.y = 0.045
  const lid = box([0.92, 0.48, 0.04], 0x242931)
  lid.position.set(0, 0.23, -0.24)
  const leg = box([0.04, 1, 0.04], 0x6e7578)
  leg.position.y = -0.5
  root.add(base, lining, lid, leg)
  return { root, leg }
}
function recordingCamera() {
  const root = new THREE.Group()
  const body = box([0.27, 0.17, 0.29], 0x25282d)
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.1, 16),
    new THREE.MeshBasicMaterial({ color: 0x44758b }),
  )
  lens.rotation.x = Math.PI / 2
  lens.position.z = 0.18
  root.add(body, lens)
  return root
}
function makeCuffPair() {
  const root = new THREE.Group()
  const rings = [0, 1].map(
    () =>
      new THREE.Mesh(
        new THREE.TorusGeometry(0.065, 0.012, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xc5cdd0 }),
      ),
  )
  const link = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 1, 7),
    new THREE.MeshBasicMaterial({ color: 0x919b9d }),
  )
  root.add(...rings, link)
  return { root, rings, link }
}
function lockPair(pair: ReturnType<typeof makeCuffPair>, points: THREE.Vector3[]) {
  pair.rings.forEach((ring, i) => {
    ring.position.copy(points[i])
    ring.rotation.set(Math.PI / 2, 0.2, 0)
  })
  pair.link.position.copy(points[0]).lerp(points[1], 0.5)
  const direction = points[1].clone().sub(points[0])
  pair.link.scale.y = direction.length()
  pair.link.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
}
export function createHinrighObjects() {
  const root = new THREE.Group(),
    equipment = makeCase(),
    camera = recordingCamera()
  const cat = createVisitHatsuModel(THREE, {
    model: 'biohazard',
    stage: 0,
    anchor: 'floor',
    joints: ['camera-cat-head'],
  })
  cat.fit({ width: 0.6, height: 0.48 })
  const catScale = cat.root.scale.x
  const pigeons = [0, 1].map(() => {
    const bird = createVisitHatsuModel(THREE, {
      model: 'biohazard',
      stage: 1,
      joints: ['pigeon-wing--1', 'pigeon-wing-1'],
    })
    bird.fit({ width: 0.58, height: 0.4 })
    return bird
  })
  const pairs = [makeCuffPair(), makeCuffPair()]
  root.add(
    equipment.root,
    camera,
    cat.root,
    ...pigeons.map((p) => p.root),
    ...pairs.map((p) => p.root),
  )
  return {
    root,
    sync(context: VictoryContext, pose: HinrighVictoryPose) {
      const { age } = context
      equipment.root.position.copy(pose.origin)
      equipment.leg.scale.y = pose.origin.y
      equipment.leg.position.y = -pose.origin.y / 2
      camera.position.copy(pose.origin).add(new THREE.Vector3(-0.24, 0.14, 0))
      const morph = ease((age - 30) / 18)
      camera.visible = morph < 1
      camera.scale.setScalar(Math.max(0.001, 1 - morph))
      cat.root.visible = morph > 0
      cat.root.position.copy(pose.cat)
      cat.root.quaternion.copy(pose.catFacing)
      cat.root.scale.setScalar(catScale * Math.max(0.001, morph))
      const points = [pose.wrists, pose.ankles]
      const errors: number[] = []
      pigeons.forEach((bird, i) => {
        const t = ease((age - 72 - i * 24) / (HINRIGH_LOCKS[i] - 72 - i * 24))
        const destination = points[i][0].clone().lerp(points[i][1], 0.5)
        const from = pose.origin.clone().add(new THREE.Vector3(0, 0.12, i * 0.12))
        bird.root.position.copy(from).lerp(destination, t)
        bird.root.position.y += Math.sin(Math.PI * t) * (0.65 + i * 0.35)
        bird.root.rotation.set(0.1 * Math.sin(age / 8), 0.5 * Math.sin(age / 18), 0)
        bird.root.visible = age >= 54 && age < HINRIGH_LOCKS[i]
        bird.joints.forEach((wing, key) => {
          wing.rotation.z = (key.endsWith('--1') ? -1 : 1) * Math.sin(age * 0.55) * 0.8
        })
        const locked = age >= HINRIGH_LOCKS[i]
        pairs[i].root.visible = locked || age < 72 + i * 24
        lockPair(
          pairs[i],
          locked
            ? points[i]
            : [
                from.clone().add(new THREE.Vector3(-0.09, 0, 0)),
                from.clone().add(new THREE.Vector3(0.09, 0, 0)),
              ],
        )
        errors.push(
          ...pairs[i].rings.map((ring, j) => (locked ? ring.position.distanceTo(points[i][j]) : 0)),
        )
      })
      context.add(root)
      root.updateWorldMatrix(true, true)
      const catHead = cat.joints
        .get('camera-cat-head')!
        .getWorldPosition(new THREE.Vector3())
        .add(new THREE.Vector3(0, 0.075, 0))
      const pet = pose.hand.clone().lerp(catHead, ease((age - 462) / 24))
      const petError = reachVictoryHand(context, {
        side: 'right',
        target: pet,
        pole: localToHead(context.hero, new THREE.Vector3(0.45, -0.65, 0.2)),
      })
      return { cuffErrors: errors, transformed: morph === 1, petError, catHead: catHead.toArray() }
    },
    dispose() {
      cat.dispose()
      pigeons.forEach((bird) => bird.dispose())
      disposeVictoryObject(root)
    },
  }
}
