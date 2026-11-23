import { transitionNen } from '@black-whale/nen-engine'
import { voluntaryNenAvailable } from '../nenAccess'
import { shuObject } from '../nenAdvanced'
import type { ArcadeFighter, FightInput, FightNenZone } from '../types'
import { prepareDefensiveKo } from '../nenTransfer'
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
function directionalGuardZone(fighter: ArcadeFighter, input: FightInput): FightNenZone | null {
  if (input.jump) return 'head'
  if (input.down) return 'feet'
  const forward = fighter.facing === 1 ? input.right : input.left
  const back = fighter.facing === 1 ? input.left : input.right
  if (forward && !back) return 'hands'
  if (back && !forward) return 'torso'
  return null
}
function requestedZone(fighter: ArcadeFighter, input: FightInput): FightNenZone | null {
  if (!input.aura || !input.guard) return null
  if (input.gyo) return zoneFor(input) ?? directionalGuardZone(fighter, input)
  return directionalGuardZone(fighter, input)
}
/** Explicit commitment: a correct guard zone is strong, every other zone loses aura protection. */
export function defensiveKo(fighter: ArcadeFighter, input: FightInput): ArcadeFighter | null {
  const zone = requestedZone(fighter, input)
  if (!zone) return null
  if (!voluntaryNenAvailable(fighter, { requireHatsu: false, requireReserve: true })) return null
  const continuing = continuesKo(fighter, zone)
  if (pendingKo(fighter, continuing)) return fighter
  if ([fighter.hitStun, fighter.knockdownFrames].some(Boolean)) return null
  if (fighter.attack && !continuing) return null
  if (!continuing && fighter.aura < DEFENSIVE_KO_COST) return null
  const nen = transitionNen(
    { ...coatedNen(fighter, input), mode: 'ren' as const, gyo: false, en: null, ken: false },
    { type: 'KO', zone },
  ).state
  return prepareDefensiveKo(
    fighter,
    {
      ...fighter,
      nen,
      gyoFocus: undefined,
      gyoLow: undefined,
      defensiveKo: zone,
      aura: fighter.aura - Number(!continuing) * DEFENSIVE_KO_COST,
    },
    zone,
  )
}

function continuesKo(fighter: ArcadeFighter, zone: FightNenZone): boolean {
  return (
    fighter.defensiveKo === zone &&
    (fighter.nen.ko === zone ||
      (fighter.nenTransfer?.ko === true && fighter.nenTransfer.zone === zone))
  )
}

function coatedNen(fighter: ArcadeFighter, input: FightInput) {
  const coating = transitionNen(fighter.nen, {
    type: 'SHU',
    objectId: shuObject(fighter),
    on: Boolean(input.shu),
  }).state
  return { ...coating, in: Boolean(input.conceal || fighter.attack?.concealed) }
}

function pendingKo(fighter: ArcadeFighter, continuing: boolean): boolean {
  return continuing && fighter.nenTransfer?.ko === true
}
