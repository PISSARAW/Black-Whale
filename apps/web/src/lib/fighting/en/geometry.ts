import { pushbox } from '../frameData'
import { voluntaryNenAvailable } from '../nenAccess'
import type { ArcadeFighter, FightState, FightSide } from '../types'
import { enContains } from './access'
export interface EnPoint {
  x: number
  y: number
  width?: number
  height?: number
  dx?: number
  dy?: number
  auraReaction?: boolean
}
export interface EnReading extends EnPoint {
  width: number
  height: number
  dx: number
  dy: number
  auraReaction: boolean
}
export interface EnPresence extends EnReading {
  key: string
}
export function bodyPresence(state: FightState, side: FightSide, body: ArcadeFighter): EnPresence {
  const box = pushbox(body),
    previous = state.previousPositions?.[side]
  return {
    key: 'body',
    x: (box.left + box.right) / 2,
    y: box.bottom,
    width: box.right - box.left,
    height: box.top - box.bottom,
    dx: previous ? Math.sign(body.x - previous.x) : 0,
    dy: previous ? Math.sign(body.y - previous.y) : 0,
    auraReaction:
      !body.nen.in && voluntaryNenAvailable(body, { requireHatsu: false, requireReserve: true }),
  }
}
export function pointPresence(key: string, point: EnPoint): EnPresence {
  return {
    key,
    x: point.x,
    y: point.y,
    width: point.width ?? 0.2,
    height: point.height ?? 0.2,
    dx: point.dx ?? 0,
    dy: point.dy ?? 0,
    auraReaction: point.auraReaction === true,
  }
}
function fits(observer: ArcadeFighter, p: EnReading): boolean {
  return [-1, 1].every((sign) =>
    [0, 1].every((top) =>
      enContains(observer, { x: p.x + (sign * p.width) / 2, y: p.y + top * p.height }),
    ),
  )
}
/** Only fully contacted contours are disclosed; at the boundary disclose the touching point. */
export function clipReading(observer: ArcadeFighter, point: EnPoint): EnReading | null {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null
  const p = clean(point)
  const touch = {
    x: Math.max(p.x - p.width / 2, Math.min(observer.x, p.x + p.width / 2)),
    y: Math.max(p.y, Math.min(observer.y, p.y + p.height)),
  }
  if (!enContains(observer, touch)) return null
  return fits(observer, p) ? p : { ...p, ...touch, width: 0, height: 0 }
}
function dimension(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) ? Math.max(0, Math.min(200, value)) : 0
}
function direction(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) ? Math.sign(value) : 0
}
function clean(point: EnPoint): EnReading {
  return {
    x: point.x,
    y: point.y,
    width: dimension(point.width),
    height: dimension(point.height),
    dx: direction(point.dx),
    dy: direction(point.dy),
    auraReaction: point.auraReaction === true,
  }
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
