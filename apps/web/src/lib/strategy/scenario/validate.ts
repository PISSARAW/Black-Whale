import type {
  StrategyScenarioV2,
  StrategyScenarioValidationContext,
  StrategyScenarioValidationIssue,
} from './types'

const duplicateValues = (values: readonly string[]) => [
  ...new Set(values.filter((value, index) => values.indexOf(value) !== index)),
]

export function validateStrategyScenario(
  scenario: StrategyScenarioV2,
  context: StrategyScenarioValidationContext,
): StrategyScenarioValidationIssue[] {
  const issues: StrategyScenarioValidationIssue[] = []
  const add = (path: string, message: string) => issues.push({ path, message })
  if (scenario.schemaVersion !== 2) add('schemaVersion', 'must be 2')
  if (!scenario.id.trim()) add('id', 'must not be empty')
  if (scenario.maxTurns < 2) add('maxTurns', 'must be at least 2')
  if (scenario.playableFactions.length < 2)
    add('playableFactions', 'requires at least two factions')
  for (const id of duplicateValues(scenario.playableFactions.map((entry) => entry.factionId)))
    add('playableFactions', `duplicate faction ${id}`)
  const assignedCharacters = scenario.playableFactions.flatMap(
    (entry) => entry.requiredCharacterIds,
  )
  for (const id of duplicateValues(assignedCharacters))
    add('playableFactions', `character assigned to multiple factions: ${id}`)
  for (const [index, entry] of scenario.playableFactions.entries()) {
    if (!context.factionIds.has(entry.factionId))
      add(`playableFactions.${index}.factionId`, `unknown faction ${entry.factionId}`)
    for (const characterId of entry.requiredCharacterIds)
      if (!context.characterIds.has(characterId))
        add(`playableFactions.${index}.requiredCharacterIds`, `unknown character ${characterId}`)
    for (const objective of [entry.publicObjective, entry.secretObjective])
      if (objective.target < 1) add(`objectives.${objective.id}.target`, 'must be positive')
  }
  for (const id of duplicateValues(scenario.locationIds))
    add('locationIds', `duplicate location ${id}`)
  for (const id of scenario.locationIds)
    if (!context.locationIds.has(id)) add('locationIds', `unknown location ${id}`)
  for (const event of scenario.events) {
    if (event.turn < 1 || event.turn > scenario.maxTurns)
      add(`events.${event.id}.turn`, 'outside scenario duration')
    if (event.aiMoveMultiplier < 0)
      add(`events.${event.id}.aiMoveMultiplier`, 'must be non-negative')
  }
  for (const source of scenario.provenance)
    if (context.sourceIds && !context.sourceIds.has(source.sourceId))
      add('provenance', `unknown source ${source.sourceId}`)
  return issues
}

export function assertValidStrategyScenario(
  scenario: StrategyScenarioV2,
  context: StrategyScenarioValidationContext,
): void {
  const issues = validateStrategyScenario(scenario, context)
  if (issues.length)
    throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join('; '))
}
