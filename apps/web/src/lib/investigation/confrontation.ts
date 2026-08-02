export interface ConfrontationResult {
  key: string
  title: string
  finding: string
  evidenceIds: string[]
  tone: 'deduction' | 'corroboration' | 'insufficient'
}

const pairKey = (ids: string[]) => [...ids].sort().join(':')

export function confrontWitnesses(
  witnessIds: string[],
  discoveredEvidenceIds: Iterable<string>,
): ConfrontationResult {
  const key = pairKey(witnessIds)
  const discovered = new Set(discoveredEvidenceIds)

  if (witnessIds.length !== 2) {
    return {
      key,
      title: 'Deux témoignages requis',
      finding: 'Sélectionnez exactement deux personnes pour confronter leurs déclarations.',
      evidenceIds: [],
      tone: 'insufficient',
    }
  }

  if (key === 'furykov:loberry') {
    if (!discovered.has('loberry-vision') || !discovered.has('bill-testimony')) {
      return {
        key,
        title: 'Déclarations incomplètes',
        finding: "Interrogez d'abord Loberry sur la poupée et un témoin sur les créatures.",
        evidenceIds: [],
        tone: 'insufficient',
      }
    }
    return {
      key,
      title: 'Deux règles de visibilité',
      finding:
        'Loberry voit la poupée derrière Furykov; Furykov ne la voit pas. Tous voient ensuite les créatures. La poupée et les attaquants obéissent donc à deux conditions de perception distinctes.',
      evidenceIds: ['visibility-split'],
      tone: 'deduction',
    }
  }

  if (key === 'bill:sakata') {
    if (!discovered.has('bill-testimony')) {
      return {
        key,
        title: 'Déclarations incomplètes',
        finding: "Recueillez d'abord ce que Bill ou Sakata a vu pendant l'attaque.",
        evidenceIds: [],
        tone: 'insufficient',
      }
    }
    return {
      key,
      title: 'Observation corroborée',
      finding:
        'Leurs récits concordent: les quatre créatures étaient matérielles, visibles et assez solides pour être visées et saisies.',
      evidenceIds: [],
      tone: 'corroboration',
    }
  }

  return {
    key,
    title: 'Aucune contradiction exploitable',
    finding:
      'Ces deux déclarations ne portent pas sur le même fait précis. Elles ne suffisent pas à produire une nouvelle déduction.',
    evidenceIds: [],
    tone: 'insufficient',
  }
}
