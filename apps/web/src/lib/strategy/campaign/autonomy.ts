import type { Locale } from '$lib/i18n/config'
import type {
  StrategyAutonomousThread,
  StrategyCampaignOutcome,
  StrategyThreadStage,
} from './types'

export function initialAutonomousThreads(): StrategyAutonomousThread[] {
  return [
    {
      id: 'benjamin-succession-pressure',
      kind: 'SUCCESSION',
      actorId: 'prince-benjamin',
      pressure: 0,
      stage: 'DORMANT',
      lastScenarioId: null,
    },
    {
      id: 'camilla-guardian-retaliation',
      kind: 'GUARDIAN_NEN',
      actorId: 'prince-camilla',
      pressure: 0,
      stage: 'DORMANT',
      lastScenarioId: null,
    },
    {
      id: 'morena-contagion-network',
      kind: 'MAFIA',
      actorId: 'morena-prudo',
      pressure: 0,
      stage: 'DORMANT',
      lastScenarioId: null,
    },
  ]
}

function stageFor(pressure: number, eliminated: boolean): StrategyThreadStage {
  if (eliminated) return 'RESOLVED'
  if (pressure >= 5) return 'CRISIS'
  if (pressure >= 3) return 'ESCALATING'
  if (pressure >= 1) return 'MANEUVERING'
  return 'DORMANT'
}

function pressureDelta(thread: StrategyAutonomousThread, outcome: StrategyCampaignOutcome): number {
  if (thread.actorId === outcome.selectedFactionId) return outcome.won ? 0 : -1
  const relationship = outcome.relationships[thread.actorId]
  return (
    1 +
    Number(relationship?.betrayed === true) * 2 +
    Number((relationship?.trust ?? 0) < 0) +
    Number((relationship?.fear ?? 0) >= 60)
  )
}

/** Advance every off-screen plot from deterministic campaign consequences. */
export function advanceAutonomousThreads(
  current: readonly StrategyAutonomousThread[],
  outcome: StrategyCampaignOutcome,
): StrategyAutonomousThread[] {
  return current.map((thread) => {
    if (thread.stage === 'RESOLVED') return thread
    const eliminated = outcome.unitConditions[thread.actorId] === 'ELIMINATED'
    const pressure = eliminated
      ? thread.pressure
      : Math.max(0, Math.min(6, thread.pressure + pressureDelta(thread, outcome)))
    return {
      ...thread,
      pressure,
      stage: stageFor(pressure, eliminated),
      lastScenarioId: outcome.scenarioId,
    }
  })
}

export function autonomousChronicleEntries(
  before: readonly StrategyAutonomousThread[],
  after: readonly StrategyAutonomousThread[],
  locale: Locale,
): string[] {
  const previous = new Map(before.map((thread) => [thread.id, thread]))
  return after.flatMap((thread) => {
    const old = previous.get(thread.id)
    if (old?.pressure === thread.pressure && old.stage === thread.stage) return []
    if (locale === 'fr')
      return [
        `${thread.actorId} fait évoluer l’intrigue ${thread.kind} vers ${thread.stage} (pression ${thread.pressure}).`,
      ]
    return [
      `${thread.actorId} advances the ${thread.kind} plot to ${thread.stage} (pressure ${thread.pressure}).`,
    ]
  })
}
