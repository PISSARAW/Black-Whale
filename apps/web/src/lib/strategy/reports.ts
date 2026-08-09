import type { ScenarioEvent } from './scenario'
import { messagesFor } from '$lib/i18n'
import type { Locale } from '$lib/i18n/config'

export interface TurnReportInput {
  completedTurn: number
  playerOrderCount: number
  discoveries: number
  interceptions: number
  hostileContacts: number
  victoryPoints: number
  objectiveComplete: boolean
  gameWon: boolean
  gameLost: boolean
  scoutedLocations: number
  guardedLocations: number
  scenarioEvent: ScenarioEvent | null
  diplomacyReports: readonly string[]
  activatedHatsu: readonly string[]
  conflictReports: readonly string[]
  aiHatsuActivations: number
  playerMovesBlocked: number
  locale?: Locale
}

export function buildTurnReports(input: TurnReportInput): string[] {
  const copy = messagesFor(input.locale ?? 'en').strategy.reports.turn
  return [
    ...(input.scenarioEvent
      ? [copy.event(input.scenarioEvent.title, input.scenarioEvent.description)]
      : []),
    ...input.diplomacyReports,
    copy.resolved(input.completedTurn, input.playerOrderCount, input.discoveries),
    ...(input.interceptions
      ? [copy.interceptions(input.interceptions)]
      : []),
    ...input.activatedHatsu.map(copy.hatsu),
    ...input.conflictReports,
    ...(input.aiHatsuActivations ? [copy.hostileNen] : []),
    ...(input.playerMovesBlocked
      ? [copy.blockedMoves(input.playerMovesBlocked)]
      : []),
    ...(input.hostileContacts
      ? [copy.contacts(input.hostileContacts)]
      : []),
    ...(input.objectiveComplete ? [copy.objective(input.victoryPoints)] : []),
    ...(input.gameWon ? [copy.victory] : []),
    ...(input.gameLost ? [copy.defeat] : []),
    ...(input.scoutedLocations ? [copy.scouted(input.scoutedLocations)] : []),
    ...(input.guardedLocations ? [copy.guarded(input.guardedLocations)] : []),
  ]
}
