import { BATTLE_COST, BATTLE_DANCE_FRAMES, BATTLE_MOVES } from './battleCantabileTypes'
import type { FighterMove, FighterMoveset } from './movesetTypes'

export function tuneBonolenovMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'bonolenov') return moveset
  return {
    ...moveset,
    finisherConditionFr: 'Danse de Jupiter complète ; cible dans la portée du son.',
    finisherConditionEn: 'Complete Jupiter’s dance; target within earshot.',
    moves: moveset.moves.map(tuneMove),
    combos: [
      ['bonolenov:standingLight', 'bonolenov:standingHeavy'],
      ['bonolenov:lowLight', 'bonolenov:forwardSpecial'],
      ['bonolenov:airLight', 'bonolenov:airHeavy'],
    ],
  }
}

function tuneMove(move: FighterMove): FighterMove {
  if (move.category !== 'special' && move.category !== 'finisher') return move
  if (move.id === BATTLE_MOVES.spear)
    return {
      ...move,
      auraCost: 12,
      tuning: { ...move.tuning, reach: 23, bottom: 3, top: 10, damage: 16, lunge: 0.3 },
    }
  const piece =
    move.slot === 'neutralSpecial'
      ? 'prologue'
      : move.slot === 'finisher'
        ? 'jupiter'
        : 'metamorphosen'
  return {
    ...move,
    auraCost: move.id === BATTLE_MOVES.stop ? 0 : BATTLE_COST[piece],
    tuning: {
      ...move.tuning,
      startup: BATTLE_DANCE_FRAMES[piece],
      damage: 0,
      lunge: 0,
      reach: 0,
      knockback: 0,
    },
  }
}
