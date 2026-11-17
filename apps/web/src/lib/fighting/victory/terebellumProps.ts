import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { TerebellumVictoryPose } from './terebellumPose'
import { disposeVictoryObject, ease } from './resources'

function makeCan() {
  const root = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.2, 24, 8),
    new THREE.MeshStandardMaterial({ color: 0xa78748, roughness: 0.65, metalness: 0.1 }),
  )
  const original = Float32Array.from(body.geometry.attributes.position.array)
  root.add(body)
  for (const y of [-0.1, 0.1]) {
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.063, 0.006, 6, 24),
      new THREE.MeshBasicMaterial({ color: 0xc1c6c6 }),
    )
    rim.rotation.x = Math.PI / 2
    rim.position.y = y
    root.add(rim)
  }
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.007, 24),
    new THREE.MeshBasicMaterial({ color: 0x9fa5a4 }),
  )
  lid.position.y = 0.1
  const opening = new THREE.Mesh(
    new THREE.SphereGeometry(1, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0x252521 }),
  )
  opening.scale.set(0.022, 0.004, 0.034)
  opening.position.set(0, 0.105, -0.022)
  const scar = new THREE.Mesh(
    new THREE.SphereGeometry(1, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0x49232b }),
  )
  scar.scale.set(0.025, 0.035, 0.009)
  scar.position.set(0, 0.005, 0.06)
  root.add(lid, opening, scar)
  return { root, body, original, scar }
}
function makeKnife() {
  const root = new THREE.Group()
  const blade = new THREE.Mesh(
    new THREE.ConeGeometry(0.035, 0.22, 4),
    new THREE.MeshStandardMaterial({ color: 0xc8cfd1, metalness: 0.1, roughness: 0.3 }),
  )
  blade.rotation.x = Math.PI / 2
  blade.position.z = 0.18
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.045, 0.12),
    new THREE.MeshBasicMaterial({ color: 0x2c3036 }),
  )
  handle.position.z = 0.025
  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.035, 0.022),
    new THREE.MeshBasicMaterial({ color: 0x93999b }),
  )
  guard.position.z = 0.08
  root.add(blade, handle, guard)
  return root
}
function bloodMark() {
  const mark = new THREE.Mesh(
    new THREE.SphereGeometry(1, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0x7c2e35 }),
  )
  mark.scale.set(0.012, 0.022, 0.007)
  return mark
}
export function createTerebellumProps() {
  const root = new THREE.Group(),
    can = makeCan(),
    knife = makeKnife()
  const stand = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 1, 0.3),
    new THREE.MeshBasicMaterial({ color: 0x30373b }),
  )
  const headMark = bloodMark(),
    torsoMark = bloodMark()
  root.name = 'sweet-home-same-knife-and-can'
  root.add(stand, can.root, knife, headMark, torsoMark)
  return {
    root,
    sync(context: VictoryContext, pose: TerebellumVictoryPose) {
      const { age } = context
      can.root.position.copy(pose.can)
      can.root.quaternion.copy(pose.canRotation)
      const damage = ease((age - 120) / 6)
      const attr = can.body.geometry.attributes.position
      for (let i = 0; i < attr.count; i++) {
        const x = can.original[i * 3],
          y = can.original[i * 3 + 1],
          z = can.original[i * 3 + 2]
        const dent = damage * Math.exp(-y * y * 700) * Math.max(0, z) * 0.65
        attr.setXYZ(i, x * (1 - damage * 0.12), y, z - dent)
      }
      attr.needsUpdate = true
      can.body.geometry.computeVertexNormals()
      can.scar.visible = age >= 120
      stand.position.copy(pose.stand).add(new THREE.Vector3(0, -pose.stand.y / 2 - 0.11, 0))
      stand.scale.y = pose.stand.y
      let tip = pose.attackerTip,
        direction = pose.attackDirection
      if (age >= 120 && age < 204) {
        tip = pose.canTip
        direction = pose.canDirection
      }
      if (age >= 360) {
        tip = pose.victimHead
        direction = pose.victimDirection
      }
      knife.position.copy(tip).addScaledVector(direction, -0.29)
      knife.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction)
      headMark.visible = age >= 360
      headMark.position.copy(pose.victimHead)
      headMark.quaternion.copy(context.victim.head.getWorldQuaternion(new THREE.Quaternion()))
      torsoMark.visible = age >= 240
      torsoMark.position.copy(
        context.victim.root.getObjectByName('torso')!.localToWorld(pose.recipientLocal.clone()),
      )
      context.add(root)
      const actualTip = knife.localToWorld(new THREE.Vector3(0, 0, 0.29))
      return {
        knifeError: actualTip.distanceTo(tip),
        canDamaged: damage === 1,
        canTransfer: age >= 120 && age < 204,
        finalTransfer: age >= 360,
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
