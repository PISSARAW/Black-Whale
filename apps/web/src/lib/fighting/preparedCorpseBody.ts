import type { PreparedEntity } from './preparationTypes'

/** Collider and visible pose describe the same material corpse. */
export function corpseCollider(entry: PreparedEntity): PreparedEntity {
  if (entry.kind !== 'corpse' || !entry.arena) return entry
  const height = ['illumi', 'machi'].includes(entry.controller?.source ?? '') ? 12 : 3
  return entry.arena.height === height ? entry : { ...entry, arena: { ...entry.arena, height } }
}

export function releasePreparedEntity(entry: PreparedEntity): PreparedEntity {
  const released = { ...entry, controller: undefined }
  return corpseCollider(
    entry.kind === 'corpse' ? { ...released, corpseOrder: undefined } : released,
  )
}
