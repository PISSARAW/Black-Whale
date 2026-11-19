import { tuneHanzoCombat } from './hanzoCombat'
import { tuneReferenceCombat, referencePressure } from './referenceCombat'
import { tuneFeitanPhysicalMoveset } from './feitanCombat'
import type { FighterMove, FighterMoveset } from './movesetTypes'

/** Duel balancing only: no additional Nen effect or free invulnerable Hatsu. */
export function declareMoveCombatRules(moveset: FighterMoveset): FighterMoveset {
  const tuned = tuneHanzoCombat(tuneFeitanPhysicalMoveset(tuneReferenceCombat(moveset)))
  return { ...tuned, moves: tuned.moves.map(declareMove) }
}

function declareMove(move: FighterMove): FighterMove {
  const pressure = referencePressure(move) ?? []
  return {
    ...move,
    cancelOnBlockInto: pressure.filter((id) => move.cancelInto.includes(id)),
  }
}
