import { documentPosition, paperBodyRef, samePaperBody } from './paperDocuments'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { PreparedEntity } from './preparationTypes'
import type { FightState } from './types'

/** The diagram and the pendulum use the same actual sheet and the same posed hand. */
export function paperDocumentWorldPoint(
  options: EffectSceneOptions,
  state: FightState,
  entry: PreparedEntity,
) {
  const point = documentPosition(state, entry)
  const result = new options.THREE.Vector3(
    options.worldX(point.x),
    options.worldY(point.y) + 0.015,
    0.48,
  )
  const holder = entry.document?.holder
  if (!holder || state[holder.owner].hanzoProjection) return result
  if (!samePaperBody(holder, paperBodyRef(state, holder.owner))) return result
  options
    .handAnchor?.(holder.owner, holder.hand === 'left' ? 'rear' : 'lead')
    ?.getWorldPosition(result)
  return result
}
