import { applyAuraContext } from './nen'
import { voluntaryNenAvailable } from './nenAccess'
import { EMPTY_INPUT } from './types'
import type { ArcadeFighter, FightInput, FightNenZone } from './types'

export function focusCommand(zone: FightNenZone): FightInput {
  return { ...EMPTY_INPUT, ...focusFlags(zone) }
}
export function focusFlags(zone: FightNenZone) {
  return {
    focusHead: zone === 'head',
    focusTorso: zone === 'torso',
    focusHands: zone === 'hands',
    focusFeet: zone === 'feet',
  }
}
/** Same held focus as local input: no instant transfer, cost discount or granted mastery. */
export function preparePhysicalFocus(fighter: ArcadeFighter, zone: FightNenZone): ArcadeFighter {
  if (fighter.nen.ko || fighter.aura < 24 || fighter.nenTactics?.goal === 'recover') return fighter
  if (!voluntaryNenAvailable(fighter, { requireHatsu: false, requireReserve: true })) return fighter
  return applyAuraContext(fighter, focusCommand(zone))
}
