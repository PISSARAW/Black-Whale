import { ownedPaperScatters, paperControlBusy } from './kallutoScatter'
import { activePaperOwner } from './kallutoSurveillance'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function performPaperScatterCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (command.action !== 'paper-release-confetti' || !state.battlefield) return state
  const owned = ownedPaperScatters(state, activePaperOwner(state, side)).filter(
    (entry) => entry.paperScatter?.controlled,
  )
  if (!owned.length) return state
  const ids = new Set(owned.map((entry) => entry.id))
  const entities = state.battlefield.entities.map((entry) =>
    ids.has(entry.id)
      ? {
          ...entry,
          y: entry.present ? 0 : entry.y,
          paperScatter: { ...entry.paperScatter!, controlled: false },
        }
      : entry,
  )
  return { ...state, battlefield: { ...state.battlefield, entities } }
}
export function paperScatterOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!paperControlBusy(state, side)) return []
  return [
    {
      command: { action: 'paper-release-confetti' },
      ready: true,
      labelFr: 'Papier · Relâcher les confettis',
      labelEn: 'Paper · Release the confetti',
      conditionFr:
        'Arrête leur contrôle sans détruire le papier réel. Un prêt unique peut se terminer ; aucune nouvelle réserve n’est créée.',
      conditionEn:
        'Ends control without destroying the actual paper. A single-use loan may finish; creates no new supplies.',
    },
  ]
}
