import { voluntaryNenAvailable } from '../nenAccess'
import { senseDeprived } from '../saiyuSenses'
import type { ArcadeFighter } from '../types'
declare module '../types' {
  interface ArcadeFighter {
    gyoLow?: boolean
  }
}
/** Eyes and consciousness, independent of access to aura. */
export function combatSight(fighter: ArcadeFighter): boolean {
  return (
    fighter.health > 0 &&
    !fighter.parallelEyesClosed &&
    !senseDeprived(fighter, 'sight') &&
    !fighter.kurapika?.blackoutFrames
  )
}
export function auraSight(fighter: ArcadeFighter): boolean {
  return (
    fighter.nen.gyo &&
    combatSight(fighter) &&
    voluntaryNenAvailable(fighter, { requireReserve: true, requireHatsu: false })
  )
}

/** Weak, leakage-only Gyo is not treated as a proven universal counter to In. */
export function gyoSight(fighter: ArcadeFighter): boolean {
  return auraSight(fighter) && !fighter.gyoLow
}
