import type { FighterMoveset } from './movesetTypes'

/** A pull, a launch and a cloth disguise have no melee strike or lunge. */
export function tuneHisokaMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'hisoka') return moveset
  return {
    ...moveset,
    moves: moveset.moves.map((move) => {
      if (!['forwardSpecial', 'backSpecial', 'downSpecial'].includes(move.slot)) return move
      return {
        ...move,
        tuning: {
          ...move.tuning,
          damage: 0,
          hitstun: 0,
          blockstun: 0,
          hitstop: 0,
          knockback: 0,
          lunge: 0,
          reach: 0,
        },
      }
    }),
  }
}
