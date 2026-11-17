import { Box3, Vector3 } from 'three'
import type { Object3D } from 'three'
import { fighterDefinition } from '../roster'
import type { FighterId } from '../types'
import type { VictoryActor } from './types'

export function victoryActor(root: Object3D, id: FighterId): VictoryActor {
  const head =
    root.getObjectByName(`manga-head:${fighterDefinition(id).modelId}`) ??
    root.getObjectByName('kurapika-head') ??
    root.getObjectByName('face-mouth')?.parent ??
    root
  const shoulders = ['left', 'right'].map((side) =>
    root.getObjectByName(`shoulder-${side}`)?.getWorldPosition(new Vector3()),
  )
  const span = shoulders[0] && shoulders[1] ? shoulders[0].distanceTo(shoulders[1]) : 0.4
  const foot = root.getObjectByName('knee-left')?.children[1]
  const floor = foot ? new Box3().setFromObject(foot).min.y : root.position.y
  const height = Math.max(0.5, head.getWorldPosition(new Vector3()).y - floor + 0.16)
  return { root, head, height, width: Math.max(0.25, span + 0.16) }
}
function resetJoint(node: Object3D | undefined, save: (node: Object3D) => void) {
  if (!node) return
  save(node)
  node.rotation.set(0, 0, 0)
}
export function resetVictoryActor(actor: VictoryActor, save: (node: Object3D) => void) {
  const { root, head } = actor
  save(root)
  root.visible = true
  const chest = root.getObjectByName('fight-chest')
  resetJoint(chest, save)
  resetJoint(chest?.parent ?? undefined, save)
  resetJoint(head, save)
  if (chest) chest.position.set(0, 0, 0)
  for (const side of ['left', 'right']) {
    for (const joint of ['shoulder', 'elbow', 'hand', 'hip', 'knee'])
      resetJoint(root.getObjectByName(`${joint}-${side}`), save)
    resetJoint(root.getObjectByName(`knee-${side}`)?.children[1], save)
  }
  root.traverse((node) => {
    if (!node.name.startsWith('nen-')) return
    save(node)
    node.visible = false
  })
}
export function groundVictoryActor(actor: VictoryActor) {
  const feet = ['left', 'right']
    .map((side) => actor.root.getObjectByName(`knee-${side}`)?.children[1])
    .filter((node): node is Object3D => Boolean(node))
  actor.root.updateWorldMatrix(true, true)
  if (!feet.length) return
  const floor = Math.min(...feet.map((node) => new Box3().setFromObject(node).min.y))
  actor.root.position.y -= floor
  actor.root.updateWorldMatrix(true, true)
}
