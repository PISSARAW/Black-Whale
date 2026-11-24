import { voluntaryNenAvailable } from './nenAccess'
import type { ArcadeFighter } from './types'

/** Compact weapon strikes. The four techniques still provide the long extension. */
const BONUS_REACH: Readonly<Record<string, number>> = {
  'gel:standingLight': 0.85,
  'gel:standingHeavy': 1.25,
  'gel:lowLight': 0.7,
  'gel:airLight': 0.9,
  'gel:airHeavy': 1.2,
  'gel:forwardLight': 1.55,
  'gel:backHeavy': 1,
}

export function gelSnakeNormalAvailable(fighter: ArcadeFighter, moveId?: string): boolean {
  return (
    fighter.id === 'gel' &&
    moveId !== undefined &&
    typeof BONUS_REACH[moveId] === 'number' &&
    voluntaryNenAvailable(fighter, { requireReserve: true })
  )
}

/** Reach and presentation share the same recorded source and current Nen access. */
export function gelSnakeNormalReach(fighter: ArcadeFighter): number {
  const attack = fighter.attack
  if (
    attack?.hatsuSource !== 'gel' ||
    (attack.kind !== 'light' && attack.kind !== 'heavy') ||
    !attack.moveId ||
    attack.variant === 'throw' ||
    !gelSnakeNormalAvailable(fighter, attack.moveId)
  )
    return 0
  return BONUS_REACH[attack.moveId] ?? 0
}
