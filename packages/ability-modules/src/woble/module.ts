import {
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

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    grow: {
      label: 'Accélérer la croissance',
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

    stop: {
      label: 'Cesser l’amplification',
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
