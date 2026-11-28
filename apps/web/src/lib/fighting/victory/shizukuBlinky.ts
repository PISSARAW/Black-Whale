import * as THREE from 'three'
import type { VictoryContext } from './types'
import { shizukuSleeveButton, type ShizukuVictoryPose } from './shizukuPose'
import { createVisitHatsuModel } from '../visitHatsuModel'
import { reachVictoryHand } from './pose'
import { ease } from './resources'
import {
  SHIZUKU_BLOOD,
  SHIZUKU_RELEASE,
  SHIZUKU_PULL,
  SHIZUKU_BUTTON,
  SHIZUKU_BUTTON_PULL,
  SHIZUKU_MATERIALIZED,
} from './shizukuTiming'

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
  const mouthAt = () => model.joints.get('open-mouth')!.localToWorld(new THREE.Vector3(0, 0, 1.2))
  const teethAt = () => model.joints.get('open-mouth')!.getWorldPosition(new THREE.Vector3())
  const aim = new THREE.Quaternion()
  return {
    root: model.root,
    sync(context: VictoryContext, pose: ShizukuVictoryPose) {
      const { hero, age } = context
      const native = hero.root.getObjectByName('shizuku-blinky')
      if (native) {
        context.save(native)
        native.visible = false
      }
      model.fit({ height: hero.height * 0.49, width: hero.height * 0.58 })
      const materialize = ease(age / SHIZUKU_MATERIALIZED)
      model.root.scale.multiplyScalar(Math.max(0.001, materialize))
      model.root.visible = age > 0
      model.root.rotation.set(0, 0, Math.PI / 2)
      face.rotation.z = -Math.PI / 2
      model.root.position.set(0, 0, 0)
      model.root.updateWorldMatrix(true, true)
      const direction = mouthAt().sub(teethAt()).normalize()
      aim.setFromUnitVectors(direction, pose.target.clone().sub(pose.grip).normalize())
      model.root.quaternion.premultiply(aim)
      model.root.updateWorldMatrix(true, true)
      model.root.position.add(pose.grip.clone().sub(place(grip)))
      model.root.updateWorldMatrix(true, true)

      const rightTarget = pose.grip
        .clone()
        .add(new THREE.Vector3(-0.055, -0.065, 0.09).multiplyScalar(pose.release))
      const right = reachVictoryHand(context, { side: 'right', target: rightTarget })
      const support = place(new THREE.Vector3(-0.33, 0.75, -0.04))
      support.y -= pose.regrip * 0.042
      support.z += pose.regrip * 0.064
      const inspection = shizukuSleeveButton(hero).add(new THREE.Vector3(-0.2, 0.23, 0.18))
      inspection.z = Math.max(inspection.z, hero.root.position.z + 0.3)
      const receive = pose.handTarget.clone().lerp(inspection, pose.inspect)
      support.lerp(receive, ease((age - SHIZUKU_BUTTON_PULL) / 41))
      const left = reachVictoryHand(context, { side: 'left', target: support })
      const sucking =
        (age >= SHIZUKU_BLOOD && age < SHIZUKU_RELEASE) ||
        (age >= SHIZUKU_PULL && age < SHIZUKU_BUTTON)
      model.joints.get('tongue')!.rotation.x = sucking ? Math.sin(age * 0.4) * 0.16 : 0
      model.root.updateWorldMatrix(true, true)
      return {
        mouth: mouthAt(),
        right,
        left,
        sucking,
      }
    },
    dispose: model.dispose,
  }
}
