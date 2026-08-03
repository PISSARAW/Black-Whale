import {
  asserted,
  auraModifier,
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  effectIsLive,
  isConscious,
  numberParam,
  person,
  requiresParameter,
  requiresTarget,
  setEffectState,
  shown,
} from '@black-whale/ability-sdk'

/**
 * Erigeron — Bill
 *
 * Accelerated growth, and the part that matters to the Woble camp: he can boost
 * somebody else's ability. The boost is weak on the untrained, which is a real
 * limit and lives on the effect rather than in a caveat.
 */
export const erigeron = defineAbility({
  id: 'erigeron',
  name: 'Erigeron',
  owner: 'bill',
  category: 'enhancer',

  site: {
    kind: 'growth',
    instruction:
      'Click targets to accelerate growth; ordinary page life germinates quickly while character Nen develops in smaller increments.',
    rule: 'Growth is dramatic on plants but deliberately weak on inexperienced living Nen users.',
    cost: 'Palms near the living target · repeated treatment',
    color: '#7fd35b',
    action: 'Accelerate growth',
  },

  arena: {
    effect: 'restore',
    cost: 14,
    persistent: false,
    condition: 'living-target',
    risk: 'slow-on-humans',
    mechanic: 'growth',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    grow: {
      label: 'Accélérer la croissance',
      evidence: shown('ch. 380 — la croissance accélérée à la paume'),
      conditions: [requiresTarget('Un être vivant est visé')],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'growth',
          attributes: (ctx) => ({
            accelerationFactor: numberParam(ctx, 'accelerationFactor') ?? 1,
            requiresPalmContact: true,
          }),
        }),
      ],
    },

    boost: {
      label: 'Amplifier une capacité',
      evidence: shown('ch. 380 — le soutien discret du camp Woble'),
      conditions: [
        requiresTarget('Un utilisateur est amplifié'),
        requiresParameter('targetAbilityId', 'La capacité amplifiée est identifiée'),
      ],
      effects: [
        auraModifier({
          mode: 'BOOST',
          // Canon limit: on someone untrained, the gain is marginal.
          effectiveness: 'proportional-to-training',
        }),
      ],
      cost: { label: 'Effet faible sur les non-entraînés', unit: 'efficacité' },
    },

    'boost-at-a-distance': {
      label: 'Amplifier sans contact',
      refusal: 'La capacité passe par la paume : sans contact, rien ne se transmet',
      evidence: shown('ch. 380 — le contact est montré à chaque usage'),
    },

    'boost-an-untrained-user': {
      label: 'Amplifier un non-entraîné',
      // Not a refusal: it works, badly. The cost line says how badly.
      evidence: shown('ch. 380 — le gain est marginal sur qui n’est pas entraîné'),
      conditions: [requiresTarget('Un non-entraîné est amplifié')],
      effects: [auraModifier({ mode: 'BOOST', effectiveness: 'marginal' })],
      cost: { label: 'Gain marginal, aura dépensée pareil', unit: 'efficacité' },
    },

    stop: {
      label: 'Cesser l’amplification',
      evidence: asserted('l’amplification s’arrête quand il retire la main'),
      conditions: [effectIsLive('effectId', 'Une amplification est en cours')],
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  ui: { componentKey: 'BoostGauge' },

  interactionManifest: buildManifest('erigeron', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'OBJECT'],
    overlays: ['AURA'],
    entryActions: ['grow'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'BoostGauge',
  }),
})
