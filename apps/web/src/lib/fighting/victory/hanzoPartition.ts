import * as THREE from 'three'
import type { VictoryContext } from './types'
import { disposeVictoryObject } from './resources'

/** A solid, local set piece makes phasing visible in every arena without changing collisions. */
export function createHanzoPartition() {
  const root = new THREE.Group()
  root.name = 'hanzo-victory-solid-partition'
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 2.2, 1.05),
    new THREE.MeshBasicMaterial({ color: 0x313941 }),
  )
  panel.position.y = 1.1
  const rim = new THREE.LineSegments(
    new THREE.EdgesGeometry(panel.geometry),
    new THREE.LineBasicMaterial({ color: 0x78838a }),
  )
  rim.position.copy(panel.position)
  root.add(panel, rim)
  for (const y of [0.2, 1.1, 2]) {
    const seam = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.025, 1.07),
      new THREE.MeshBasicMaterial({ color: 0x59616a }),
    )
    seam.position.y = y
    root.add(seam)
  }
  const ripple = new THREE.Mesh(
    new THREE.RingGeometry(0.86, 1, 48),
    new THREE.MeshBasicMaterial({
      color: 0xb6dce5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  ripple.rotation.y = Math.PI / 2
  root.add(ripple)
  return {
    root,
    sync(context: VictoryContext, centre: THREE.Vector3, crossing: boolean) {
      root.position.set(context.centre - 0.2, 0, -0.13)
      ripple.visible = crossing && context.comfort.flashes
      ripple.position.set(0.071, Math.max(0.5, centre.y), 0)
      ripple.scale.set(0.4, 0.65, 1)
      return root.position.x
    },
    dispose: () => disposeVictoryObject(root),
  }
}
