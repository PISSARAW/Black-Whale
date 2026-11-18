import * as T from 'three'
import type { VictoryContext } from './types'
import type { ThetaVictoryPose } from './thetaPose'
import { THETA_TIMING } from './thetaPose'
import { disposeVictoryObject, ease } from './resources'

const slideTravel = (since: number) => (since >= 0 ? Math.max(0, 1 - since / 10) * 0.035 : 0)

function pistolOrientation(hand: T.Vector3, target: T.Vector3) {
  const delta = target.clone().sub(hand)
  const along = Math.sqrt(Math.max(0.001, delta.lengthSq() - 0.065 ** 2))
  return new T.Quaternion().setFromUnitVectors(
    new T.Vector3(0, 0.065, along).normalize(),
    delta.normalize(),
  )
}

export function createThetaGun() {
  const root = new T.Group(),
    gun = new T.Group()
  root.name = 'theta-last-chamber'
  const steel = new T.MeshStandardMaterial({ color: 0x222c36, metalness: 0.1, roughness: 0.82 })
  const black = new T.MeshStandardMaterial({ color: 0x151b24, roughness: 0.65 })
  const brass = new T.MeshStandardMaterial({ color: 0xe6bb60, metalness: 0.7, roughness: 0.26 })
  const slide = new T.Mesh(new T.BoxGeometry(0.065, 0.065, 0.25), steel)
  slide.position.set(0, 0.065, 0.085)
  const grip = new T.Mesh(new T.BoxGeometry(0.06, 0.12, 0.07), black)
  grip.position.y = -0.02
  grip.rotation.x = -0.15
  const bore = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.025, 14), black)
  bore.rotation.x = Math.PI / 2
  bore.position.set(0, 0.065, 0.22)
  const trigger = new T.Mesh(new T.TorusGeometry(0.028, 0.005, 6, 12), steel)
  trigger.rotation.y = Math.PI / 2
  trigger.position.set(0, -0.01, 0.07)
  const loaded = new T.Mesh(new T.CylinderGeometry(0.009, 0.009, 0.028, 10), brass)
  loaded.rotation.x = Math.PI / 2
  loaded.position.set(0.034, 0.07, 0.05)
  gun.add(slide, grip, bore, trigger, loaded)
  const magazine = new T.Mesh(new T.BoxGeometry(0.043, 0.12, 0.055), steel)
  const casing = new T.Mesh(new T.CylinderGeometry(0.011, 0.011, 0.034, 12), brass)
  const flash = new T.Mesh(
    new T.SphereGeometry(1, 12, 8),
    new T.MeshBasicMaterial({
      color: 0xffe7b2,
      blending: T.AdditiveBlending,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }),
  )
  const smoke = new T.Mesh(
    new T.SphereGeometry(1, 12, 8),
    new T.MeshBasicMaterial({
      color: 0xb1b5ba,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    }),
  )
  root.add(gun, magazine, casing, flash, smoke)
  return {
    sync(context: VictoryContext, pose: ThetaVictoryPose) {
      const { age } = context
      gun.position.copy(pose.hand)
      gun.quaternion.copy(pistolOrientation(pose.hand, pose.target))
      if (age < 288) gun.rotateX(0.75 * (1 - pose.stock))
      if (pose.stock > 0) gun.rotateX(-Math.PI * 0.5 * pose.stock)
      if (age > 444) gun.rotateX(ease((age - 444) / 42) * 0.85)
      gun.updateWorldMatrix(true, true)
      const wrist = context.hero.root.getObjectByName('hand-right')!
      wrist.quaternion.copy(
        wrist.parent!.getWorldQuaternion(new T.Quaternion()).invert().multiply(gun.quaternion),
      )
      loaded.visible = age < THETA_TIMING.shot
      const since = age - THETA_TIMING.shot
      slide.position.z = 0.085 - slideTravel(since)
      const muzzle = gun.localToWorld(new T.Vector3(0, 0.065, 0.235))
      const drop = Math.max(0, (age - THETA_TIMING.magazine) / 60)
      magazine.position.copy(pose.magazineGrip)
      if (age >= THETA_TIMING.magazine) {
        magazine.position.copy(pose.magazineOrigin)
        magazine.position.y = Math.max(0.04, pose.magazineOrigin.y - drop * drop * 4.9)
      }
      magazine.rotation.set(Math.min(1.5, drop * 4), 0.3, 0.15)
      magazine.visible = age >= 30
      // A fixed emission pose makes arbitrary seek order and replay deterministic.
      const frozen = new T.Vector3(0.045, 0.075, 0.03)
        .applyQuaternion(pistolOrientation(pose.emission, pose.target))
        .add(pose.emission)
      casing.visible = since >= 0
      if (since >= 0) {
        const t = since < 36 ? since / 360 : 0.1 + (since - 36) / 60
        casing.position
          .copy(frozen)
          .add(new T.Vector3(t * 0.9, Math.max(-frozen.y + 0.014, t * 1.6 - 4.9 * t * t), t * 0.3))
        casing.rotation.set(t * 9, t * 6, 0.8 + t * 5)
      }
      flash.visible = since >= 0 && since < 3 && context.comfort.flashes
      flash.position.copy(muzzle)
      flash.quaternion.copy(gun.quaternion)
      flash.scale.set(0.075, 0.075, 0.17)
      smoke.visible = since >= 0 && since < 90
      smoke.position.copy(muzzle).add(new T.Vector3(0, Math.max(0, since) * 0.002, 0))
      smoke.scale.setScalar(0.025 + Math.max(0, since) * 0.0015)
      smoke.material.opacity = Math.max(0, 0.17 * (1 - Math.max(0, since) / 90))
      context.add(root)
      return {
        muzzle,
        barrelDirection: new T.Vector3(0, 0, 1).applyQuaternion(gun.quaternion),
        casing: casing.position.clone(),
        magazine: magazine.position.clone(),
        chambered: age < THETA_TIMING.shot,
        magazineRemoved: age >= 54,
        shots: Number(age >= THETA_TIMING.shot),
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
