import { initialRelationship, type FactionRelationship } from '../diplomacy'
import { strategyScenarioById } from '../scenario/registry'
import type { UnitCondition } from '../conflict'
import type { StrategyCampaignOutcome, StrategyCampaignV3, StrategyReputation } from './types'
import type { Locale } from '$lib/i18n/config'

export const DEFAULT_CAMPAIGN_SCENARIOS = [
  'succession-guards-359',
  'mafia-war-390',
  'succession-lockdown-400',
] as const

export function createStrategyCampaign(seed: string, locale: Locale = 'en'): StrategyCampaignV3 {
  if (!seed) throw new Error('A campaign seed is required')
  return {
    version: 3,
    id: `black-whale-campaign:${seed}`,
    seed,
    currentScenarioIndex: 0,
    scenarioIds: [...DEFAULT_CAMPAIGN_SCENARIOS],
    outcomes: [],
    relationships: {},
    unitConditions: {},
    reputation: 'PRAGMATIC',
    chronicle: [
      locale === 'fr' ? 'La campagne du Black Whale commence.' : 'The Black Whale campaign begins.',
    ],
    completed: false,
  }
}

export function currentCampaignScenario(campaign: StrategyCampaignV3) {
  const id = campaign.scenarioIds[campaign.currentScenarioIndex]
  return id ? strategyScenarioById(id) : null
}

function mergeRelationships(
  previous: Record<string, FactionRelationship>,
  incoming: Record<string, FactionRelationship>,
) {
  const result = structuredClone(previous)
  for (const [id, relationship] of Object.entries(incoming)) {
    const old = result[id] ?? initialRelationship()
    result[id] = {
      trust: Math.max(-100, Math.min(100, Math.round((old.trust + relationship.trust) / 2))),
      fear: Math.max(0, Math.min(100, Math.max(old.fear, relationship.fear))),
      pact: relationship.pact,
      betrayed: old.betrayed || relationship.betrayed,
    }
  }
  return result
}

function mergeConditions(
  previous: Record<string, UnitCondition>,
  incoming: Record<string, UnitCondition>,
) {
  const severity: Record<UnitCondition, number> = { READY: 0, WOUNDED: 1, ELIMINATED: 2 }
  const result = { ...previous }
  for (const [id, condition] of Object.entries(incoming)) {
    const old = result[id] ?? 'READY'
    result[id] = severity[condition] > severity[old] ? condition : old
  }
  return result
}

function reputationFor(outcomes: readonly StrategyCampaignOutcome[]): StrategyReputation {
  const relationships = outcomes.flatMap((outcome) => Object.values(outcome.relationships))
  if (relationships.some((relationship) => relationship.betrayed)) return 'TREACHEROUS'
  const trust = relationships.reduce((total, relationship) => total + relationship.trust, 0)
  return trust >= 40 ? 'RELIABLE' : 'PRAGMATIC'
}

function chronicleEntry(outcome: StrategyCampaignOutcome, locale: Locale): string {
  if (locale === 'fr') {
    const result = outcome.won ? 'remporte' : 'perd'
    return `${outcome.selectedFactionId} ${result} ${outcome.scenarioId} en ${outcome.turnsPlayed} tours avec ${outcome.victoryPoints} points d’influence.`
  }
  const result = outcome.won ? 'wins' : 'loses'
  return `${outcome.selectedFactionId} ${result} ${outcome.scenarioId} in ${outcome.turnsPlayed} turns with ${outcome.victoryPoints} influence points.`
}

export function completeCampaignScenario(
  campaign: StrategyCampaignV3,
  outcome: StrategyCampaignOutcome,
  locale: Locale = 'en',
): StrategyCampaignV3 {
  if (campaign.completed) throw new Error('The campaign is already complete')
  const expected = currentCampaignScenario(campaign)
  if (!expected || outcome.scenarioId !== expected.id)
    throw new Error(`Expected campaign scenario ${expected?.id ?? 'none'}`)
  const outcomes = [...campaign.outcomes, structuredClone(outcome)]
  const nextIndex = campaign.currentScenarioIndex + 1
  return {
    ...campaign,
    currentScenarioIndex: nextIndex,
    outcomes,
    relationships: mergeRelationships(campaign.relationships, outcome.relationships),
    unitConditions: mergeConditions(campaign.unitConditions, outcome.unitConditions),
    reputation: reputationFor(outcomes),
    chronicle: [...campaign.chronicle, chronicleEntry(outcome, locale)],
    completed: nextIndex >= campaign.scenarioIds.length,
  }
}
