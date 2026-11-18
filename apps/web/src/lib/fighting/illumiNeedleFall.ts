import type { FightState } from './types'

/** Ordinary falling metal, independent of the caster's Nen and paused with world motion. */
export function fallFaceNeedles(state: FightState): FightState {
  if (!state.battlefield) return state
  const entities = state.battlefield.entities.map((entry) => {
    if (!entry.present || !entry.detachedFaceNeedles || entry.y <= 0) return entry
    const velocityY = (entry.detachedFaceNeedles.velocityY ?? 0) - 80 / 60
    return {
      ...entry,
      y: Math.max(0, entry.y + velocityY / 60),
      detachedFaceNeedles: { ...entry.detachedFaceNeedles, velocityY },
    }
  })
  return { ...state, battlefield: { ...state.battlefield, entities } }
}
