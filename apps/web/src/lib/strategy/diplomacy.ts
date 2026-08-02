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
  SHARE_INTEL: 'Partager un renseignement',
  PROPOSE_PACT: 'Proposer un pacte',
  THREATEN: 'Faire pression',
  BETRAY: 'Rompre le pacte',
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
      report: 'Le renseignement partagé améliore la confiance.',
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
      report: 'La pression est comprise, mais la confiance recule.',
    }
  }
  if (action === 'BETRAY') {
    return {
      relationship: { trust: -100, fear: current.fear, pact: false, betrayed: true },
      accepted: current.pact,
      report: current.pact
        ? 'Le pacte est rompu. Cette trahison sera mémorisée.'
        : 'Aucun pacte à rompre.',
    }
  }
  const accepted = !current.betrayed && (current.trust >= 20 || current.fear >= 60)
  return {
    relationship: accepted
      ? { ...current, pact: true, trust: Math.min(100, current.trust + 10) }
      : { ...current, trust: Math.max(-100, current.trust - 5) },
    accepted,
    report: accepted
      ? 'Le pacte de non-agression est accepté.'
      : 'La proposition de pacte est refusée.',
  }
}
