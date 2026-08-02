export type DiplomacyAction = 'SHARE_INTEL' | 'PROPOSE_PACT' | 'THREATEN' | 'BETRAY'

export interface DiplomacyOrder {
  factionId: string
  action: DiplomacyAction
}

export interface FactionRelationship {
  trust: number
  fear: number
  pact: boolean
  betrayed: boolean
}

export interface DiplomacyResolution {
  relationship: FactionRelationship
  accepted: boolean
  report: string
}

export const DIPLOMACY_COSTS: Record<DiplomacyAction, number> = {
  SHARE_INTEL: 1,
  PROPOSE_PACT: 2,
  THREATEN: 1,
  BETRAY: 0,
}

export const DIPLOMACY_LABELS: Record<DiplomacyAction, string> = {
  SHARE_INTEL: 'Share intel',
  PROPOSE_PACT: 'Propose pact',
  THREATEN: 'Apply pressure',
  BETRAY: 'Break pact',
}

export function initialRelationship(): FactionRelationship {
  return { trust: 0, fear: 0, pact: false, betrayed: false }
}

export function diplomacyCost(orders: readonly DiplomacyOrder[]): number {
  return orders.reduce((total, order) => total + DIPLOMACY_COSTS[order.action], 0)
}

export function resolveDiplomacy(
  current: FactionRelationship,
  action: DiplomacyAction,
): DiplomacyResolution {
  if (action === 'SHARE_INTEL') {
    return {
      relationship: { ...current, trust: Math.min(100, current.trust + 25) },
      accepted: true,
      report: 'Shared intel improves trust.',
    }
  }
  if (action === 'THREATEN') {
    return {
      relationship: {
        ...current,
        trust: Math.max(-100, current.trust - 25),
        fear: Math.min(100, current.fear + 35),
      },
      accepted: true,
      report: 'Pressure is understood, but trust decreases.',
    }
  }
  if (action === 'BETRAY') {
    return {
      relationship: { trust: -100, fear: current.fear, pact: false, betrayed: true },
      accepted: current.pact,
      report: current.pact
        ? 'The pact is broken. This betrayal will be remembered.'
        : 'No pact to break.',
    }
  }
  const accepted = !current.betrayed && (current.trust >= 20 || current.fear >= 60)
  return {
    relationship: accepted
      ? { ...current, pact: true, trust: Math.min(100, current.trust + 10) }
      : { ...current, trust: Math.max(-100, current.trust - 5) },
    accepted,
    report: accepted
      ? 'The non-aggression pact is accepted.'
      : 'The pact proposal is refused.',
  }
}

export function resolveDiplomacyPlan(input: {
  relationships: Record<string, FactionRelationship>
  orders: readonly DiplomacyOrder[]
  activeFactionIds: readonly string[]
  playerFactionId: string
  factionNames: Record<string, string>
}): { relationships: Record<string, FactionRelationship>; reports: string[]; error?: string } {
  const relationships = structuredClone(input.relationships)
  const reports: string[] = []
  const addressed = new Set<string>()
  for (const order of input.orders) {
    if (
      !input.activeFactionIds.includes(order.factionId) ||
      order.factionId === input.playerFactionId
    )
      return { relationships, reports, error: 'A diplomatic action targets a missing faction.' }
    if (addressed.has(order.factionId))
      return {
        relationships,
        reports,
        error: 'Only one diplomatic action is allowed per faction.',
      }
    addressed.add(order.factionId)
    const resolution = resolveDiplomacy(
      relationships[order.factionId] ?? initialRelationship(),
      order.action,
    )
    relationships[order.factionId] = resolution.relationship
    reports.push(`${input.factionNames[order.factionId] ?? order.factionId} · ${resolution.report}`)
  }
  return { relationships, reports }
}
