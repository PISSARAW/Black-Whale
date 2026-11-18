import type { PreparedEntity } from './preparationTypes'

/** The same material body lies still when its control needles are removed. */
export function posePreparedCorpse(
  root: import('three').Group,
  entry: PreparedEntity,
  seconds: number,
) {
  if (entry.kind !== 'corpse') return
  const controlled = entry.controller?.source === 'illumi'
  root.rotation.z = controlled ? 0 : Math.PI / 2
  root.position.y += controlled ? 0 : 0.2
  const needles = root.getObjectByName('corpse-control-needles')
  if (needles) needles.visible = controlled
  if (controlled && entry.corpseOrder !== 'stay') root.rotation.z = Math.sin(seconds * 7) * 0.025
}
