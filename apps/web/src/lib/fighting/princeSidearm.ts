import type { ArcadeFighter } from './types'

/** Nasubi confrontation / ch. 418–420. Twelve rounds is a duel loadout, not a manga calibre. */
export const PRINCE_SIDEARM_ROUNDS = 12
declare module './types' {
  interface ArcadeFighter {
    princeSidearmRounds?: number
  }
}
export function hasPrinceSidearm(fighter: ArcadeFighter): boolean {
  return ['tserriednich', 'halkenburg'].includes(fighter.nenOwner ?? fighter.id)
}
export function princeCanFire(fighter: ArcadeFighter): boolean {
  return !hasPrinceSidearm(fighter) || (fighter.princeSidearmRounds ?? PRINCE_SIDEARM_ROUNDS) > 0
}
export function spendPrinceRound(fighter: ArcadeFighter): ArcadeFighter {
  return hasPrinceSidearm(fighter)
    ? {
        ...fighter,
        princeSidearmRounds: Math.max(
          0,
          (fighter.princeSidearmRounds ?? PRINCE_SIDEARM_ROUNDS) - 1,
        ),
      }
    : fighter
}
