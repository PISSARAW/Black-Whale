import type { Evidence, InvestigationCase, Verdict } from './case'

export interface FinalReport {
  caseId: string
  title: string
  disposition: string
  mechanism: string[]
  established: Evidence[]
  deductions: Evidence[]
  testimony: Evidence[]
  rejectedHypotheses: string[]
  unknowns: string[]
}

export function buildFinalReport(investigation: InvestigationCase, verdict: Verdict): FinalReport {
  const supporting = verdict.supporting
  return {
    caseId: investigation.id,
    title: investigation.title,
    disposition:
      verdict.status === 'solved'
        ? 'Mécanisme établi · auteur non identifié'
        : 'Rapport provisoire · preuves insuffisantes',
    mechanism: [
      'Une poupée visible seulement par Loberry et son utilisateur provoque la diversion.',
      'Quatre créatures matérialisées, visibles de tous, se fixent au cou de Barrigen.',
      'Leur action simultanée le vide de son sang en environ onze secondes.',
      'La capacité est déclenchée et dirigée à distance par un utilisateur caché.',
    ],
    established: supporting.filter((evidence) => evidence.truthStatus === 'CONFIRMED'),
    deductions: supporting.filter((evidence) => evidence.truthStatus === 'DEDUCTION'),
    testimony: supporting.filter((evidence) => evidence.truthStatus === 'STRONGLY_IMPLIED'),
    rejectedHypotheses: investigation.hypotheses
      .filter((hypothesis) => hypothesis.id !== investigation.canonicalHypothesisId)
      .map((hypothesis) => hypothesis.label),
    unknowns: [
      "L'identité de l'utilisateur de Silent Majority",
      'Son affiliation parmi les factions présentes',
      'Son mobile exact et sa prochaine cible',
      'Les quatre utilisateurs de Nen qui ne se sont pas déclarés',
    ],
  }
}
