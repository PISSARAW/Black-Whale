import type { ConfrontationDefinition } from './definition'

export interface ConfrontationResult {
  key: string
  title: string
  finding: string
  evidenceIds: string[]
  tone: 'deduction' | 'corroboration' | 'insufficient'
}

const pairKey = (ids: readonly string[]) => [...ids].sort().join(':')

/**
 * Puts two witnesses' declarations side by side under the case's own rules.
 *
 * The key stays the sorted pair of witness ids, whichever confrontation the
 * pair matches, so keys saved before the rules moved into the case still count.
 */
export function confrontWitnesses(
  witnessIds: string[],
  discoveredEvidenceIds: Iterable<string>,
  confrontations: readonly ConfrontationDefinition[],
): ConfrontationResult {
  const key = pairKey(witnessIds)

  if (witnessIds.length !== 2) {
    return {
      key,
      title: 'Deux témoignages requis',
      finding: 'Sélectionnez exactement deux personnes pour confronter leurs déclarations.',
      evidenceIds: [],
      tone: 'insufficient',
    }
  }

  const confrontation = confrontations.find((item) => pairKey(item.subjectIds) === key)
  if (!confrontation) {
    return {
      key,
      title: 'Aucune contradiction exploitable',
      finding:
        'Ces deux déclarations ne portent pas sur le même fait précis. Elles ne suffisent pas à produire une nouvelle déduction.',
      evidenceIds: [],
      tone: 'insufficient',
    }
  }

  const discovered = new Set(discoveredEvidenceIds)
  if (!confrontation.requiredEvidenceIds.every((id) => discovered.has(id))) {
    return {
      key,
      title: 'Déclarations incomplètes',
      finding: confrontation.incompleteFinding,
      evidenceIds: [],
      tone: 'insufficient',
    }
  }

  return {
    key,
    title: confrontation.title,
    finding: confrontation.finding,
    evidenceIds: [...confrontation.evidenceIds],
    tone: confrontation.tone,
  }
}
