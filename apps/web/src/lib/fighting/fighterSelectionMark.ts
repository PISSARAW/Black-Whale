import type { FighterId } from './types'

/** Badge drawn on a roster card: which seat or seats currently picked that fighter. */
export function selectionMark(id: FighterId, playerId: FighterId, opponentId: FighterId): string {
  if (playerId === id && opponentId === id) return '1 · 2'
  if (playerId === id) return '1'
  return opponentId === id ? '2' : ''
}
