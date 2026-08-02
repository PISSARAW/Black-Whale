/**
 * Ryu: where the aura is, right now. The control of the duel.
 *
 * Two continuous dials — how much of it is forward and which part of the body
 * the rest is on — and between them they decide everything the other five verbs
 * can do. Pushing forward past the halfway mark is what makes a Ko possible at
 * all, and it narrows the guard to the single zone it is standing on. Sitting
 * back covers a second zone and takes the strike away.
 *
 * Ryu itself costs nothing per second. It is not a technique you switch on, it
 * is what you are already doing with the hundred points you have; what it costs
 * is the other thing you were not doing with them.
 */
import { BODY_ZONES, type BodyZone, type DuelistState } from './state'

/** Forward of this, a Ko can be charged; behind it, the guard covers two zones. */
export const STRIKE_THRESHOLD = 0.5

export interface RyuSetting {
  attack?: number
  guard?: BodyZone
}

export function setRyu(duelist: DuelistState, setting: RyuSetting): DuelistState {
  const attack = clamp(setting.attack ?? duelist.attack)
  const guard = setting.guard ?? duelist.guard
  return {
    ...duelist,
    attack,
    guard,
    // Moving the aura is putting down whatever it was gathered into.
    ko: attack >= STRIKE_THRESHOLD ? duelist.ko : null,
  }
}

export function canStrike(duelist: DuelistState): boolean {
  return duelist.attack >= STRIKE_THRESHOLD
}

/**
 * What the guard actually covers. This is the whole of the defensive model, and
 * it is a set of zones rather than an amount — there is nothing here to compare
 * against an attacker's number, because there is no such number.
 */
export function coveredZones(duelist: DuelistState): BodyZone[] {
  if (duelist.broken || duelist.zetsu || duelist.held > 0) return []
  if (duelist.ken) return [...BODY_ZONES]
  // A charged Ko is everything in one point, and nothing anywhere else.
  if (duelist.ko) return [duelist.ko]
  if (duelist.attack >= STRIKE_THRESHOLD) return [duelist.guard]
  return [duelist.guard, neighbourOf(duelist.guard)]
}

/** The zone a settled guard spreads onto: the one below it, and the head onto the torso. */
function neighbourOf(zone: BodyZone): BodyZone {
  const index = BODY_ZONES.indexOf(zone)
  return BODY_ZONES[(index + 1) % BODY_ZONES.length]
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}
