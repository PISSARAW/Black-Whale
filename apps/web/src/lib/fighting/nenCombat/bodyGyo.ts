import { transitionNen } from '@black-whale/nen-engine'
import { voluntaryNenAvailable } from '../nenAccess'
import type { ArcadeFighter, FightNenZone } from '../types'
declare module '../types' {
  interface ArcadeFighter {
    gyoFocus?: FightNenZone
  }
}
export const BODY_GYO_SHARE = 0.7
export const BODY_GYO_DRAIN = 2.4
function available(fighter: ArcadeFighter): boolean {
  return (
    voluntaryNenAvailable(fighter, { requireHatsu: false, requireReserve: true }) &&
    ![
      fighter.nen.ko,
      fighter.nen.ken,
      fighter.nen.en,
      fighter.hitStun,
      fighter.knockdownFrames,
    ].some(Boolean)
  )
}
export function bodyGyoZone(fighter: ArcadeFighter): FightNenZone | null {
  if (!fighter.gyoFocus || fighter.nen.gyo || fighter.nen.mode !== 'ren' || !available(fighter))
    return null
  return Number(fighter.nen.ryu[fighter.gyoFocus] ?? 0) >= BODY_GYO_SHARE ? fighter.gyoFocus : null
}
export function clearBodyGyo(fighter: ArcadeFighter): ArcadeFighter {
  if (!fighter.gyoFocus) return fighter
  const shared = [fighter.nen.ko, fighter.nen.ken, fighter.nen.en].some(Boolean)
  return {
    ...fighter,
    gyoFocus: undefined,
    nen: shared ? fighter.nen : { ...fighter.nen, ryu: {} },
  }
}
/** G + an existing zone input selects bodily Gyo; G alone remains ocular Gyo. */
export function focusBodyGyo(fighter: ArcadeFighter, zone: FightNenZone): ArcadeFighter {
  if (!available(fighter)) return fighter
  const distribution = { head: 10, torso: 10, hands: 10, feet: 10, [zone]: 70 }
  const next = transitionNen(
    { ...fighter.nen, mode: 'ren' as const, gyo: false },
    { type: 'RYU', distribution },
  ).state
  return { ...fighter, nen: next, gyoFocus: zone, ryuWindow: 0 }
}

export function gyoStatus(fighter: ArcadeFighter): string | null {
  const zone = bodyGyoZone(fighter)
  if (zone) return `gyo:${zone}`
  if (!fighter.nen.gyo) return null
  return fighter.gyoLow ? 'gyo-faible' : 'gyo'
}
