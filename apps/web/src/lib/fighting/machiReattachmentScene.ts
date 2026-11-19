import { forearmNode } from './severedForearms'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** Connect the thread to the real injured elbow, including after a figure cache rebuild. */
export function reattachmentPoint(options: EffectSceneOptions, state: FightState, side: FightSide) {
  const work = state[side].machiReattachment
  if (!work) return undefined
  const part = state.battlefield?.entities.find(
    (entry) => entry.id === work.entityId,
  )?.detachedForearm
  if (!part) return undefined
  const joint = options.figureOf?.(work.target)?.getObjectByName(forearmNode(part.part))
  return (
    joint?.getWorldPosition(new options.THREE.Vector3()) ??
    new options.THREE.Vector3(
      options.worldX(state[work.target].x),
      options.worldY(state[work.target].y) + 1,
      0.3,
    )
  )
}
