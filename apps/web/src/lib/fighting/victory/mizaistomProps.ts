import * as T from 'three'
import { buildCrossGameCage } from '../../tour/crossGameCageModel'
import type { VictoryContext } from './types'
import type { MizaistomPose } from './mizaistomPose'
import { disposeVictoryObject } from './resources'
import { visibleVictoryBounds } from './bodyBounds'

export function createMizaistomProps() {
  const root = new T.Group(),
    card = new T.Group()
  root.name = 'mizaistom-cross-game-verdict'
  const face = new T.Mesh(
    new T.BoxGeometry(0.14, 0.21, 0.008),
    new T.MeshBasicMaterial({ color: 0xf1ce49 }),
  )
  face.position.y = 0.085
  const reverse = new T.Group()
  reverse.position.set(0, 0.085, -0.008)
  const ink = new T.MeshBasicMaterial({ color: 0x191c21 })
  for (const lean of [-1, 1]) {
    const bar = new T.Mesh(new T.BoxGeometry(0.014, 0.16, 0.002), ink)
    bar.rotation.z = lean * 0.55
    reverse.add(bar)
  }
  card.add(face, reverse)
  const cage = buildCrossGameCage(T, { width: 1, height: 1, depth: 1 })
  root.add(card, cage)
  return {
    sync(context: VictoryContext, pose: MizaistomPose) {
      card.visible = context.age >= 18 && context.age < 480
      card.position.copy(pose.hand)
      card.quaternion.copy(context.hero.head.getWorldQuaternion(new T.Quaternion()))
      card.rotateY(pose.flip * Math.PI)
      cage.visible = pose.confined
      const bounds = visibleVictoryBounds(context.victim.root).expandByScalar(0.06)
      cage.position.copy(bounds.getCenter(new T.Vector3()))
      cage.scale.copy(bounds.getSize(new T.Vector3()))
      // Keep the enclosure fixed: no shrinking, slicing or lethal card effect.
      cage.material.opacity = 0.66
      context.add(root)
      return {
        cagePosition: cage.position.clone(),
        cageScale: cage.scale.clone(),
        cardPosition: card.position.clone(),
        cardFlip: pose.flip,
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
