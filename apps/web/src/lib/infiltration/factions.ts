import type { Witness, WitnessId } from './state'

export type InfiltrationFactionId = 'royal-staff' | 'security' | 'hunter-association'

export interface FactionReport {
  id: string
  witnessId: WitnessId
  spaceId: string | null
  certainty: number
}

export type FactionKnowledge = Record<InfiltrationFactionId, FactionReport[]>

export const emptyFactionKnowledge = (): FactionKnowledge => ({
  'royal-staff': [],
  security: [],
  'hunter-association': [],
})

const CONTACTS: Record<InfiltrationFactionId, InfiltrationFactionId[]> = {
  'royal-staff': ['royal-staff', 'security'],
  security: ['security', 'royal-staff'],
  'hunter-association': ['hunter-association', 'security'],
}

/** Routes a witness report only through that faction's declared contacts. */
export function circulateFactionReport(
  knowledge: FactionKnowledge,
  report: FactionReport,
  witness: Pick<Witness, 'faction'>,
): FactionKnowledge {
  const next = { ...knowledge }
  for (const factionId of CONTACTS[witness.faction]) {
    if (next[factionId].some((item) => item.id === report.id)) continue
    next[factionId] = [...next[factionId], report]
  }
  return next
}
