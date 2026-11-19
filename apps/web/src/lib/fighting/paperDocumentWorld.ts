import { documentPosition, cleanDocumentMatter } from './paperDocuments'
import type { PreparedEntity } from './preparationTypes'
import type { FightState } from './types'

/** Physical movement advances on ordinary simulation frames; copy expiry has its own clock. */
export function advanceDocumentWorld(state: FightState): FightState {
  const field = state.battlefield
  if (!field?.entities.some((entry) => entry.document)) return state
  const entities = field.entities.map((entry) => advanceDocument(state, entry))
  return entities.some((entry, index) => entry !== field.entities[index])
    ? { ...state, battlefield: { ...field, entities } }
    : state
}

function advanceDocument(state: FightState, entry: PreparedEntity): PreparedEntity {
  if (!entry.document) return entry
  const cleaned = cleanDocumentMatter(state, entry)
  if (!cleaned.present || cleaned.health <= 0) return cleaned
  const paper = cleaned.document!
  if (paper.holder) {
    const point = documentPosition(state, cleaned)
    return point.x === cleaned.x && point.y === cleaned.y ? cleaned : { ...cleaned, ...point }
  }
  if (cleaned.y <= 0) return cleaned
  const velocityY = (paper.velocityY ?? 0) - 80 / 60
  const y = Math.max(0, cleaned.y + velocityY / 60)
  return { ...cleaned, y, document: { ...paper, velocityY: y > 0 ? velocityY : 0 } }
}
