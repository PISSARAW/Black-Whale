import type { Locale } from '$lib/i18n'
import type { ReportDefinition } from '../definition'

/** The Eleven seconds report, in both languages. It used to be French-only inside `report.ts`. */
export function elevenSecondsReport(
  locale: Locale,
  requiredHypothesisId: string,
): ReportDefinition {
  if (locale === 'fr') {
    return {
      requiredHypothesisId,
      disposition: 'Mécanisme établi · auteur non identifié',
      mechanism: [
        'Une poupée visible seulement par Loberry et son utilisateur provoque la diversion.',
        'Quatre créatures matérialisées, visibles de tous, se fixent au cou de Barrigen.',
        'Leur action simultanée le vide de son sang en environ onze secondes.',
        'La capacité est déclenchée et dirigée à distance par un utilisateur caché.',
      ],
      unknowns: [
        "L'identité de l'utilisateur de Silent Majority",
        'Son affiliation parmi les factions présentes',
        'Son mobile exact et sa prochaine cible',
        'Les quatre utilisateurs de Nen qui ne se sont pas déclarés',
      ],
    }
  }
  return {
    requiredHypothesisId,
    disposition: 'Mechanism established · perpetrator unidentified',
    mechanism: [
      'A doll visible only to Loberry and its user creates the diversion.',
      'Four materialised creatures, visible to everyone, attach themselves to Barrigen’s neck.',
      'Acting together, they drain his blood in about eleven seconds.',
      'The ability is triggered and directed remotely by a hidden user.',
    ],
    unknowns: [
      'The identity of the Silent Majority user',
      'Their affiliation among the factions present',
      'Their exact motive and next target',
      'The four Nen users who did not declare themselves',
    ],
  }
}
