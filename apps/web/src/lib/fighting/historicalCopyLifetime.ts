import { chrolloHasActivePage } from './chrolloBook'
import type { PreparedEntity } from './preparationTypes'
import type { FightState } from './types'

export const GALLERY_FAKE_LIFETIME = 24 * 60 * 60 * 60

export function historicalCopyExpired(state: FightState, entry: PreparedEntity): boolean {
  if (entry.arena?.sun || entry.arena?.moon) return false
  const copy = entry.copy!
  return (
    !chrolloHasActivePage(state[copy.owner], 'gallery-fake') ||
    state.frame - copy.createdAt >= GALLERY_FAKE_LIFETIME
  )
}
