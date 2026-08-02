// Mirrors the domain vocabulary while keeping this client-only vertical slice
// runnable before the workspace packages have been built.
type AcquisitionMethod =
  | 'DIRECT_OBSERVATION'
  | 'TOLD_BY_OTHER'
  | 'DEDUCTION'
  | 'NEN_ABILITY'
  | 'DOCUMENT'
  | 'RUMOR'
  | 'UNKNOWN'
type TruthStatus = 'CONFIRMED' | 'STRONGLY_IMPLIED' | 'DEDUCTION' | 'CONTESTED'

export type EvidenceKind = 'OBSERVATION' | 'TESTIMONY' | 'NEN' | 'TIMELINE'
export type InvestigationTab = 'evidence' | 'people' | 'timeline' | 'deduction'

export interface Evidence {
  id: string
  title: string
  claim: string
  source: string
  chapter: number
  kind: EvidenceKind
  method: AcquisitionMethod
  truthStatus: TruthStatus
  reliability: 'TRUSTED' | 'UNVERIFIED' | 'DECEPTIVE' | 'UNKNOWN'
  subjectId: string
}

export interface InvestigationSubject {
  id: string
  name: string
  role: string
  status: string
  color: number
  posOffset: readonly [number, number]
  isDead?: boolean
  dialogue: string
  evidenceIds: string[]
}

export interface Hypothesis {
  id: string
  label: string
  explanation: string
  requiredEvidenceIds: string[]
  contradictionEvidenceIds: string[]
}

export interface InvestigationCase {
  id: string
  title: string
  subtitle: string
  location: string
  chapter: number
  objective: string
  investigator: string
  subjects: InvestigationSubject[]
  evidence: Evidence[]
  hypotheses: Hypothesis[]
  canonicalHypothesisId: string
  objectives: { id: string; label: string; requiredEvidenceIds: string[] }[]
}

export interface Verdict {
  status: 'insufficient' | 'plausible' | 'contradicted' | 'solved'
  title: string
  summary: string
  supporting: Evidence[]
  missing: Evidence[]
  contradictions: Evidence[]
}

export const room1014Case: InvestigationCase = {
  id: 'room-1014-silent-majority',
  title: 'Onze secondes',
  subtitle: 'Incident de la chambre 1014',
  location: 'Tier 1 · Appartement 1014',
  chapter: 370,
  objective: "Établir le mécanisme de l'attaque sans prétendre connaître l'assassin.",
  investigator: 'Kurapika',
  subjects: [
    {
      id: 'kurapika',
      name: 'Kurapika',
      role: 'Enquêteur',
      status: 'Utilisateur de Nen · attentif',
      color: 0xffd166,
      posOffset: [2, 0],
      dialogue:
        'Une attaque a eu lieu au milieu du groupe. Ne confondons pas ce que nous soupçonnons avec ce que nous pouvons prouver.',
      evidenceIds: ['nen-residue'],
    },
    {
      id: 'bill',
      name: 'Bill',
      role: 'Témoin',
      status: 'Utilisateur de Nen · coopératif',
      color: 0x83d483,
      posOffset: [-2, 1],
      dialogue:
        "J'étais face à la pièce. J'ai vu le garde s'effondrer, mais aucune arme ni aucun assaillant ne l'a touché.",
      evidenceIds: ['bill-testimony'],
    },
    {
      id: 'loberry',
      name: 'Loberry',
      role: 'Témoin central',
      status: 'Possédée · seule à voir la poupée',
      color: 0xe8a6c8,
      posOffset: [0, -2],
      dialogue:
        "Une fille masquée se tenait derrière Furykov. Je vous jure qu'elle était là, mais personne d'autre ne semblait la voir.",
      evidenceIds: ['loberry-vision'],
    },
    {
      id: 'body',
      name: 'Corps de Barrigen',
      role: 'Victime',
      status: 'À examiner',
      color: 0x7f1d1d,
      posOffset: [0, 2],
      isDead: true,
      dialogue:
        'Le corps est exsangue. Quatre créatures blanches se sont fixées à son cou; les gardes ont pu les voir et tenter de les arracher.',
      evidenceIds: ['wounds', 'death-window'],
    },
  ],
  evidence: [
    {
      id: 'wounds',
      title: 'Perforations multiples',
      claim: 'Quatre créatures matérialisées ont perforé Barrigen et drainé son sang.',
      source: 'Examen du corps',
      chapter: 370,
      kind: 'OBSERVATION',
      method: 'DIRECT_OBSERVATION',
      truthStatus: 'CONFIRMED',
      reliability: 'TRUSTED',
      subjectId: 'body',
    },
    {
      id: 'death-window',
      title: 'Onze secondes',
      claim:
        "Quatre créatures agissant ensemble n'ont besoin que d'environ onze secondes pour tuer.",
      source: 'État du corps et séquence observée',
      chapter: 370,
      kind: 'TIMELINE',
      method: 'DEDUCTION',
      truthStatus: 'DEDUCTION',
      reliability: 'TRUSTED',
      subjectId: 'body',
    },
    {
      id: 'bill-testimony',
      title: 'Créatures visibles',
      claim:
        'Bill et les gardes ont vu les créatures blanches et tenté de les arracher à la victime.',
      source: 'Témoignage de Bill',
      chapter: 370,
      kind: 'TESTIMONY',
      method: 'TOLD_BY_OTHER',
      truthStatus: 'STRONGLY_IMPLIED',
      reliability: 'UNVERIFIED',
      subjectId: 'bill',
    },
    {
      id: 'loberry-vision',
      title: 'La poupée que personne ne voit',
      claim:
        "Loberry est la seule témoin à voir la poupée masquée qui détourne l'attention du groupe.",
      source: 'Témoignage de Loberry',
      chapter: 370,
      kind: 'TESTIMONY',
      method: 'TOLD_BY_OTHER',
      truthStatus: 'STRONGLY_IMPLIED',
      reliability: 'UNVERIFIED',
      subjectId: 'loberry',
    },
    {
      id: 'nen-residue',
      title: "Anomalie d'aura",
      claim:
        'Les attaquants sont matérialisés et dirigés à distance; la poupée suit une règle de visibilité différente.',
      source: 'Analyse de Kurapika',
      chapter: 370,
      kind: 'NEN',
      method: 'NEN_ABILITY',
      truthStatus: 'DEDUCTION',
      reliability: 'TRUSTED',
      subjectId: 'kurapika',
    },
  ],
  hypotheses: [
    {
      id: 'ordinary-weapon',
      label: 'Des animaux ordinaires ont attaqué Barrigen',
      explanation:
        "Cette piste n'explique ni la vitesse du drainage, ni la poupée visible par une seule personne.",
      requiredEvidenceIds: ['wounds'],
      contradictionEvidenceIds: ['death-window', 'loberry-vision', 'nen-residue'],
    },
    {
      id: 'accident',
      label: 'Loberry a elle-même tué Barrigen',
      explanation:
        "Son témoignage est central, mais voir la poupée ne démontre pas qu'elle contrôle les créatures.",
      requiredEvidenceIds: [],
      contradictionEvidenceIds: ['bill-testimony', 'nen-residue'],
    },
    {
      id: 'hidden-nen',
      label: 'Un utilisateur caché a déclenché une capacité de Nen à distance',
      explanation:
        "Cette conclusion relie la diversion imposée à Loberry, les quatre créatures matérialisées et la mise à mort coordonnée. Elle ne révèle pas l'identité de l'utilisateur.",
      requiredEvidenceIds: [
        'wounds',
        'death-window',
        'bill-testimony',
        'loberry-vision',
        'nen-residue',
      ],
      contradictionEvidenceIds: [],
    },
  ],
  canonicalHypothesisId: 'hidden-nen',
  objectives: [
    {
      id: 'inspect-victim',
      label: 'Établir la cause de la mort',
      requiredEvidenceIds: ['wounds', 'death-window'],
    },
    {
      id: 'compare-witnesses',
      label: 'Comparer ce que chacun pouvait voir',
      requiredEvidenceIds: ['bill-testimony', 'loberry-vision'],
    },
    {
      id: 'identify-method',
      label: 'Qualifier le mécanisme de Nen',
      requiredEvidenceIds: ['nen-residue'],
    },
  ],
}

export function evaluateHypothesis(
  investigation: InvestigationCase,
  hypothesisId: string,
  selectedEvidenceIds: Iterable<string>,
): Verdict {
  const hypothesis = investigation.hypotheses.find((item) => item.id === hypothesisId)
  if (!hypothesis) throw new Error(`Unknown hypothesis: ${hypothesisId}`)

  const selected = new Set(selectedEvidenceIds)
  const evidenceById = new Map(investigation.evidence.map((item) => [item.id, item]))
  const supporting = hypothesis.requiredEvidenceIds
    .filter((id) => selected.has(id))
    .map((id) => evidenceById.get(id)!)
  const missing = hypothesis.requiredEvidenceIds
    .filter((id) => !selected.has(id))
    .map((id) => evidenceById.get(id)!)
  const contradictions = hypothesis.contradictionEvidenceIds
    .filter((id) => selected.has(id))
    .map((id) => evidenceById.get(id)!)

  if (contradictions.length > 0) {
    return {
      status: 'contradicted',
      title: 'Hypothèse contredite',
      summary: `${contradictions.length} élément${contradictions.length > 1 ? 's' : ''} résiste à cette reconstruction.`,
      supporting,
      missing,
      contradictions,
    }
  }

  if (missing.length > 0) {
    return {
      status: supporting.length > 0 ? 'plausible' : 'insufficient',
      title: supporting.length > 0 ? 'Piste plausible, preuve incomplète' : 'Dossier insuffisant',
      summary: `Il manque ${missing.length} élément${missing.length > 1 ? 's' : ''} nécessaire${missing.length > 1 ? 's' : ''} pour soutenir cette conclusion.`,
      supporting,
      missing,
      contradictions,
    }
  }

  const isCanonical = hypothesis.id === investigation.canonicalHypothesisId
  return {
    status: isCanonical ? 'solved' : 'plausible',
    title: isCanonical ? 'Conclusion démontrée' : 'Conclusion possible',
    summary: isCanonical
      ? "Les faits établissent une attaque de Nen matérialisée et commandée à distance, mais l'identité de l'utilisateur reste inconnue à ce stade."
      : 'Cette hypothèse est compatible avec les éléments choisis, sans constituer la meilleure explication du dossier.',
    supporting,
    missing,
    contradictions,
  }
}
