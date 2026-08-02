import type { ScenarioEvent } from './scenario'

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
}

export function buildTurnReports(input: TurnReportInput): string[] {
  return [
    ...(input.scenarioEvent
      ? [`Event · ${input.scenarioEvent.title} — ${input.scenarioEvent.description}`]
      : []),
    ...input.diplomacyReports,
    `Turn ${input.completedTurn} · ${input.playerOrderCount} order${input.playerOrderCount !== 1 ? 's' : ''} resolved, ${input.discoveries} intel update${input.discoveries !== 1 ? 's' : ''}.`,
    ...(input.interceptions
      ? [`Successful interception: ${input.interceptions} hostile movement${input.interceptions !== 1 ? 's' : ''} blocked.`]
      : []),
    ...input.activatedHatsu.map((activation) => `Hatsu activated · ${activation}.`),
    ...input.conflictReports,
    ...(input.aiHatsuActivations ? ['Hostile Nen activity detected.'] : []),
    ...(input.playerMovesBlocked
      ? [`Hostile control · ${input.playerMovesBlocked} allied movement${input.playerMovesBlocked !== 1 ? 's' : ''} blocked.`]
      : []),
    ...(input.hostileContacts
      ? [
          `Hostile contact in ${input.hostileContacts} zone${input.hostileContacts !== 1 ? 's' : ''}. Enemy position confirmed.`,
        ]
      : []),
    ...(input.objectiveComplete
      ? [`Objective achieved · ${input.victoryPoints}/3 victory points.`]
      : []),
    ...(input.gameWon ? ['Strategic victory achieved.'] : []),
    ...(input.gameLost ? ['Strategic defeat · time has run out.'] : []),
    ...(input.scoutedLocations ? [`Investigation complete in ${input.scoutedLocations} zone${input.scoutedLocations !== 1 ? 's' : ''}.`] : []),
    ...(input.guardedLocations
      ? [`Protection maintained in ${input.guardedLocations} zone${input.guardedLocations !== 1 ? 's' : ''}.`]
      : []),
  ]
}
