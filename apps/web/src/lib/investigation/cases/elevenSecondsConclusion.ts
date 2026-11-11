import type { Locale } from '$lib/i18n'
import type { ConclusionDefinition } from '../definition'

export function elevenSecondsConclusion(locale: Locale): ConclusionDefinition {
  const fr = locale === 'fr'
  return {
    dimensions: [
      {
        id: 'mechanism',
        label: fr ? 'Mécanisme' : 'Mechanism',
        options: [
          {
            id: 'ordinary-animals',
            label: fr ? 'Animaux ordinaires' : 'Ordinary animals',
            hypothesisIds: ['ordinary-weapon'],
          },
          {
            id: 'nen-constructs',
            label: fr ? 'Créatures matérialisées par le Nen' : 'Nen-materialized creatures',
            hypothesisIds: ['hidden-nen'],
          },
          {
            id: 'witness-action',
            label: fr ? 'Action directe du témoin' : 'Direct witness action',
            hypothesisIds: ['accident'],
          },
        ],
      },
      {
        id: 'operation',
        label: fr ? 'Mode opératoire' : 'Operation',
        options: [
          {
            id: 'physical-attack',
            label: fr ? 'Attaque physique spontanée' : 'Spontaneous physical attack',
            hypothesisIds: ['ordinary-weapon'],
          },
          {
            id: 'remote-coordination',
            label: fr ? 'Commande coordonnée à distance' : 'Coordinated remote control',
            hypothesisIds: ['hidden-nen'],
          },
          {
            id: 'direct-assault',
            label: fr ? 'Agression depuis la pièce' : 'Assault from inside the room',
            hypothesisIds: ['accident'],
          },
        ],
      },
      {
        id: 'attribution',
        label: fr ? 'Attribution' : 'Attribution',
        options: [
          {
            id: 'no-user',
            label: fr ? 'Aucun utilisateur requis' : 'No user required',
            hypothesisIds: ['ordinary-weapon'],
          },
          {
            id: 'unknown-user',
            label: fr ? 'Utilisateur caché non identifié' : 'Unidentified hidden user',
            hypothesisIds: ['hidden-nen'],
          },
          {
            id: 'loberry-user',
            label: fr ? 'Loberry contrôle l’attaque' : 'Loberry controls the attack',
            hypothesisIds: ['accident'],
          },
        ],
      },
    ],
  }
}
