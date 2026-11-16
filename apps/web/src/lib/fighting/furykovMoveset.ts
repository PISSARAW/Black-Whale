import { COMBO_MASTER_MOVE } from './comboMasterTypes'
import { comboMasterNenActive } from './comboMasterAvailability'
import type { FighterMove, FighterMoveset } from './movesetTypes'
import type { ArcadeFighter } from './types'

export function furykovMoveAvailable(fighter: ArcadeFighter, move: FighterMove): boolean {
  if (fighter.id !== 'furykov' || move.id !== COMBO_MASTER_MOVE) return true
  return !fighter.comboMaster && comboMasterNenActive(fighter)
}

/** Opening the console commits the hands, never lunges at or strikes the other fighter. */
export function tuneFurykovMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'furykov') return moveset
  return {
    ...moveset,
    moves: moveset.moves.map((move) =>
      move.id !== COMBO_MASTER_MOVE
        ? move
        : {
            ...move,
            tuning: { ...move.tuning, damage: 0, knockback: 0, lunge: 0, reach: 0 },
          },
    ),
  }
}
