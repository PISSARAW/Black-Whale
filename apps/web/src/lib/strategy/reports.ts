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
}

export function buildTurnReports(input: TurnReportInput): string[] {
  return [
    ...(input.scenarioEvent
      ? [`Événement · ${input.scenarioEvent.title} — ${input.scenarioEvent.description}`]
      : []),
    ...input.diplomacyReports,
    `Tour ${input.completedTurn} · ${input.playerOrderCount} ordre(s) résolu(s), ${input.discoveries} renseignement(s) actualisé(s).`,
    ...(input.interceptions
      ? [`Interception réussie : ${input.interceptions} mouvement(s) adverse(s) bloqué(s).`]
      : []),
    ...input.activatedHatsu.map((activation) => `Hatsu activé · ${activation}.`),
    ...input.conflictReports,
    ...(input.hostileContacts
      ? [
          `Contact hostile dans ${input.hostileContacts} zone(s). La position ennemie est confirmée.`,
        ]
      : []),
    ...(input.objectiveComplete
      ? [`Objectif rempli · ${input.victoryPoints}/3 points de victoire.`]
      : []),
    ...(input.gameWon ? ['Victoire stratégique acquise.'] : []),
    ...(input.gameLost ? ['Défaite stratégique · le temps imparti est écoulé.'] : []),
    ...(input.scoutedLocations ? [`Enquête terminée dans ${input.scoutedLocations} zone(s).`] : []),
    ...(input.guardedLocations
      ? [`Protection maintenue dans ${input.guardedLocations} zone(s).`]
      : []),
  ]
}
