import * as T from 'three'
import type { VictoryContext } from './types'
import type { RihanPose } from './rihanPose'
import { createFuturePistol } from './tserriednichExecution'
import { RIHAN_TIMING } from './rihanPlan'
import { ease, disposeVictoryObject } from './resources'

function orientation(hand: T.Vector3, target: T.Vector3) {
  const vector = target.clone().sub(hand)
  const along = Math.sqrt(Math.max(0.001, vector.lengthSq() - 0.048 ** 2))
  return new T.Quaternion().setFromUnitVectors(
    new T.Vector3(0, 0.048, along).normalize(),
    vector.normalize(),
  )
}
export function createRihanExecution() {
  const root = new T.Group(),
    gun = createFuturePistol()
  gun.name = 'rihan-cinematic-physical-pistol'
  const flash = new T.Mesh(
    new T.SphereGeometry(1, 12, 8),
    new T.MeshBasicMaterial({
      color: 0xffe2a0,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: T.AdditiveBlending,
    }),
  )
  const casing = new T.Mesh(
    new T.CylinderGeometry(0.01, 0.01, 0.03, 10),
    new T.MeshBasicMaterial({ color: 0xc6a05e }),
  )
  root.add(gun, flash, casing)
  return {
    sync(context: VictoryContext, pose: RihanPose) {
      const { age } = context
      for (const name of ['rihan-handgun', 'rihan-holstered-handgun']) {
        const native = context.hero.root.getObjectByName(name)
        if (native && ((age >= 330 && age < 480) || name === 'rihan-handgun')) {
          context.save(native)
          native.visible = false
        }
      }
      gun.position.copy(pose.hand)
      gun.quaternion.copy(orientation(pose.hand, pose.target))
      gun.rotateX((1 - ease((age - 330) / 42) + ease((age - 444) / 36)) * 0.85)
      gun.visible = age >= 330 && age < 480
      gun.updateWorldMatrix(true, true)
      const wrist = context.hero.root.getObjectByName('hand-right')!
      wrist.quaternion.copy(
        wrist.parent!.getWorldQuaternion(new T.Quaternion()).invert().multiply(gun.quaternion),
      )
      const muzzle = gun.localToWorld(new T.Vector3(0, 0.048, 0.18))
      const since = age - RIHAN_TIMING.shot
      flash.visible = since >= 0 && since < 3 && context.comfort.flashes
      flash.position.copy(muzzle)
      flash.scale.set(0.065, 0.065, 0.12)
      const t = Math.max(0, since) / 60
      const port = pose.aim.clone().add(new T.Vector3(0.04, 0.06, 0))
      casing.visible = since >= 0
      casing.position
        .copy(port)
        .add(new T.Vector3(t * 0.7, Math.max(-port.y + 0.015, 1.2 * t - 4.9 * t * t), t * 0.25))
      casing.rotation.set(t * 8, t * 11, t * 6)
      context.add(root)
      return {
        muzzle,
        shots: Number(since >= 0),
        barrelDirection: new T.Vector3(0, 0, 1).applyQuaternion(gun.quaternion),
        physicalShot: true,
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
