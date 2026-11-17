import { transitionNen } from '@black-whale/nen-engine'
import { voluntaryNenAvailable } from '../nenAccess'
import { shuObject } from '../nenAdvanced'
import type { ArcadeFighter, FightInput, FightNenZone } from '../types'
declare module '../types' {
  interface ArcadeFighter {
    defensiveKo?: FightNenZone
  }
}
export const DEFENSIVE_KO_COST = 20
function zoneFor(input: FightInput): FightNenZone | null {
  if (input.focusHead) return 'head'
  if (input.focusTorso) return 'torso'
  if (input.focusHands) return 'hands'
  return input.focusFeet ? 'feet' : null
}
function requestedZone(input: FightInput): FightNenZone | null {
  return input.aura && input.guard && input.gyo ? zoneFor(input) : null
}
/** Explicit commitment: a correct guard zone is strong, every other zone loses aura protection. */
export function defensiveKo(fighter: ArcadeFighter, input: FightInput): ArcadeFighter | null {
  const zone = requestedZone(input)
  if (!zone) return null
  if (!voluntaryNenAvailable(fighter, { requireHatsu: false, requireReserve: true })) return null
  const continuing = fighter.defensiveKo === zone && fighter.nen.ko === zone
  if ([fighter.hitStun, fighter.knockdownFrames].some(Boolean)) return null
  if (fighter.attack && !continuing) return null
  if (!continuing && fighter.aura < DEFENSIVE_KO_COST) return null
  const nen = transitionNen(
    { ...coatedNen(fighter, input), mode: 'ren' as const, gyo: false, en: null, ken: false },
    { type: 'KO', zone },
  ).state
  return {
    ...fighter,
    nen,
    gyoFocus: undefined,
    gyoLow: undefined,
    defensiveKo: zone,
    aura: fighter.aura - Number(!continuing) * DEFENSIVE_KO_COST,
  }
}

function coatedNen(fighter: ArcadeFighter, input: FightInput) {
  const coating = transitionNen(fighter.nen, {
    type: 'SHU',
    objectId: shuObject(fighter),
    on: Boolean(input.shu),
  }).state
  return { ...coating, in: Boolean(input.conceal || fighter.attack?.concealed) }
}
