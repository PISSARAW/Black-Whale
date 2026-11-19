import { documentById } from './paperDocuments'
import { paperDocumentWorldPoint } from './paperDocumentAnchor'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** A visible physical tip may reveal a point on a sheet, never the private search subject. */
export function dowsingMapContact(options: EffectSceneOptions, state: FightState, side: FightSide) {
  const pose = state[side].dowsingMapPose
  const entry = documentById(state, pose?.mapId)
  if (!pose || !entry) return undefined
  const result = paperDocumentWorldPoint(options, state, entry)
  const point = pose.point ?? { x: 0.5 + Math.sin(state.frame * 0.14) * 0.1, y: 0.5 }
  result.x += (point.x - 0.5) * 0.24
  if (entry.document?.holder) {
    result.y += (point.y - 0.5) * 0.32
    result.z += 0.07
  } else {
    result.y += 0.08
    result.z -= (point.y - 0.5) * 0.32
  }
  return result
}
