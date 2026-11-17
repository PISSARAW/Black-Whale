import type { FighterMove, FighterMoveset, MoveTuning } from './movesetTypes'
import type { MoveSlot } from './types'

const BOOK_MOVES: Partial<Record<MoveSlot, { cost: number; tuning: Partial<MoveTuning> }>> = {
  neutralSpecial: {
    cost: 24,
    tuning: { startup: 12, damage: 2, knockback: 0, lunge: 0, reach: 8 },
  },
  forwardSpecial: {
    cost: 30,
    tuning: {
      startup: 18,
      damage: 0,
      hitstun: 0,
      blockstun: 0,
      knockback: 0,
      lunge: 0,
      reach: 6,
      targetZone: 'hands',
    },
  },
  backSpecial: {
    cost: 0,
    tuning: { startup: 3, active: 1, recovery: 12, damage: 0, lunge: 0, reach: 0 },
  },
  downSpecial: {
    cost: 0,
    tuning: { startup: 3, active: 1, recovery: 12, damage: 0, lunge: 0, reach: 0 },
  },
  finisher: {
    cost: 24,
    tuning: { startup: 12, active: 4, recovery: 22, damage: 2, knockback: 0, lunge: 0, reach: 8 },
  },
}

export function tuneChrolloMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'chrollo') return moveset
  return { ...moveset, moves: moveset.moves.map(tuneMove) }
}

function tuneMove(move: FighterMove): FighterMove {
  const spec = BOOK_MOVES[move.slot]
  return spec ? { ...move, auraCost: spec.cost, tuning: { ...move.tuning, ...spec.tuning } } : move
}
