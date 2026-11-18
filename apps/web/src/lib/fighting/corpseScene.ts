import type { PreparedEntity } from './preparationTypes'

/** The same material body lies still when its control needles are removed. */
export function posePreparedCorpse(
  root: import('three').Group,
  entry: PreparedEntity,
  seconds: number,
) {
  if (entry.kind !== 'corpse') return
  const controlled = entry.controller?.source === 'illumi'
  const angle = entry.owner === 'opponent' ? -Math.PI / 2 : Math.PI / 2
  root.rotation.z = controlled ? 0 : angle
  if (!controlled) poseLyingHead(root, angle)
  const needles = root.getObjectByName('corpse-control-needles')
  if (needles) needles.visible = Boolean(entry.corpseNeedles || controlled)
  if (controlled && entry.corpseOrder !== 'stay') root.rotation.z = Math.sin(seconds * 7) * 0.025
}

function poseLyingHead(root: import('three').Group, angle: number) {
  root.position.y += 0.2
  const head = root.userData.corpseHeadAnchor as { x: number; y: number } | undefined
  if (head)
    root.position.x -=
      Math.cos(angle) * head.x * root.scale.x - Math.sin(angle) * head.y * root.scale.y
}
