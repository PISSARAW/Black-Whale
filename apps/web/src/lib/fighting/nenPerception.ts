import { sleepingBody } from './hanzoProjection'
import { senseDeprived } from './saiyuSenses'
import type { ArcadeFighter, FightProjectile, FightSide, FightState } from './types'

/** En senses displacement inside its volume, including a body in Zetsu.
 * It locates something hidden with In; Gyo is needed to inspect its aura.
 */
export function insideEn(observer: ArcadeFighter, position: { x: number; y: number }): boolean {
  return (
    observer.nen.mode !== 'zetsu' &&
    Boolean(observer.nen.en) &&
    Math.hypot(position.x - observer.x, position.y - observer.y) <= observer.nen.en!.radius
  )
}

export function perceivesAura(observer: ArcadeFighter, source: ArcadeFighter): boolean {
  return !source.nen.in || gyoSight(observer) || insideEn(observer, source)
}

export function gyoSight(observer: ArcadeFighter): boolean {
  return observer.nen.gyo && !senseDeprived(observer, 'sight')
}

export function perceivesProjectile(observer: ArcadeFighter, projectile: FightProjectile): boolean {
  return (
    projectile.matter === 'object' ||
    !projectile.concealed ||
    gyoSight(observer) ||
    insideEn(observer, projectile)
  )
}

/** Closest point on a tether, so a string touching the observer is detectable
 * even when its distant anchor lies outside the field. */
export function enTouchesSegment(
  observer: ArcadeFighter,
  start: { x: number; y: number },
  end: { x: number; y: number },
): boolean {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = dx * dx + dy * dy
  const ratio = length
    ? Math.max(0, Math.min(1, ((observer.x - start.x) * dx + (observer.y - start.y) * dy) / length))
    : 0
  return insideEn(observer, { x: start.x + ratio * dx, y: start.y + ratio * dy })
}

export function enContacts(state: FightState, side: FightSide): number {
  const observer = state[side]
  const target = state[side === 'player' ? 'opponent' : 'player']
  const bodies =
    Number(insideEn(observer, sleepingBody(target))) +
    Number(Boolean(target.hanzoProjection) && insideEn(observer, target))
  const gum = state.bungeeGum
  const tether = gum ? Number(enTouchesSegment(observer, state[gum.owner], state[gum.target])) : 0
  return (
    bodies +
    tether +
    state.projectiles.filter(
      (projectile) =>
        projectile.owner !== side &&
        (!projectile.remotePunch || projectile.y >= 0) &&
        insideEn(observer, projectile),
    ).length
  )
}

/** Reading a trajectory helps a timed defence; it never supplies automatic guard. */
export function nenReadBonus(observer: ArcadeFighter, source: ArcadeFighter): number {
  if (insideEn(observer, source)) return 3
  return gyoSight(observer) ? 2 : 0
}
