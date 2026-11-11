import type { Locale } from '$lib/i18n'
import type { ConclusionDefinition } from '../definition'

export function elevenSecondsConclusion(locale: Locale): ConclusionDefinition {
  return {
    dimensions: [
      {
        id: 'mechanism',
        label: localized(locale, 'Mécanisme', 'Mechanism'),
        options: [
          {
            id: 'ordinary-animals',
            label: localized(locale, 'Animaux ordinaires', 'Ordinary animals'),
            hypothesisIds: ['ordinary-weapon'],
          },
          {
            id: 'nen-constructs',
            label: localized(
              locale,
              'Créatures matérialisées par le Nen',
              'Nen-materialized creatures',
            ),
            hypothesisIds: ['hidden-nen'],
          },
          {
            id: 'witness-action',
            label: localized(locale, 'Action directe du témoin', 'Direct witness action'),
            hypothesisIds: ['accident'],
          },
        ],
      },
      {
        id: 'operation',
        label: localized(locale, 'Mode opératoire', 'Operation'),
        options: [
          {
            id: 'physical-attack',
            label: localized(locale, 'Attaque physique spontanée', 'Spontaneous physical attack'),
            hypothesisIds: ['ordinary-weapon'],
          },
          {
            id: 'remote-coordination',
            label: localized(
              locale,
              'Commande coordonnée à distance',
              'Coordinated remote control',
            ),
            hypothesisIds: ['hidden-nen'],
          },
          {
            id: 'direct-assault',
            label: localized(locale, 'Agression depuis la pièce', 'Assault from inside the room'),
            hypothesisIds: ['accident'],
          },
        ],
      },
      {
        id: 'attribution',
        label: localized(locale, 'Attribution', 'Attribution'),
        options: [
          {
            id: 'no-user',
            label: localized(locale, 'Aucun utilisateur requis', 'No user required'),
            hypothesisIds: ['ordinary-weapon'],
          },
          {
            id: 'unknown-user',
            label: localized(locale, 'Utilisateur caché non identifié', 'Unidentified hidden user'),
            hypothesisIds: ['hidden-nen'],
          },
          {
            id: 'loberry-user',
            label: localized(locale, 'Loberry contrôle l’attaque', 'Loberry controls the attack'),
            hypothesisIds: ['accident'],
          },
        ],
      },
    ],
  }
}

function localized(locale: Locale, french: string, english: string) {
  return locale === 'fr' ? french : english
}
