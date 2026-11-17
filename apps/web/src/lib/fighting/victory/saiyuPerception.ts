import * as THREE from 'three'
import type { VictoryContext } from './types'
import { disposeVictoryObject, ease } from './resources'

/** Visible sensory reactions borrow the native face and restore it after every draw. */
export function createSaiyuPerception() {
  const root = new THREE.Group()
  root.name = 'saiyu-victim-silent-cry'
  const cavity = new THREE.Mesh(
    new THREE.CircleGeometry(1, 40),
    new THREE.MeshBasicMaterial({ color: 0x25151c, side: THREE.DoubleSide }),
  )
  cavity.name = 'silent-open-mouth'
  const teeth = new THREE.Mesh(
    new THREE.PlaneGeometry(0.037, 0.008),
    new THREE.MeshBasicMaterial({ color: 0xf3e5ce, side: THREE.DoubleSide }),
  )
  const tongue = new THREE.Mesh(
    new THREE.CircleGeometry(1, 24),
    new THREE.MeshBasicMaterial({ color: 0x93545a, side: THREE.DoubleSide }),
  )
  tongue.scale.set(0.018, 0.008, 1)
  root.add(cavity, teeth, tongue)
  const unseeing = new THREE.MeshBasicMaterial({ color: 0xd9dfd8 })
  function eyes(context: VictoryContext) {
    if (context.age < 90 || context.age >= 360) return
    for (const side of ['left', 'right']) {
      const iris = context.victim.head
        .getObjectByName(`face-eye-${side}`)
        ?.getObjectByName('eye-pupil')
      if (!(iris instanceof THREE.Mesh)) continue
      context.material(iris, unseeing)
      for (const shine of iris.children) {
        context.save(shine)
        shine.visible = false
      }
      const brow = context.victim.head.getObjectByName(`face-brow-${side}`)
      if (brow) {
        context.save(brow)
        brow.rotation.z = (side === 'left' ? -1 : 1) * -0.23
      }
    }
  }
  return {
    root,
    sync(context: VictoryContext) {
      eyes(context)
      const { head } = context.victim
      const mouth = head.getObjectByName('face-mouth')
      const opening = ease((context.age - 234) / 8) * (1 - ease((context.age - 282) / 18))
      root.visible = opening > 0
      if (!mouth || !root.visible) return opening
      for (const name of ['face-mouth', 'saiyu-gritted-mouth']) {
        const original = head.getObjectByName(name)
        if (original) {
          context.save(original)
          original.visible = false
        }
      }
      head.updateWorldMatrix(true, true)
      root.position.copy(mouth.getWorldPosition(new THREE.Vector3()))
      root.quaternion.copy(head.getWorldQuaternion(new THREE.Quaternion()))
      root.scale.copy(head.getWorldScale(new THREE.Vector3()))
      root.translateZ(0.032)
      const height = (0.033 + Math.sin(context.age * 0.28) * 0.003) * opening
      cavity.scale.set(0.023, height, 1)
      teeth.position.set(0, height * 0.7, 0.001)
      tongue.position.set(0, -height * 0.63, 0.002)
      return opening
    },
    dispose() {
      disposeVictoryObject(root)
      unseeing.dispose()
    },
  }
}
