import * as T from 'three'
import type { VictoryContext } from './types'
import type { LuiniPose } from './luiniPose'
import { disposeVictoryObject, ease } from './resources'

export function createLuiniBlade() {
  const root = new T.Group(),
    knife = new T.Group()
  const metal = new T.MeshBasicMaterial({ color: 0xbfc9d3 }),
    dark = new T.MeshBasicMaterial({ color: 0x26272c })
  const grip = new T.Mesh(new T.BoxGeometry(0.04, 0.045, 0.13), dark)
  const guard = new T.Mesh(new T.BoxGeometry(0.11, 0.025, 0.025), metal)
  guard.position.z = 0.07
  const blade = new T.Mesh(new T.BoxGeometry(0.035, 0.012, 0.28), metal)
  blade.position.z = 0.22
  const point = new T.Mesh(new T.ConeGeometry(0.022, 0.09, 4), metal)
  point.rotation.x = Math.PI / 2
  point.position.z = 0.405
  const stain = new T.Mesh(
    new T.BoxGeometry(0.028, 0.013, 0.13),
    new T.MeshBasicMaterial({ color: 0x7f2336 }),
  )
  stain.position.z = 0.32
  knife.add(grip, guard, blade, point, stain)
  root.name = 'luini-cinematic-physical-blade'
  root.add(knife)
  return {
    sync(context: VictoryContext, pose: LuiniPose) {
      const native = context.hero.root.getObjectByName('luini-physical-knife')
      if (native) {
        context.save(native)
        native.visible = false
      }
      const aim = new T.Vector3(0, -1, 0).lerp(pose.direction, pose.stab).normalize()
      knife.position.copy(pose.hand)
      knife.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), aim)
      knife.visible = context.hero.root.visible
      stain.visible = context.age >= 396
      context.add(root)
      knife.updateWorldMatrix(true, true)
      const tip = knife.localToWorld(new T.Vector3(0, 0, 0.45))
      return { tip, bladeDirection: aim, physicalBlade: true, stain: ease((context.age - 396) / 8) }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
