import { sleepingBody } from '../hanzoProjection'
import { liveEntity } from '../preparationWorld'
import { gyoSight } from '../nenCombat/sight'
import { gumEnPresences } from '../bungeeContacts'
import type { FightState, FightSide } from '../types'
import { activeEnRadius } from './access'
import {
  bodyPresence,
  clipReading,
  pointPresence,
  nearestPoint,
  type EnPoint,
  type EnReading,
  type EnPresence,
} from './geometry'
export { nearestPoint } from './geometry'
export type { EnPoint, EnReading } from './geometry'
export const MAX_EN_CONTACTS = 128
// Private presentation projection; authoritative physics never consumes cached readings.
declare module '../types' {
  interface FightState {
    enReadings?: EnPoint[]
  }
}
/** Internal keys compare motion; transmitted contours carry no identity, Hatsu or future state. */
export function enPresences(state: FightState, side: FightSide): EnPresence[] {
  const other = side === 'player' ? 'opponent' : 'player',
    target = state[other]
  const points = [physicalPresence(state, other)]
  if (target.hanzoProjection && (!target.nen.in || gyoSight(state[side])))
    points.push({
      ...bodyPresence(state, other, { ...target, hanzoProjection: undefined }),
      key: 'double',
    })
  points.push(...entityPresences(state, side), ...projectilePresences(state, side))
  points.push(...tetherPresences(state, side))
  return points
}
function tetherPresences(state: FightState, side: FightSide): EnPresence[] {
  if (state.gumNetwork) return gumEnPresences(state, side)
  const gum = state.bungeeGum
  if (gum && (!gum.hidden || gum.owner === side || gyoSight(state[side])))
    return [
      pointPresence('tether', {
        ...nearestPoint(state[side], state[gum.owner], state[gum.target]),
        auraReaction: true,
      }),
    ]
  return []
}
function physicalPresence(state: FightState, side: FightSide): EnPresence {
  const target = state[side]
  const body = target.hanzoProjection ? { ...sleepingBody(target), knockdownFrames: 1 } : target
  const physical = bodyPresence(state, side, body)
  // Previous positions follow the double; the resting body does not move with it.
  if (target.hanzoProjection) {
    physical.dx = 0
    physical.dy = 0
  }
  return physical
}
function entityPresences(state: FightState, side: FightSide) {
  return (state.battlefield?.entities ?? [])
    .filter((entity) => liveEntity(entity) && !['destination', 'delivery'].includes(entity.kind))
    .filter(
      (entity) =>
        entity.material === 'real' ||
        entity.owner === 'neutral' ||
        !state[entity.owner].nen.in ||
        gyoSight(state[side]),
    )
    .map((entity) =>
      pointPresence(`entity:${entity.id}`, { ...entity, auraReaction: entity.material === 'nen' }),
    )
}
function projectilePresences(state: FightState, side: FightSide) {
  return state.projectiles
    .filter((shot) => shot.owner !== side && (!shot.remotePunch || shot.y >= 0))
    .filter((shot) => shot.matter === 'object' || !shot.concealed || gyoSight(state[side]))
    .map((shot) =>
      pointPresence(`projectile:${shot.id}`, {
        x: shot.x,
        y: shot.y - shot.height / 2,
        width: shot.width,
        height: shot.height,
        dx: Math.sign(shot.velocityX),
        dy: 0,
        auraReaction:
          shot.matter === 'nen' ||
          Boolean(shot.shuCharged && (!shot.concealed || gyoSight(state[side]))),
      }),
    )
}
export function enContactReadings(state: FightState, side: FightSide): EnReading[] {
  if (!activeEnRadius(state[side])) return []
  const held =
    side === 'player' && state.pvpSeat && !state.spectatorView ? state.enReadings : undefined
  const points = Array.isArray(held) ? held.slice(0, MAX_EN_CONTACTS) : enPresences(state, side)
  return points
    .map((p) => clipReading(state[side], p))
    .filter((p): p is EnReading => p !== null)
    .slice(0, MAX_EN_CONTACTS)
}
/** Legacy position/count API. Rich readings are explicitly limited to contacted contours. */
export function enContactPoints(state: FightState, side: FightSide): EnPoint[] {
  return enContactReadings(state, side).map(({ x, y }) => ({ x, y }))
}
