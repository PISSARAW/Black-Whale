import { chrolloHasActivePage } from './chrolloBook'
import type { PreparedEntity } from './preparationTypes'
import type { FightState } from './types'

export const GALLERY_FAKE_LIFETIME = 24 * 60 * 60 * 60

/** A carried part still belongs to its actual conjured object; picking it up does not reset its life. */
export function historicalMatterExists(state: FightState, copyId?: string): boolean {
  if (!copyId) return true
  const copy = state.battlefield?.entities.find((entry) => entry.id === copyId)
  return Boolean(copy?.copy && copy.health > 0 && !historicalCopyExpired(state, copy))
}

/** A detached piece shares the copy's Nen lifetime, not damage dealt later to another part. */
export function historicalPartExists(state: FightState, copyId?: string): boolean {
  if (!copyId) return true
  const copy = state.battlefield?.entities.find((entry) => entry.id === copyId)
  return Boolean(copy?.copy && !historicalCopyExpired(state, copy))
}

export function historicalCopyExpired(state: FightState, entry: PreparedEntity): boolean {
  if (persistentMark(entry)) return false
  const copy = entry.copy!
  if (state.frame - copy.createdAt >= GALLERY_FAKE_LIFETIME) return true
  const owner = state[copy.owner]
  // The referee supplies actual matter. Hidden enemy pages cannot refute its existence;
  // a client may still predict its known age limit or the source body's death.
  if (owner.chrolloBook?.pagesPrivate) return owner.health <= 0
  return !chrolloHasActivePage(owner, 'gallery-fake')
}
function persistentMark(entry: PreparedEntity): boolean {
  return entry.health > 0 && Boolean(entry.arena?.sun || entry.arena?.moon)
}
