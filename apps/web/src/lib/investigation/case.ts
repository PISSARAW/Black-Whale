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
  title: 'Les aiguilles invisibles',
  subtitle: 'Incident de la chambre 1014',
  location: 'Tier 1 · Appartement 1014',
  chapter: 370,
  objective: "Déterminer ce que les faits permettent d'affirmer sur l'attaque.",
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
      id: 'oito',
      name: 'Oito',
      role: 'Témoin protégé',
      status: 'Non-initiée au Nen · bouleversée',
      color: 0xe8a6c8,
      posOffset: [0, -2],
      dialogue:
        "Tout le monde était dans la pièce. Personne n'est entré ou sorti entre le cri et la chute du garde.",
      evidenceIds: ['sealed-room'],
    },
    {
      id: 'body',
      name: 'Corps du garde',
      role: 'Victime',
      status: 'À examiner',
      color: 0x7f1d1d,
      posOffset: [0, 2],
      isDead: true,
      dialogue:
        'De nombreuses perforations minuscules entourent les zones vitales. Leur régularité exclut une chute accidentelle.',
      evidenceIds: ['wounds', 'death-window'],
    },
  ],
  evidence: [
    {
      id: 'wounds',
      title: 'Perforations multiples',
      claim: 'La victime a subi une attaque répétée par des objets très fins.',
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
      title: 'Fenêtre de onze secondes',
      claim: "L'effondrement suit immédiatement le cri; l'attaque est déjà en cours.",
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
      title: 'Aucun contact visible',
      claim: "Bill n'a vu ni arme, ni projectile, ni contact avec la victime.",
      source: 'Témoignage de Bill',
      chapter: 370,
      kind: 'TESTIMONY',
      method: 'TOLD_BY_OTHER',
      truthStatus: 'STRONGLY_IMPLIED',
      reliability: 'UNVERIFIED',
      subjectId: 'bill',
    },
    {
      id: 'sealed-room',
      title: 'Pièce sous surveillance',
      claim: "Aucun assaillant visible n'est entré ou sorti pendant l'incident.",
      source: "Témoignage d'Oito",
      chapter: 370,
      kind: 'TESTIMONY',
      method: 'TOLD_BY_OTHER',
      truthStatus: 'STRONGLY_IMPLIED',
      reliability: 'UNVERIFIED',
      subjectId: 'oito',
    },
    {
      id: 'nen-residue',
      title: "Anomalie d'aura",
      claim:
        "Les blessures et l'absence d'arme ordinaire sont compatibles avec une capacité de Nen dissimulée.",
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
      label: 'Une arme ordinaire a été lancée',
      explanation:
        "Cette piste explique les blessures, mais pas l'absence de projectile ou de contact visible.",
      requiredEvidenceIds: ['wounds'],
      contradictionEvidenceIds: ['bill-testimony', 'sealed-room'],
    },
    {
      id: 'accident',
      label: "Il s'agit d'un accident",
      explanation: "La régularité et le nombre des perforations rendent l'accident intenable.",
      requiredEvidenceIds: [],
      contradictionEvidenceIds: ['wounds', 'death-window'],
    },
    {
      id: 'hidden-nen',
      label: 'Une capacité de Nen invisible a frappé à distance',
      explanation:
        "Cette conclusion explique simultanément les blessures, l'absence de contact et la pièce surveillée. Elle ne permet pas encore d'identifier l'utilisateur.",
      requiredEvidenceIds: ['wounds', 'bill-testimony', 'sealed-room', 'nen-residue'],
      contradictionEvidenceIds: [],
    },
  ],
  canonicalHypothesisId: 'hidden-nen',
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
      ? "Les faits établissent le mécanisme de l'attaque, mais l'identité de l'utilisateur reste inconnue à ce stade."
      : 'Cette hypothèse est compatible avec les éléments choisis, sans constituer la meilleure explication du dossier.',
    supporting,
    missing,
    contradictions,
  }
}
