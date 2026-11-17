import { enContains } from './en/access'
import { enContactPoints, nearestPoint } from './en/contacts'
import { voluntaryNenAvailable } from './nenAccess'
import { senseDeprived } from './saiyuSenses'
import type { ArcadeFighter, FightProjectile, FightSide, FightState } from './types'

/** En senses contacts inside its volume, including stationary bodies in Zetsu.
 * It locates something hidden with In; Gyo is needed to inspect its aura.
 */
export function insideEn(observer: ArcadeFighter, position: { x: number; y: number }): boolean {
  return enContains(observer, position)
}

export function perceivesAura(observer: ArcadeFighter, source: ArcadeFighter): boolean {
  return !source.nen.in || gyoSight(observer)
}

export function gyoSight(observer: ArcadeFighter): boolean {
  return (
    observer.nen.gyo &&
    !observer.parallelEyesClosed &&
    !senseDeprived(observer, 'sight') &&
    voluntaryNenAvailable(observer, { requireReserve: true, requireHatsu: false })
  )
}

export function perceivesProjectile(observer: ArcadeFighter, projectile: FightProjectile): boolean {
  return projectile.matter === 'object' || !projectile.concealed || gyoSight(observer)
}

/** Closest point on a tether, so a string touching the observer is detectable
 * even when its distant anchor lies outside the field. */
export function enTouchesSegment(
  observer: ArcadeFighter,
  start: { x: number; y: number },
  end: { x: number; y: number },
): boolean {
  return insideEn(observer, nearestPoint(observer, start, end))
}

export function enContacts(state: FightState, side: FightSide): number {
  return enContactPoints(state, side).length
}

/** Gyo keeps its existing arcade timing aid. En provides contacts, not extra reaction frames. */
export function nenReadBonus(observer: ArcadeFighter, _source: ArcadeFighter): number {
  return gyoSight(observer) ? 2 : 0
}
