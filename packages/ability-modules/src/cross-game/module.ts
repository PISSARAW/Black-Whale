import {
  buildManifest,
  canUseNen,
  constraint,
  declaredFlag,
  defineAbility,
  effectIsLive,
  isConscious,
  knowledgeGrant,
  person,
  requiresTarget,
  setEffectState,
} from '@black-whale/ability-sdk'

/**
 * Cross Game — Mizaistom Nana
 *
 * Three cards, three procedures: blue admits, yellow restrains, red expels. The
 * value on the site is bureaucratic rather than spectacular — every use
 * documents who was warned, when, and by which card, which is exactly what the
 * Zodiacs' judicial work needs to be readable.
 */
export const crossGame = defineAbility({
  id: 'cross-game',
  name: 'Cross Game',
  owner: 'mizaistom-nana',
  category: 'conjurer',

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Un avertissement ignoré avant chaque entrave', amount: 1, unit: 'avertissement' },

  actions: {
    'blue-card': {
      label: 'Carte bleue — admission',
      conditions: [requiresTarget('Une personne est admise')],
      effects: [
        constraint({
          rules: ['Admission accordée par carte bleue.'],
          attributes: { card: 'blue', procedure: 'admission' },
        }),
      ],
    },

    'yellow-card': {
      label: 'Carte jaune — avertissement',
      conditions: [requiresTarget('Une personne est avertie')],
      effects: [
        constraint({
          rules: ['Avertissement notifié avant toute contrainte.'],
          attributes: { card: 'yellow', procedure: 'warning' },
        }),
        // The warning is a fact, so "was she warned?" has an answer later.
        knowledgeGrant({
          factId: (ctx) => `warned:${ctx.targets[0] ?? 'unknown'}`,
          observerId: (ctx) => ctx.targets[0] ?? ctx.actorId,
          state: 'KNOWN',
        }),
      ],
    },

    restraint: {
      label: 'Contrainte',
      conditions: [
        requiresTarget('Une personne est contrainte'),
        // Canon procedure: no restraint without a prior warning.
        declaredFlag('warned', true, 'La cible a reçu un avertissement préalable'),
      ],
      effects: [
        constraint({
          rules: [
            'La cible ne peut plus se déplacer.',
            'Elle peut toujours parler.',
            'La contrainte est brève et réitérable.',
          ],
          attributes: { card: 'yellow', shape: 'parallelepiped', canSpeak: true },
        }),
      ],
    },

    'red-card': {
      label: 'Carte rouge — expulsion',
      conditions: [requiresTarget('Une personne est expulsée')],
      effects: [
        constraint({
          rules: ['Expulsion prononcée par carte rouge.'],
          attributes: { card: 'red', procedure: 'expulsion' },
        }),
      ],
    },

    release: {
      label: 'Lever la contrainte',
      conditions: [effectIsLive('effectId', 'Une contrainte est en cours')],
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  ui: { componentKey: 'CrossGameCards' },

  interactionManifest: buildManifest('cross-game', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'LOCATION'],
    overlays: ['RANGE', 'CONTROL_LINK'],
    entryActions: ['blue-card', 'yellow-card', 'red-card'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'CrossGameCards',
  }),
})
