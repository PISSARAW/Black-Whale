import { historicalCopyExpired, historicalPartExists } from './historicalCopyLifetime'
import { advanceCopiedInventory } from './copiedInventory'
import { advancePaperScatters } from './kallutoScatterFrame'
import { cleanStoredPaperEntity } from './kallutoStoredPaper'
import { cleanDocumentMatter } from './paperDocuments'
import type { PreparedEntity } from './preparationTypes'
import type { FightState } from './types'
declare module './types' {
  interface FightProjectile {
    materialCopyId?: string
  }
}

/** Expire matter without advancing puppet attacks, including during a frozen combat sequence. */
export function expireHistoricalMatter(state: FightState): FightState {
  state = advancePaperScatters(state)
  const field = state.battlefield
  if (!field) return expireCopiedProjectiles(advanceCopiedInventory(state))
  const entities = field.entities.map((entry) => expireWorldEntry(state, entry))
  const changed = entities.some((entry, index) => entry !== field.entities[index])
  return expireCopiedProjectiles(
    advanceCopiedInventory(changed ? { ...state, battlefield: { ...field, entities } } : state),
  )
}
function expireWorldEntry(state: FightState, entry: PreparedEntity): PreparedEntity {
  const cleaned = cleanDocumentMatter(state, cleanStoredPaperEntity(state, entry))
  return cleaned.copy && cleaned.present && historicalCopyExpired(state, cleaned)
    ? { ...cleaned, present: false }
    : cleaned
}
function expireCopiedProjectiles(state: FightState): FightState {
  const projectiles = state.projectiles.filter((shot) =>
    historicalPartExists(state, shot.materialCopyId),
  )
  return projectiles.length === state.projectiles.length ? state : { ...state, projectiles }
}
