import {
  abilityGrant,
  auraModifier,
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  effectIsLive,
  isConscious,
  param,
  person,
  requiresParameter,
  requiresTarget,
  self,
  setEffectState,
  unrevealed,
} from '@black-whale/ability-sdk'

/**
 * Air Blow — inherited from Vincent
 *
 * Canon shows the attempt and not the mechanism: Vincent was trying to fire it
 * from his left palm when he died. The module keeps the gesture and marks the
 * rest unknown rather than inventing a projectile.
 */
export const airBlow = defineAbility({
  id: 'air-blow',
  name: 'Air Blow',
  owner: 'prince-benjamin',
  category: 'unknown',

  conditions: [canUseNen(), isConscious()],

  notes: [
    unrevealed('air-blow-mechanism', 'Le fonctionnement exact de la capacité n’est pas révélé'),
  ],

  targets: [person()],

  cost: { label: 'Aura émise — le canon n’en donne pas la mesure', unit: 'aura' },

  actions: {
    fire: {
      label: 'Émettre depuis la paume gauche',
      conditions: [requiresTarget('Une cible est visée')],
      effects: [
        auraModifier({
          emitter: 'left-palm',
          canonStatus: 'partially-revealed',
        }),
      ],
    },
  },

  ui: { componentKey: 'BarrageView' },

  interactionManifest: buildManifest('air-blow', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'LOCATION'],
    overlays: ['TRAJECTORY'],
    entryActions: ['fire'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'BarrageView',
  }),
})

/**
 * Culdcept — inherited from Shikaku
 *
 * Captures an ability as a card. Its canonical moment is a failure: it could not
 * take Halkenburg's arrow (ch. 411), and a failed capture is worth showing on
 * the timeline — the catalogue models limits, not only successes.
 */
export const culdcept = defineAbility({
  id: 'culdcept',
  name: 'Culdcept',
  owner: 'prince-benjamin',
  category: 'specialist',

  conditions: [canUseNen(), isConscious()],

  notes: [
    unrevealed('culdcept-conditions', 'Les conditions de capture ne sont pas toutes révélées'),
  ],

  targets: [person()],

  cost: { label: 'Mains jointes et rectangle d’aura chargé jusqu’au bout', unit: 'aura' },

  actions: {
    capture: {
      label: 'Capturer une capacité',
      conditions: [
        requiresTarget('Un utilisateur est visé'),
        requiresParameter('targetAbilityId', 'La capacité visée est identifiée'),
      ],
      effects: [
        effect({
          kind: 'ABILITY_GRANT',
          discriminator: 'card',
          attributes: (ctx) => ({
            storedAbilityId: param(ctx, 'targetAbilityId'),
            form: 'card',
          }),
        }),
        abilityGrant(),
      ],
    },

    'capture-failed': {
      label: 'Capture avortée',
      conditions: [requiresParameter('targetAbilityId', 'La capacité visée est identifiée')],
      // The ch. 411 failure: an effect that exists only to be ended, because the
      // timeline should show the attempt.
      effects: [
        effect({
          kind: 'ABILITY_GRANT',
          discriminator: 'failed-card',
          state: 'TRIGGERED',
          attributes: (ctx) => ({
            storedAbilityId: param(ctx, 'targetAbilityId'),
            outcome: 'failed',
            reason: param(ctx, 'reason') ?? 'capacité hors de portée de Culdcept',
          }),
        }),
      ],
      hint: 'Échec canon contre la flèche de Halkenburg (ch. 411)',
    },
  },

  ui: { componentKey: 'CardCapture' },

  interactionManifest: buildManifest('culdcept', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'AURA'],
    overlays: ['AURA', 'RANGE'],
    entryActions: ['capture'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'CardCapture',
  }),
})

/**
 * Benjamin's aura — Benjamin Hui Guo Rou
 *
 * Plain reinforcement, and the baseline the rest of his kit sits on: no
 * condition beyond being conscious, and a modifier that scales with what he
 * commits.
 */
export const benjaminAura = defineAbility({
  id: 'benjamin-aura',
  name: 'Aura de Benjamin',
  owner: 'prince-benjamin',
  category: 'enhancer',

  conditions: [canUseNen(), isConscious()],

  targets: [self()],

  cost: { label: 'Aura croissante à chaque couche de renfort', unit: 'aura' },

  actions: {
    reinforce: {
      label: 'Renforcer le corps',
      effects: [auraModifier({ mode: 'REINFORCEMENT', scope: 'self' })],
    },

    release: {
      label: 'Relâcher',
      conditions: [effectIsLive('effectId', 'Le renforcement est actif')],
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  ui: { componentKey: 'AuraGauge' },

  interactionManifest: buildManifest('benjamin-aura', {
    inputMode: 'HOLD',
    allowedTargets: ['CHARACTER'],
    overlays: ['AURA'],
    entryActions: ['reinforce'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'AuraGauge',
  }),
})
