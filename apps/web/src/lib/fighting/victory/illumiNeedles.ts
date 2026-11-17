import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { IllumiVictoryPose } from './illumiPose'
import { illumiNeedleAnchor } from './illumiPose'
import { ILLUMI_IMPLANT, ILLUMI_NEEDLES } from './illumiVictim'
import { disposeVictoryObject, ease } from './resources'

export function createIllumiVictoryNeedles() {
  const root = new THREE.Group()
  root.name = 'illumi-victory-physical-needles'
  const metal = new THREE.MeshBasicMaterial({ color: 0xd5dce2 })
  const gold = new THREE.MeshBasicMaterial({ color: 0xe1c154 })
  const shaft = new THREE.CylinderGeometry(0.006, 0.006, 0.24, 7)
  const cap = new THREE.SphereGeometry(0.023, 12, 8)
  const needles = Array.from({ length: 3 }, () => {
    const pin = new THREE.Group()
    const stem = new THREE.Mesh(shaft, metal)
    stem.rotation.x = Math.PI / 2
    stem.position.z = 0.12
    const head = new THREE.Mesh(cap, gold)
    head.position.z = 0.24
    pin.add(stem, head)
    root.add(pin)
    return pin
  })
  return {
    root,
    sync(context: VictoryContext, pose: IllumiVictoryPose) {
      const { age } = context
      const contacts = [ILLUMI_IMPLANT, ...ILLUMI_NEEDLES]
      const errors: number[] = []
      needles.forEach((pin, i) => {
        const at = contacts[i],
          anchor = illumiNeedleAnchor(context, i)
        const t = ease((age - at + 12) / 12)
        pin.visible = i === 0 || age >= at - 12
        pin.position.copy(pose.grip).lerp(anchor.point, t)
        pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), anchor.outward)
        pin.scale.setScalar(anchor.scale)
        if (age < at) pin.position.addScaledVector(anchor.outward, 0.07 * (1 - t))
        pin.updateWorldMatrix(true, true)
        errors.push(pin.position.distanceTo(anchor.point))
      })
      return {
        anchors: needles.map((pin) => pin.position.toArray()),
        errors,
        embedded: contacts.filter((at) => age >= at).length,
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
