import type { FightSide, FightState } from './types'
import type { PreparedEntity } from './preparationTypes'

/** Collider and visible pose describe the same material corpse. */
export function corpseCollider(entry: PreparedEntity): PreparedEntity {
  if (entry.kind !== 'corpse' || !entry.arena) return entry
  const height = entry.controller?.source === 'illumi' ? 12 : 3
  return entry.arena.height === height ? entry : { ...entry, arena: { ...entry.arena, height } }
}

export function releasePreparedEntity(entry: PreparedEntity): PreparedEntity {
  const released = { ...entry, controller: undefined }
  return corpseCollider(
    entry.kind === 'corpse'
      ? { ...released, corpseOrder: undefined, corpseControl: undefined }
      : released,
  )
}

/** The corpse's x coordinate is its head anchor, including when it lies on the floor. */
export function corpseHeadContact(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): boolean {
  const actor = state[side]
  const headY = entry.y + (entry.controller?.source === 'illumi' ? 10 : 1.7)
  const handX = actor.x + Math.sign(entry.x - actor.x) * 2
  return Math.hypot(entry.x - handX, headY - (actor.y + 6)) <= 6
}
