import * as T from 'three'
import { fightStage } from '../stages'
import type { VictoryContext } from './types'
import type { MizaistomPose } from './mizaistomPose'
import { MIZAISTOM_TIMING } from './mizaistomTrack'
import { disposeVictoryObject } from './resources'

/** Ordinary breakaway scenery, present before the warning; never a Nen attack. */
export function createMizaistomPanel() {
  const root = new T.Group(),
    frame = new T.Group(),
    pieces = new T.Group()
  const metal = new T.MeshBasicMaterial({ color: 0x41454b })
  const face = new T.MeshBasicMaterial({ color: 0x655849 })
  const geometry = new T.BoxGeometry(1, 1, 1)
  for (const side of [-1, 1]) {
    const post = new T.Mesh(geometry, metal)
    post.position.z = side * 0.8
    post.scale.set(0.14, 1, 0.1)
    frame.add(post)
  }
  for (let i = 0; i < 16; i++) pieces.add(new T.Mesh(geometry, face))
  root.add(frame, pieces)
  const dust = new T.InstancedMesh(
    new T.SphereGeometry(1, 8, 6),
    new T.MeshBasicMaterial({
      color: 0xa9a098,
      transparent: true,
      opacity: 0.17,
      depthWrite: false,
    }),
    20,
  )
  const dummy = new T.Object3D()
  root.add(dust)
  return {
    sync(context: VictoryContext, pose: MizaistomPose) {
      const height = Math.max(1.6, context.victim.height + 0.2)
      const t = Math.max(0, context.age - MIZAISTOM_TIMING.panel) / 60
      root.position.x = pose.panelX
      root.visible = context.age < MIZAISTOM_TIMING.portrait
      frame.position.y = height / 2
      frame.scale.y = height
      face.color
        .set(fightStage(context.state.environment.stageId).swatch[0])
        .lerp(new T.Color(0x9c8a73), 0.55)
      pieces.children.forEach((piece, i) => {
        const y = ((Math.floor(i / 4) + 0.5) * height) / 4
        const z = ((i % 4) - 1.5) * 0.38
        piece.position.set(
          t * (1.5 + (i % 3)),
          Math.max(0.05, y + t * 0.6 - t * t * 4.9),
          z + t * ((i % 4) - 1.5),
        )
        piece.rotation.set(t * ((i % 3) + 1), t * (i % 2 ? 3 : -3), t * 1.5)
        piece.scale.set(0.09, height / 4 - 0.01, 0.37)
      })
      dust.visible = context.age >= MIZAISTOM_TIMING.panel && t < 1.1
      for (let i = 0; i < dust.count; i++) {
        const angle = i * 2.399
        dummy.position.set(
          t * (0.4 + i * 0.03),
          height * 0.45 + Math.sin(angle) * t,
          Math.cos(angle) * t,
        )
        dummy.scale.setScalar(0.08 + t * 0.18)
        dummy.updateMatrix()
        dust.setMatrixAt(i, dummy.matrix)
      }
      dust.instanceMatrix.needsUpdate = true
      dust.computeBoundingSphere()
      context.add(root)
      return {
        physicalPanel: true,
        broken: context.age >= MIZAISTOM_TIMING.panel,
        impactFrame: MIZAISTOM_TIMING.panel,
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
