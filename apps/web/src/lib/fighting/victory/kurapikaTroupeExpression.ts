import * as THREE from 'three'
import type { VictoryContext } from './types'
import { disposeVictoryObject } from './resources'

/** Skin lids mask the upper iris instead of stretching the original face or mouth. */
export function createKurapikaTroupeExpression() {
  const root = new THREE.Group()
  root.name = 'kurapika-scarlet-anger'
  const skin = new THREE.MeshBasicMaterial({ color: 0xf2dfc0, side: THREE.DoubleSide })
  for (const sign of [-1, 1]) {
    const lid = new THREE.Mesh(new THREE.PlaneGeometry(0.088, 0.058), skin)
    lid.position.set(sign * 0.067, 0.034, 0.129)
    lid.rotation.set(0, sign * 0.1, sign * 0.24)
    root.add(lid)
  }
  return {
    root,
    sync(context: VictoryContext) {
      const { head } = context.hero
      const face = head.getObjectByName('kurapika-face')?.children[1]
      if (face instanceof THREE.Mesh && face.material instanceof THREE.MeshBasicMaterial)
        skin.color.copy(face.material.color)
      for (const [side, sign] of [
        ['left', -1],
        ['right', 1],
      ] as const) {
        const brow = head.getObjectByName(`face-brow-${side}`)
        if (brow) {
          context.save(brow)
          brow.rotation.z = sign * 0.24
          brow.position.y = 0.027
          brow.position.z = 0.133
        }
      }
      head.updateWorldMatrix(true, true)
      root.position.copy(head.getWorldPosition(new THREE.Vector3()))
      root.quaternion.copy(head.getWorldQuaternion(new THREE.Quaternion()))
      root.scale.copy(head.getWorldScale(new THREE.Vector3()))
    },
    dispose: () => disposeVictoryObject(root),
  }
}
