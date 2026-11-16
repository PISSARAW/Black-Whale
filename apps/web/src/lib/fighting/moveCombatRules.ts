import type { FighterMove, FighterMoveset } from './movesetTypes'

/** Duel balancing only: no additional Nen effect or free invulnerable Hatsu. */
export function declareMoveCombatRules(moveset: FighterMoveset): FighterMoveset {
  return { ...moveset, moves: moveset.moves.map(declareMove) }
}

function declareMove(move: FighterMove): FighterMove {
  const pressure = move.id === 'kurapika:standingLight' ? ['kurapika:standingHeavy'] : []
  return {
    ...move,
    cancelOnBlockInto: pressure.filter((id) => move.cancelInto.includes(id)),
  }
}
