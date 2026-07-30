import {
  auraModifier,
  buildManifest,
  canUseNen,
  controlLink,
  defineAbility,
  effect,
  effectIsLive,
  isConscious,
  listParam,
  numberParam,
  param,
  person,
  requiresParameter,
  requiresTarget,
  setEffectState,
  spawnNenEntity,
  unrevealed,
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

/**
 * Oito's hatsu — Oito Hui Guo Rou
 *
 * Oito is not a Nen user in her own right: what the manga shows is her
 * commanding her guards, and her aura nodes being opened by a lent ability
 * (Stealth Dolphin). The module therefore models command, and marks the
 * question of an ability of her own as unresolved.
 */
export const oitoHatsu = defineAbility({
  id: 'oito-hatsu',
  name: 'Oito — commandement',
  owner: 'queen-oito',
  category: 'manipulator',

  conditions: [canUseNen()],

  notes: [
    unrevealed(
      'oito-own-hatsu',
      'Le canon ne prête pas de hatsu propre à Oito : ses nœuds d’aura sont ouverts par un prêt',
    ),
  ],

  targets: [person()],

  cost: { label: 'De l’aura par garde relié au réseau', amount: 1, unit: 'aura/garde' },

  actions: {
    command: {
      label: 'Commander la garde',
      conditions: [requiresTarget('Un garde reçoit un ordre')],
      effects: [
        spawnNenEntity({ id: 'oito-guard-detail', kind: 'COHORT', label: 'Garde de Oito' }),
        controlLink({
          vector: 'command',
          mode: 'observe',
          attributes: (ctx) => ({
            memberIds: listParam(ctx, 'memberIds'),
            order: param(ctx, 'order'),
            // Authority, not Nen manipulation: the guards keep their agency.
            authority: 'royal',
          }),
        }),
      ],
    },
  },

  ui: { componentKey: 'CommandPanel' },

  interactionManifest: buildManifest('oito-hatsu', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER'],
    overlays: ['CONTROL_LINK'],
    entryActions: ['command'],
    requiredState: ['canUseNen'],
    customComponent: 'CommandPanel',
  }),
})
