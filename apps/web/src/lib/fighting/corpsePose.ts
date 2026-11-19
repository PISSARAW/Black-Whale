import type { PreparedEntity } from './preparationTypes'

/** Order Stamp moves an inert copy of a corpse; its original remains a real corpse. */
export function corpseUpright(entry: PreparedEntity): boolean {
  if (entry.copy && !entry.copy.headAttached) return false
  return entry.controller?.source === 'illumi' || Boolean(entry.copy?.order)
}

export function orderStampSubject(entry: PreparedEntity): boolean {
  if (entry.kind === 'puppet') return true
  return entry.kind === 'corpse' && entry.material === 'nen' && Boolean(entry.copy)
}
