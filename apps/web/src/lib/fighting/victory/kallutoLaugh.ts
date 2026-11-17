import {
  CircleGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from 'three'
import type { VictoryContext } from './types'
import { disposeVictoryObject } from './resources'

export function createKallutoTaunt() {
  const root = new Group()
  root.name = 'kalluto-target-laugh'
  const mouth = new Mesh(new CircleGeometry(1, 24), new MeshBasicMaterial({ color: 0x25171b }))
  const teeth = new Mesh(
    new PlaneGeometry(0.043, 0.006),
    new MeshBasicMaterial({ color: 0xeee7dc }),
  )
  teeth.position.set(0, 0.006, 0.001)
  root.add(mouth, teeth)
  return {
    root,
    sync(context: VictoryContext, laugh: number) {
      const source = context.victim.head.getObjectByName('face-mouth')
      root.visible = Boolean(source) && laugh > 0.01
      if (!source || !root.visible) return
      context.save(source)
      source.visible = false
      const q = context.victim.head.getWorldQuaternion(new Quaternion())
      const size = context.victim.head.getWorldScale(new Vector3()).x
      root.position
        .copy(source.getWorldPosition(new Vector3()))
        .add(new Vector3(0, 0, 0.006 * size).applyQuaternion(q))
      root.quaternion.copy(q)
      root.scale.setScalar(size)
      mouth.scale.set(0.03, (0.012 + Math.sin(context.age * 0.23) * 0.003) * laugh, 1)
      for (const side of ['left', 'right']) {
        const eye = context.victim.head.getObjectByName(`face-eye-${side}`)
        if (!eye) continue
        context.save(eye)
        eye.scale.y *= 1 - laugh * 0.22
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
