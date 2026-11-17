import { sleepingBody } from '../hanzoProjection'
import { liveEntity } from '../preparationWorld'
import type { FightState, FightSide } from '../types'
import { activeEnRadius, enContains } from './access'
export interface EnPoint {
  x: number
  y: number
}
export const MAX_EN_CONTACTS = 128
// A private presentation projection only; authoritative physics never consumes it.
declare module '../types' {
  interface FightState {
    enReadings?: EnPoint[]
  }
}
/** Internal identities are used only to compare real motion, never sent as En knowledge. */
export function enPresences(state: FightState, side: FightSide) {
  const other = side === 'player' ? 'opponent' : 'player'
  const target = state[other]
  const points = [{ key: 'body', ...position(sleepingBody(target)) }]
  if (target.hanzoProjection) points.push({ key: 'double', ...position(target) })
  points.push(...entityPresences(state), ...projectilePresences(state, side))
  const gum = state.bungeeGum
  if (gum)
    points.push({
      key: 'tether',
      ...nearestPoint(state[side], state[gum.owner], state[gum.target]),
    })
  return points
}
function entityPresences(state: FightState) {
  return (state.battlefield?.entities ?? [])
    .filter((entity) => liveEntity(entity) && !['destination', 'delivery'].includes(entity.kind))
    .map((entity) => ({ key: `entity:${entity.id}`, ...position(entity) }))
}
function projectilePresences(state: FightState, side: FightSide) {
  return state.projectiles
    .filter((shot) => shot.owner !== side && (!shot.remotePunch || shot.y >= 0))
    .map((shot) => ({ key: `projectile:${shot.id}`, ...position(shot) }))
}
function position(value: EnPoint): EnPoint {
  return { x: value.x, y: value.y }
}
export function nearestPoint(observer: EnPoint, start: EnPoint, end: EnPoint): EnPoint {
  const dx = end.x - start.x,
    dy = end.y - start.y,
    length = dx * dx + dy * dy
  const ratio = length
    ? Math.max(0, Math.min(1, ((observer.x - start.x) * dx + (observer.y - start.y) * dy) / length))
    : 0
  return { x: start.x + ratio * dx, y: start.y + ratio * dy }
}
/** Presence/position only: no identity, aura category, intent, damage or Hatsu conditions. */
export function enContactPoints(state: FightState, side: FightSide): EnPoint[] {
  if (!activeEnRadius(state[side])) return []
  const held =
    side === 'player' && state.pvpSeat && !state.spectatorView ? state.enReadings : undefined
  const points = Array.isArray(held) ? held.slice(0, MAX_EN_CONTACTS) : enPresences(state, side)
  return points
    .filter(
      (point) =>
        point &&
        Number.isFinite(point.x) &&
        Number.isFinite(point.y) &&
        enContains(state[side], point),
    )
    .slice(0, MAX_EN_CONTACTS)
    .map(position)
}
