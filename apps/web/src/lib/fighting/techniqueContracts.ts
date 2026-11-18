export { techniqueContract } from './techniqueCatalogue'
export type { TechniqueCanonContract, CanonEvidence } from './techniqueCatalogue'
import { troupeMember } from './troupeMembership'
import { hisokaTechniqueAllowed } from './hisokaTechnique'
import { hunterInterviewReady } from './skillHunterAcquisition'
import type { FighterMove } from './movesetTypes'
import type { FightState, FightSide } from './types'

export function canonicalTechniqueAllowed(
  state: FightState,
  side: FightSide,
  move: Pick<FighterMove, 'id'>,
): boolean {
  if (!hisokaTechniqueAllowed(state, side, move.id)) return false
  if (move.id === 'chrollo:forwardSpecial') return hunterInterviewReady(state, side)
  if (move.id !== 'kurapika:neutralSpecial') return true
  const opponent = state[side === 'player' ? 'opponent' : 'player']
  return troupeMember(opponent.id)
}
