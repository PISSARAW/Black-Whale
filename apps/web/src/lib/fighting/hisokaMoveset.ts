import { TEXTURE_SURPRISE_COST } from './textureSurpriseMask'
import type { FighterMoveset } from './movesetTypes'

/** A pull, a launch and a cloth disguise have no melee strike or lunge. */
export function tuneHisokaMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'hisoka') return moveset
  return {
    ...moveset,
    moves: moveset.moves.map((move) => {
      if (!['forwardSpecial', 'backSpecial', 'downSpecial'].includes(move.slot)) return move
      const isTexture = move.slot === 'downSpecial'
      return {
        ...move,
        ...(isTexture ? { auraCost: TEXTURE_SURPRISE_COST } : {}),
        tuning: {
          ...move.tuning,
          ...(isTexture ? { startup: 12 } : {}),
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
