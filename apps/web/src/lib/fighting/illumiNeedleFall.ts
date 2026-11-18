import type { FightState } from './types'
import type { PreparedEntity } from './preparationTypes'

/** Ordinary falling metal, independent of the caster's Nen and paused with world motion. */
export function fallFaceNeedles(state: FightState): FightState {
  if (!state.battlefield) return state
  const entities = state.battlefield.entities.map(fallNeedleBundle)
  return { ...state, battlefield: { ...state.battlefield, entities } }
}

function fallNeedleBundle(entry: PreparedEntity): PreparedEntity {
  const key = entry.detachedFaceNeedles ? 'detachedFaceNeedles' : 'disguisePinBundle'
  const bundle = entry[key]
  if (!entry.present || !bundle || entry.y <= 0) return entry
  const velocityY = (bundle.velocityY ?? 0) - 80 / 60
  return { ...entry, y: Math.max(0, entry.y + velocityY / 60), [key]: { ...bundle, velocityY } }
}
