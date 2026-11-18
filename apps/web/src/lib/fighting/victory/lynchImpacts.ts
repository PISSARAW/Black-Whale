import * as T from 'three'
import type { VictoryContext } from './types'
import type { LynchPose } from './lynchPose'
import { disposeVictoryObject } from './resources'
import { LYNCH_CONTACTS } from './lynchTiming'

export function createLynchImpacts() {
  const root = new T.Group()
  const material = new T.MeshBasicMaterial({
    color: 0xf5dcb2,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  })
  const wave = new T.Mesh(new T.TorusGeometry(0.16, 0.008, 6, 36), material)
  const rays = Array.from({ length: 12 }, (_, i) => {
    const ray = new T.Mesh(new T.BoxGeometry(0.005, 0.15, 0.005), material)
    const a = (i * Math.PI) / 6
    ray.position.set(Math.sin(a) * 0.24, Math.cos(a) * 0.24, 0)
    ray.rotation.z = -a
    return ray
  })
  root.name = 'lynch-fist-pressure'
  root.add(wave, ...rays)
  return {
    sync(context: VictoryContext, pose: LynchPose) {
      const delta = context.age - pose.beat.contact
      root.visible = delta >= 0 && delta < 12 && context.comfort.flashes
      root.position.copy(pose.contact)
      root.quaternion.copy(context.camera.quaternion)
      root.scale.setScalar((pose.beat.index === 6 ? 1.8 : 1) * (0.4 + Math.max(0, delta) / 9))
      material.opacity = Math.max(0, 0.9 * (1 - delta / 12))
      context.add(root)
      return { impacts: LYNCH_CONTACTS.filter((frame) => context.age >= frame).length }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
