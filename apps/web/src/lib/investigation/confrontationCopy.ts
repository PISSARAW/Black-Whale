import type { Locale } from '$lib/i18n/config'

export interface ConfrontationCopy {
  needTwo: { title: string; finding: string }
  unrelated: { title: string; finding: string }
  incompleteTitle: string
}

/** What a confrontation says when it yields nothing, in the visitor's language. */
export function confrontationCopy(locale: Locale): ConfrontationCopy {
  return locale === 'fr'
    ? {
        needTwo: {
          title: 'Deux témoignages requis',
          finding: 'Sélectionnez exactement deux personnes pour confronter leurs déclarations.',
        },
        unrelated: {
          title: 'Aucune contradiction exploitable',
          finding:
            'Ces deux déclarations ne portent pas sur le même fait précis. Elles ne suffisent pas à produire une nouvelle déduction.',
        },
        incompleteTitle: 'Déclarations incomplètes',
      }
    : {
        needTwo: {
          title: 'Two statements required',
          finding: 'Select exactly two people to compare their statements.',
        },
        unrelated: {
          title: 'No exploitable contradiction',
          finding:
            'These two statements do not bear on the same precise fact. They are not enough to produce a new deduction.',
        },
        incompleteTitle: 'Incomplete statements',
      }
}
