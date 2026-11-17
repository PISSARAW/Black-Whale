import { combatRoutesFor } from './combatRoutes'
import type { FighterMove, FighterMoveset } from './movesetTypes'
import { hasDuelComboProfile, tuneDuelComboProfile } from './duelComboProfiles'

/** Authored duel timing. Utility Hatsu never become damaging combo links. */
export function tuneReferenceCombat(moveset: FighterMoveset): FighterMoveset {
  const routes = combatRoutesFor(moveset.fighterId)
  const combos = routes.map((route) => route.moves.map((slot) => `${route.fighter}:${slot}`))
  if (hasDuelComboProfile(moveset.fighterId)) return { ...tuneDuelComboProfile(moveset), combos }
  if (!routes.length) return moveset
  return {
    ...moveset,
    combos,
    moves: moveset.moves.map((move) => tuneMove(move, combos)),
  }
}
function tuneMove(move: FighterMove, combos: readonly (readonly string[])[]): FighterMove {
  const cancelInto = [
    ...new Set(
      combos.flatMap((route) => {
        const index = route.indexOf(move.id)
        return index >= 0 && index < route.length - 1 ? [route[index + 1]] : []
      }),
    ),
  ]
  if (move.category !== 'normal' && move.category !== 'command') return { ...move, cancelInto }
  return {
    ...move,
    cancelInto,
    tuning: {
      ...move.tuning,
      // Extenders keep the target standing; finishers retain their knockdown force.
      knockback: cancelInto.length ? Math.min(2.6, move.tuning.knockback) : move.tuning.knockback,
      // A conversion must survive its next startup, without granting more blockstun.
      hitstun: Math.max(move.tuning.hitstun, move.kind === 'light' ? 16 : 20),
    },
  }
}
/** Only the first light can continue on guard; the follow-up remains a defensive decision. */
export function referencePressure(move: FighterMove): readonly string[] | null {
  if (hasDuelComboProfile(move.id.split(':')[0])) return move.cancelOnBlockInto
  if (!combatRoutesFor(move.id.split(':')[0] as FighterMoveset['fighterId']).length) return null
  if (move.slot !== 'standingLight') return []
  return move.cancelInto.filter((id) => id.endsWith(':standingHeavy') || id.endsWith(':backHeavy'))
}
