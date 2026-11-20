import { activePaperOwner } from './kallutoSurveillance'
import type { DolphinBodyRef } from './dolphinLoanTypes'
import type { PlantedPaper } from './kallutoPaperTypes'
import type { FightSide, FightState } from './types'

function ownedBy(paper: PlantedPaper, owner: DolphinBodyRef): boolean {
  return paper.owner === owner.owner && (paper.ownerMember ?? 0) === owner.member
}

/**
 * Folding a doll commits one fragment already fixed to the subject to listening: the one in
 * the selected zone, otherwise the most recent. It then stops guiding the serpent, so spying
 * costs offensive paper. One listening fragment per subject; nothing new is created.
 */
export function bindListeningFragment(state: FightState, side: FightSide): FightState {
  const target = side === 'player' ? 'opponent' : 'player'
  const owner = activePaperOwner(state, side)
  const marks = state[target].plantedPaper ?? []
  const owned = marks.filter((paper) => ownedBy(paper, owner))
  if (!owned.length || owned.some((paper) => paper.listening)) return state
  const zone = state[side].kallutoPaper?.zone
  const chosen = owned.find((paper) => paper.zone === zone) ?? owned[owned.length - 1]
  return {
    ...state,
    [target]: {
      ...state[target],
      plantedPaper: marks.map((paper) =>
        paper === chosen ? { ...paper, listening: true } : paper,
      ),
    },
  }
}

/** Zones of the subject that still guide attack paper, separate from the listening one. */
export function paperFragmentRoles(
  state: FightState,
  side: FightSide,
): { guide: PlantedPaper['zone'][]; listening: PlantedPaper['zone'][] } {
  const target = side === 'player' ? 'opponent' : 'player'
  const owner = activePaperOwner(state, side)
  const owned = (state[target].plantedPaper ?? []).filter((paper) => ownedBy(paper, owner))
  return {
    guide: owned.filter((paper) => !paper.listening).map((paper) => paper.zone),
    listening: owned.filter((paper) => paper.listening).map((paper) => paper.zone),
  }
}
