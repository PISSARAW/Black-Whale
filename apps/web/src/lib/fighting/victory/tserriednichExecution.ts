import {
  AdditiveBlending,
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import type { Object3D } from 'three'
import { disposeVictoryObject } from './resources'

export function createFuturePistol() {
  const root = new Group()
  root.name = 'tserriednich-cinematic-physical-pistol'
  const metal = new MeshBasicMaterial({ color: 0x4c4d50 }),
    dark = new MeshBasicMaterial({ color: 0x191b20 })
  const slide = new Mesh(new BoxGeometry(0.043, 0.043, 0.18), metal)
  slide.position.set(0, 0.048, 0.06)
  const grip = new Mesh(new BoxGeometry(0.038, 0.078, 0.052), dark)
  grip.position.set(0, 0.002, -0.004)
  grip.rotation.x = -0.2
  const barrel = new Mesh(new CylinderGeometry(0.009, 0.009, 0.035, 10), dark)
  barrel.rotation.x = Math.PI / 2
  barrel.position.set(0, 0.048, 0.163)
  root.add(slide, grip, barrel)
  return root
}
export function createFutureExecution() {
  const root = new Group(),
    gun = createFuturePistol()
  root.name = 'tserriednich-future-execution'
  const fire = new Mesh(
    new SphereGeometry(0.055, 12, 8),
    new MeshBasicMaterial({
      color: 0xffdc94,
      transparent: true,
      opacity: 0.9,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  )
  const tracer = new Mesh(
    new CylinderGeometry(0.003, 0.003, 1, 6),
    new MeshBasicMaterial({ color: 0xe8ce91, transparent: true, opacity: 0.9 }),
  )
  const impact = new Mesh(
    new SphereGeometry(0.045, 10, 6),
    new MeshBasicMaterial({
      color: 0xffddbb,
      transparent: true,
      opacity: 0.7,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  )
  root.add(gun, fire, tracer, impact)
  return {
    root,
    sync({
      wrist,
      aim,
      shotAge,
      raise,
    }: {
      wrist: Object3D
      aim: Vector3
      shotAge: number
      raise: number
    }) {
      gun.position.copy(wrist.getWorldPosition(new Vector3()))
      const direction = aim.clone().sub(gun.position)
      const barrelDirection = new Vector3(0, -1, -0.08).lerp(direction.clone().normalize(), raise)
      gun.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), barrelDirection.normalize())
      gun.updateWorldMatrix(true, true)
      const muzzle = gun.localToWorld(new Vector3(0, 0.048, 0.18))
      const since = shotAge * 60
      const flash = since >= 0 && since < 2
      fire.visible = flash
      fire.position.copy(muzzle)
      const flame = Math.max(0, 1 - Math.max(0, since) * 0.4)
      fire.quaternion.copy(gun.quaternion)
      fire.scale.set(0.78 * flame, 0.78 * flame, 1.85 * flame)
      impact.visible = since >= 0 && since < 4
      impact.position.copy(aim)
      impact.scale.setScalar(Math.max(0, 1 - Math.max(0, since) * 0.18))
      tracer.visible = since >= 0 && since < 2
      direction.copy(aim).sub(muzzle)
      tracer.position.copy(muzzle).lerp(aim, 0.5)
      tracer.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize())
      tracer.scale.y = direction.length()
      const recoil = since >= 0 ? Math.max(0, 1 - since / 5) * 0.012 : 0
      gun.position.addScaledVector(direction.normalize(), -recoil)
    },
    dispose() {
      disposeVictoryObject(root)
    },
  }
}
