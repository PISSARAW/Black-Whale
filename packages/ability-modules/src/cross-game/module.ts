import {
  asserted,
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
  shown,
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

  site: {
    kind: 'tribunal',
    instruction:
      'Click one target through Blue admission, Yellow control, reversed Yellow restraint — which wears off — and Red dismissal.',
    rule: 'Restraint activates only after the warning is ignored, prevents movement but not speech, and can be reapplied.',
    cost: 'Brief reusable card effects',
    color: '#f0c94d',
    action: 'Present the Blue card',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Un avertissement ignoré avant chaque entrave', amount: 1, unit: 'avertissement' },

  actions: {
    'blue-card': {
      label: 'Carte bleue — admission',
      evidence: shown('ch. 352 — la carte bleue admet'),
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
      evidence: shown('ch. 352 — l’avertissement précède toujours l’entrave'),
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
      evidence: shown('ch. 352 — la cible ne bouge plus, elle parle encore'),
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
      evidence: shown('ch. 352 — la carte rouge expulse'),
      conditions: [requiresTarget('Une personne est expulsée')],
      effects: [
        constraint({
          rules: ['Expulsion prononcée par carte rouge.'],
          attributes: { card: 'red', procedure: 'expulsion' },
        }),
      ],
    },

    'restrain-without-warning': {
      label: 'Contraindre sans avertissement',
      refusal: 'La procédure exige un avertissement préalable : pas de carte jaune, pas d’entrave',
      evidence: shown('ch. 352 — l’avertissement fait partie de la capacité'),
    },

    'restrain-a-crowd': {
      label: 'Contraindre plusieurs personnes',
      evidence: asserted('la contrainte est brève, réitérable et vise plusieurs cibles'),
      conditions: [requiresTarget('Des personnes sont contraintes')],
      effects: [
        constraint({
          rules: ['La contrainte vise plusieurs cibles à la fois.'],
          attributes: { card: 'yellow', scope: 'multi-target' },
        }),
      ],
    },

    'harm-the-restrained': {
      label: 'Blesser la personne contrainte',
      refusal: 'Cross Game entrave et expulse : c’est un outil judiciaire, pas une arme',
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
