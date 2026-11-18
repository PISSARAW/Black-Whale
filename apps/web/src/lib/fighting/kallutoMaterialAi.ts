import { paperAvailable } from './kallutoAccess'
import { performPaperKitCommand, paperKitInReach } from './kallutoMaterialActions'
import type { ArcadeFighter, FightState } from './types'
import type { PaperKit } from './kallutoMaterials'

export function usablePaperStock(kit?: PaperKit): boolean {
  return Boolean(kit && kit.integrity > 0 && kit.markers + kit.salvos + kit.sheets > 0)
}
export function needsPaperStock(actor: ArcadeFighter): boolean {
  return (actor.id === 'kalluto' || paperAvailable(actor)) && !usablePaperStock(actor.paperKit)
}
export function paperKitAi(state: FightState): FightState | null {
  if (!needsPaperStock(state.opponent)) return null
  if (state.opponent.paperKit) {
    const dropped = performPaperKitCommand(state, 'opponent', { action: 'paper-kit-drop' })
    return dropped === state ? null : dropped
  }
  const supply = state.battlefield?.entities.find(
    (entry) =>
      entry.present &&
      entry.health > 0 &&
      usablePaperStock(entry.paperKit) &&
      paperKitInReach(state, 'opponent', entry),
  )
  if (!supply) return null
  const picked = performPaperKitCommand(state, 'opponent', {
    action: 'paper-kit-take',
    target: supply.id,
  })
  return picked === state ? null : picked
}
