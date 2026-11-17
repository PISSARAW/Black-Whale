import * as T from 'three'
import type { VictoryContext } from './types'
import { disposeVictoryObject } from './resources'
import { fightStage } from '../stages'

export function createZakuroImpact() {
  const root = new T.Group(),
    cracks = new T.Group()
  const dark = new T.LineBasicMaterial({ color: 0x1b1117 })
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6
    const points = [
      new T.Vector3(0, 0.018, 0),
      new T.Vector3(Math.cos(angle) * 0.5, 0.018, Math.sin(angle) * 0.5),
      new T.Vector3(Math.cos(angle + 0.1) * 0.95, 0.018, Math.sin(angle + 0.1) * 0.95),
    ]
    cracks.add(new T.Line(new T.BufferGeometry().setFromPoints(points), dark))
  }
  const ring = new T.Mesh(
    new T.TorusGeometry(1, 0.014, 6, 48),
    new T.MeshBasicMaterial({ color: 0x7b303b, transparent: true, opacity: 0.7 }),
  )
  ring.rotation.x = Math.PI / 2
  const material = new T.MeshBasicMaterial({ color: 0x77665e })
  const shards = Array.from(
    { length: 12 },
    () => new T.Mesh(new T.BoxGeometry(0.05, 0.035, 0.08), material),
  )
  root.add(cracks, ring, ...shards)
  return {
    sync(context: VictoryContext) {
      const { age } = context
      const since = age >= 396 ? age - 396 : age - 324
      const t = Math.max(0, since) / 60
      root.position.set(context.victim.root.position.x, 0, 0)
      root.visible = age >= 324
      cracks.scale.setScalar(age >= 396 ? 1.4 : 0.8)
      ring.position.y = 0.025
      ring.visible = since >= 0 && since < 24
      ring.scale.setScalar(0.25 + t * 3)
      ring.material.opacity = Math.max(0, 0.6 * (1 - t / 0.4))
      material.color
        .set(fightStage(context.state.environment.stageId).swatch[0])
        .lerp(new T.Color(0xb3a398), 0.5)
      shards.forEach((shard, i) => {
        const angle = i * 2.399
        shard.position.set(
          Math.cos(angle) * (0.1 + t),
          Math.max(0.025, t * (1.3 + (i % 3) * 0.3) - 4.9 * t * t),
          Math.sin(angle) * (0.1 + t),
        )
        shard.rotation.set(t * ((i % 3) + 1), t * 5, t * 3)
        shard.visible = age < 486
      })
      context.add(root)
    },
    dispose: () => disposeVictoryObject(root),
  }
}
