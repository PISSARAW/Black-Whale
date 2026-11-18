import { liveEntity } from './preparationWorld'
import { LUINI_ROOM_HALF_WIDTH, LUINI_ROOM_HEIGHT } from './luiniSpatial'
import { sleepingBody } from './hanzoProjection'
import type { MaryDrop } from './bloodyMary'
import type { PreparedEntity } from './preparationTypes'
import type { FightState, FightSide } from './types'

const SPEED = 0.15
function surface(entry: PreparedEntity) {
  if (entry.material !== 'real' || !liveEntity(entry)) return null
  if (entry.kind === 'room') return { width: LUINI_ROOM_HALF_WIDTH, height: LUINI_ROOM_HEIGHT }
  return entry.arena ?? null
}
export function maryScoutWall(state: FightState, side: FightSide) {
  const x = state[side].x
  return (state.battlefield?.entities ?? [])
    .filter((entry) => surface(entry))
    .filter((entry) => Math.abs(entry.x - x) <= 18)
    .sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0]
}
export function moveMaryScout(state: FightState, side: FightSide, drop: MaryDrop): MaryDrop {
  if (state[side].bloodyMary?.returning)
    return towards(drop, { x: state[side].x, y: state[side].y + 1 })
  if (drop.wallId) return climbWall(state, drop)
  if (drop.y > 1) return towards(drop, { x: drop.x, y: 1 })
  const x = drop.x + drop.direction * SPEED
  return {
    ...drop,
    x: Math.max(7, Math.min(93, x)),
    direction: x <= 7 ? 1 : x >= 93 ? -1 : drop.direction,
  }
}
function climbWall(state: FightState, drop: MaryDrop): MaryDrop {
  const wall = state.battlefield?.entities.find((entry) => entry.id === drop.wallId)
  const face = wall && surface(wall)
  if (!wall || !face) return { ...drop, wallId: undefined, y: Math.max(1, drop.y - SPEED) }
  const x = wall.x + (drop.wallEdge ?? -1) * (face.width + 0.05)
  if (Math.abs(drop.x - x) > SPEED) return towards(drop, { x, y: 1 })
  const bottom = wall.y + 1,
    top = wall.y + face.height - 0.2
  const y = Math.max(bottom, Math.min(top, drop.y + drop.direction * SPEED))
  return { ...drop, x, y, direction: y >= top ? -1 : y <= bottom ? 1 : drop.direction }
}
function towards(drop: MaryDrop, target: { x: number; y: number }): MaryDrop {
  const dx = target.x - drop.x,
    dy = target.y - drop.y
  const ratio = Math.min(1, SPEED / Math.max(0.001, Math.hypot(dx, dy)))
  return { ...drop, x: drop.x + dx * ratio, y: drop.y + dy * ratio }
}

/** Eyes report a nearby body actually in view; a cover never becomes transparent. */
export function maryScoutSees(state: FightState, side: FightSide, drop: MaryDrop): boolean {
  const target = sleepingBody(state[side === 'player' ? 'opponent' : 'player'])
  const point = { x: target.x, y: target.y + 2 }
  if (drop.reformFrames > 0 || Math.hypot(drop.x - point.x, drop.y - point.y) > 6) return false
  return !(state.battlefield?.entities ?? []).some(
    (entry) => entry.arena && liveEntity(entry) && segmentBlocked(drop, point, entry),
  )
}
function segmentBlocked(
  from: { x: number; y: number },
  to: { x: number; y: number },
  entry: PreparedEntity,
): boolean {
  let near = 0.001,
    far = 0.999
  const bounds = [
    [from.x, to.x - from.x, entry.x - entry.arena!.width, entry.x + entry.arena!.width],
    [from.y, to.y - from.y, entry.y, entry.y + entry.arena!.height],
  ]
  for (const [origin, delta, low, high] of bounds) {
    if (Math.abs(delta) < 0.00001) {
      if (origin < low || origin > high) return false
      continue
    }
    const first = (low - origin) / delta,
      last = (high - origin) / delta
    near = Math.max(near, Math.min(first, last))
    far = Math.min(far, Math.max(first, last))
    if (near > far) return false
  }
  return true
}
