import { historicalCopyExpired, historicalPartExists } from './historicalCopyLifetime'
import { advanceCopiedInventory } from './copiedInventory'
import type { FightState } from './types'
declare module './types' {
  interface FightProjectile {
    materialCopyId?: string
  }
}

/** Expire matter without advancing puppet attacks, including during a frozen combat sequence. */
export function expireHistoricalMatter(state: FightState): FightState {
  const field = state.battlefield
  if (!field) return expireCopiedProjectiles(advanceCopiedInventory(state))
  let changed = false
  const entities = field.entities.map((entry) => {
    if (!entry.copy || !entry.present || !historicalCopyExpired(state, entry)) return entry
    changed = true
    return { ...entry, present: false }
  })
  return expireCopiedProjectiles(
    advanceCopiedInventory(changed ? { ...state, battlefield: { ...field, entities } } : state),
  )
}
function expireCopiedProjectiles(state: FightState): FightState {
  const projectiles = state.projectiles.filter((shot) =>
    historicalPartExists(state, shot.materialCopyId),
  )
  return projectiles.length === state.projectiles.length ? state : { ...state, projectiles }
}
