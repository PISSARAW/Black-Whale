import type { PreparedEntity } from './preparationTypes'
import type { ArenaObject } from './arenaTypes'
import type { ArcadeFighter, FightSide } from './types'
import type { ObjectMark } from './sunMoonObjectHands'

export interface MarkPoint {
  x: number
  y: number
}
/** Contact tolerance, palm height and collision dimensions are duel calibration. */
export const MARK_CONTACT_TOLERANCE = 0.15
export function objectMarkPoint(entry: PreparedEntity, mark: ObjectMark): MarkPoint | undefined {
  const local = mark === 'sun' ? entry.arena?.sunPoint : entry.arena?.moonPoint
  if (!local) return undefined
  return { x: entry.x + local.x * (entry.arena?.facing ?? 1), y: entry.y + local.y }
}
export function palmObjectPoint(entry: PreparedEntity, actor: ArcadeFighter): MarkPoint {
  const height = actor.y + (actor.crouching ? 4 : 8)
  return {
    x: entry.x - actor.facing * entry.arena!.width,
    y: Math.max(entry.y, Math.min(entry.y + entry.arena!.height, height)),
  }
}
export function objectMarkAtPalm(
  entry: PreparedEntity,
  actor: ArcadeFighter,
  mark: ObjectMark,
): boolean {
  const point = objectMarkPoint(entry, mark)
  if (!point) return !entry.arena?.[mark]
  const palm = palmObjectPoint(entry, actor)
  return Math.hypot(point.x - palm.x, point.y - palm.y) <= MARK_CONTACT_TOLERANCE
}
export function stampObjectPoint(context: {
  entry: PreparedEntity
  actor: ArcadeFighter
  mark: ObjectMark
  side: FightSide
}): ArenaObject {
  const { entry, actor, mark, side } = context
  const world = palmObjectPoint(entry, actor)
  const local = { x: (world.x - entry.x) * (entry.arena!.facing ?? 1), y: world.y - entry.y }
  const key = mark === 'sun' ? 'sunPoint' : 'moonPoint'
  return { ...entry.arena!, [mark]: side, [key]: entry.arena![key] ?? local }
}
