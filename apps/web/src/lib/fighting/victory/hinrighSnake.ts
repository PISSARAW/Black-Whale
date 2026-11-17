import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { HinrighVictoryPose } from './hinrighPose'
import { HINRIGH_SHOT } from './hinrighPose'
import { disposeVictoryObject, ease } from './resources'

function snakeGun() {
  const root = new THREE.Group(),
    animal = new THREE.Group(),
    pistol = new THREE.Group()
  const metal = new THREE.MeshBasicMaterial({ color: 0x383e43 })
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.1, 0.38), metal)
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.11), metal)
  grip.position.set(0, -0.11, -0.09)
  grip.rotation.x = -0.2
  pistol.add(slide, grip)
  const skin = new THREE.MeshStandardMaterial({ color: 0x718466, roughness: 0.6 })
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), skin)
  head.scale.set(0.1, 0.075, 0.18)
  animal.add(head)
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xdcb156 }),
    )
    eye.position.set(side * 0.085, 0.035, 0.07)
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0x080d09 }),
    )
    pupil.scale.set(0.25, 1, 0.4)
    pupil.position.set(side * 0.107, 0.04, 0.07)
    animal.add(eye, pupil)
  }
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 14), metal)
  barrel.rotation.x = Math.PI / 2
  barrel.position.z = 0.2
  const muzzle = new THREE.Mesh(
    new THREE.CircleGeometry(0.026, 16),
    new THREE.MeshBasicMaterial({ color: 0x060809, side: THREE.DoubleSide }),
  )
  muzzle.position.z = 0.322
  const jaw = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 10),
    new THREE.MeshStandardMaterial({ color: 0xa5ae82, roughness: 0.75 }),
  )
  jaw.scale.set(0.085, 0.025, 0.15)
  jaw.position.set(0, -0.056, 0.025)
  animal.add(jaw)
  root.add(pistol, animal, barrel, muzzle)
  return { root, animal, pistol }
}
export function createHinrighSnake() {
  const root = new THREE.Group(),
    gun = snakeGun()
  const body = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshStandardMaterial({ color: 0x5c7054, roughness: 0.65 }),
  )
  const bands = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x344735, roughness: 0.8 }),
    20,
  )
  const marker = new THREE.Object3D()
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(1, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe9a5 }),
  )
  const trail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 1, 7),
    new THREE.MeshBasicMaterial({ color: 0xffd38b }),
  )
  root.name = 'biohazard-ordinary-pistol-snake'
  root.add(gun.root, body, bands, flash, trail)
  return {
    root,
    sync(context: VictoryContext, pose: HinrighVictoryPose) {
      const { age } = context
      const morph = ease((age - 78) / 30),
        travel = ease((age - 114) / 168)
      const origin = pose.origin.clone().add(new THREE.Vector3(0.25, 0.15, 0))
      const endpoint = pose.target.clone().add(new THREE.Vector3(0.5, 0.1, 0.65))
      const head = origin.clone().lerp(endpoint, travel)
      head.y -= Math.sin(Math.PI * travel) * 0.75
      const returning = ease((age - 390) / 54)
      const dropped = new THREE.Vector3(
        context.victim.root.position.x + 0.35,
        0.13,
        context.victim.root.position.z + 0.3,
      )
      head.lerp(dropped, returning)
      gun.root.position.copy(head)
      gun.root.lookAt(pose.target)
      if (returning === 1) gun.root.rotation.set(0, 0, -Math.PI / 2)
      gun.animal.visible = morph > 0 && returning < 1
      gun.animal.scale.setScalar(Math.max(0.001, morph * (1 - returning)))
      gun.pistol.visible = morph < 1 || returning > 0
      gun.pistol.scale.setScalar(Math.max(0.001, Math.max(1 - morph, returning)))
      const coil = head
        .clone()
        .add(new THREE.Vector3(-0.32, -0.05, 0))
        .lerp(pose.wrists[1], ease((travel - 0.5) / 0.5))
        .lerp(dropped, returning)
      const back = gun.root.localToWorld(new THREE.Vector3(0, 0, -0.12))
      const points = Array.from({ length: 21 }, (_, i) => {
        const t = i / 20
        const point = back.clone().lerp(coil, t)
        const envelope = Math.sin(Math.PI * t)
        point.add(
          new THREE.Vector3(
            Math.sin(t * Math.PI * 3) * 0.15 * envelope,
            Math.sin(t * Math.PI * 2) * 0.2 * envelope,
            Math.sin(t * Math.PI * 4) * 0.14 * envelope,
          ),
        )
        return point.lerp(back.clone().add(new THREE.Vector3(0, 0, -t * 0.01)), returning)
      })
      const curve = new THREE.CatmullRomCurve3(points)
      body.geometry.dispose()
      body.geometry = new THREE.TubeGeometry(curve, 64, 0.04, 8, false)
      body.visible = morph > 0 && returning < 1
      bands.visible = body.visible
      for (let i = 0; i < bands.count; i++) {
        marker.position.copy(curve.getPointAt(i / bands.count)).add(new THREE.Vector3(0, 0.033, 0))
        marker.scale.set(0.04, 0.009, 0.032)
        marker.updateMatrix()
        bands.setMatrixAt(i, marker.matrix)
      }
      bands.instanceMatrix.needsUpdate = true
      bands.computeBoundingSphere()
      const muzzle = gun.root.localToWorld(new THREE.Vector3(0, 0, 0.322))
      const direction = pose.target.clone().sub(muzzle)
      const firing = age >= HINRIGH_SHOT && age < HINRIGH_SHOT + 5
      flash.visible = firing && context.comfort.flashes
      flash.position.copy(muzzle)
      flash.scale.set(0.075, 0.075, 0.22)
      flash.quaternion.copy(gun.root.quaternion)
      trail.visible = firing
      trail.position.copy(muzzle).lerp(pose.target, 0.5)
      trail.scale.y = direction.length()
      trail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
      context.add(root)
      return {
        muzzle,
        span: head.distanceTo(coil),
        direction: new THREE.Vector3(0, 0, 1).applyQuaternion(gun.root.quaternion),
        target: pose.target,
        fired: age >= HINRIGH_SHOT,
        morph,
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
