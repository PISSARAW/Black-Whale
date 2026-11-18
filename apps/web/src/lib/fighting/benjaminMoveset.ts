import type { FighterMove, FighterMoveset, MoveTuning } from './movesetTypes'
import type { MoveSlot } from './types'
import { windowListeningMove } from './secretWindowListeningMove'

const UTILITY: Partial<Record<MoveSlot, Partial<MoveTuning>>> = {
  neutralSpecial: { lunge: 0, reach: 16, targetZone: 'torso', auraZone: 'hands' },
  forwardSpecial: { damage: 0, hitstun: 0, blockstun: 0, knockback: 0, lunge: 0, reach: 6 },
  downSpecial: { startup: 18, active: 18, recovery: 22, damage: 0, lunge: 0, reach: 0 },
  finisher: { startup: 18, active: 1, recovery: 24, damage: 0, lunge: 0, reach: 0 },
}

export function tuneBenjaminMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'benjamin') return moveset
  return { ...moveset, moves: moveset.moves.map(tuneMove) }
}

function tuneMove(move: FighterMove): FighterMove {
  if (move.slot === 'backSpecial') return windowListeningMove(move)
  const tuning = UTILITY[move.slot]
  const cost = move.slot === 'finisher' ? 24 : move.auraCost
  return tuning ? { ...move, auraCost: cost, tuning: { ...move.tuning, ...tuning } } : move
}
