import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { ShizukuVictoryPose } from './shizukuPose'
import { createVisitHatsuModel } from '../visitHatsuModel'
import { reachVictoryHand } from './pose'
import { SHIZUKU_BLOOD, SHIZUKU_DEATH, SHIZUKU_CLEAN, SHIZUKU_BUTTON } from './shizukuPose'

export function createVictoryBlinky() {
  const faceNames = [
    'nozzle-head',
    'open-mouth',
    ...[-1, 1].flatMap((side) => ['white', 'pupil'].map((part) => `blinky-eye-${side}-${part}`)),
    'tongue',
    ...[-1, 1].flatMap((side) => Array.from({ length: 7 }, (_, i) => `tooth-${side}-${i}`)),
  ]
  const model = createVisitHatsuModel(THREE, { model: 'blinky', joints: faceNames })
  const face = new THREE.Group()
  face.position.set(0.9, 0.75, 0.2)
  model.body.add(face)
  model.body.updateWorldMatrix(true, true)
  faceNames.forEach((name) => face.attach(model.joints.get(name)!))
  model.root.name = 'shizuku-deme-chan-victory'
  const grip = new THREE.Vector3(-0.3, 0.5, 0)
  const place = (point: THREE.Vector3) => model.body.localToWorld(point.clone())
  return {
    root: model.root,
    sync(context: VictoryContext, pose: ShizukuVictoryPose) {
      const { hero, age } = context
      const native = hero.root.getObjectByName('shizuku-blinky')
      if (native) {
        context.save(native)
        native.visible = false
      }
      model.fit({ height: hero.height * 0.64, width: hero.height * 0.72 })
      const park = Math.max(0, Math.min(1, (age - 498) / 36))
      const direction = (
        age >= SHIZUKU_CLEAN
          ? new THREE.Vector3(0.65, -0.45, 0.65)
          : new THREE.Vector3(1, -0.08, 0.75)
      ).normalize()
      model.root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction)
      model.root.rotateZ(Math.PI / 2)
      model.root.quaternion.slerp(
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2),
        park,
      )
      face.rotation.z = (-Math.PI / 2) * (1 - park)
      model.root.position.set(0, 0, 0)
      model.root.updateWorldMatrix(true, true)
      model.root.position.add(pose.grip.clone().sub(place(grip)))
      model.root.updateWorldMatrix(true, true)
      const right = reachVictoryHand(context, { side: 'right', target: place(grip) })
      const support = place(new THREE.Vector3(-0.33, 0.75, -0.04))
      let left = 0
      if (age < 474) left = reachVictoryHand(context, { side: 'left', target: support })
      const sucking =
        (age >= SHIZUKU_BLOOD && age < SHIZUKU_DEATH) ||
        (age >= SHIZUKU_CLEAN && age < SHIZUKU_BUTTON)
      model.joints.get('tongue')!.rotation.x = sucking ? Math.sin(age * 0.4) * 0.16 : 0
      model.root.updateWorldMatrix(true, true)
      return {
        mouth: model.joints.get('open-mouth')!.localToWorld(new THREE.Vector3(0, 0, 1.2)),
        right,
        left,
        sucking,
      }
    },
    dispose: model.dispose,
  }
}
