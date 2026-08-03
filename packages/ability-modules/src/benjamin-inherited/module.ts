import {
  abilityGrant,
  asserted,
  auraModifier,
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  effectIsLive,
  hypothesis,
  isConscious,
  param,
  person,
  requiresParameter,
  requiresTarget,
  self,
  setEffectState,
  shown,
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

  site: {
    kind: 'blast',
    instruction:
      'Click an element from any distance to strip the guards another technique put on it; nothing is moved and nothing is touched.',
    rule: 'The inherited emission attack strikes without direct contact; its complete conditions remain unknown.',
    cost: 'Unknown emitted aura',
    color: '#c6f1ff',
    action: 'Fire the palm blast',
  },

  conditions: [canUseNen(), isConscious()],

  notes: [
    unrevealed('air-blow-mechanism', 'Le fonctionnement exact de la capacité n’est pas révélé'),
  ],

  targets: [person()],

  cost: { label: 'Aura émise — le canon n’en donne pas la mesure', unit: 'aura' },

  actions: {
    'fire-at-a-single-target': {
      label: 'Viser une cible',
      evidence: asserted('l’émission part de la paume vers ce qu’elle vise'),
      conditions: [requiresTarget('Une cible est visée')],
      effects: [auraModifier({ emitter: 'left-palm', scope: 'target' })],
    },

    'fire-a-sustained-barrage': {
      label: 'Tenir un tir nourri',
      evidence: hypothesis('la cadence et la portée d’Air Blow ne sont pas données'),
      effects: [auraModifier({ emitter: 'left-palm', sustained: true })],
    },

    'describe-the-full-mechanics': {
      label: 'Détailler la mécanique',
      refusal: 'Condition non révélée : le manga n’a montré qu’une émission depuis la paume',
    },

    fire: {
      label: 'Émettre depuis la paume gauche',
      evidence: asserted('l’émission part de la paume gauche ; le canon n’en dit pas plus'),
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

  site: {
    kind: 'capture',
    instruction:
      'Click a Nen user, hold the aura rectangle through its charge, then activate the acquired ability from its Culdcept card.',
    rule: 'Culdcept acquires another user’s Hatsu as a card; Halkenburg’s invincible arrow penetrates it and makes acquisition fail.',
    cost: 'Joined hands · charged aura rectangle',
    color: '#8c7ae6',
    action: 'Acquire a Nen ability',
  },

  conditions: [canUseNen(), isConscious()],

  notes: [
    unrevealed('culdcept-conditions', 'Les conditions de capture ne sont pas toutes révélées'),
  ],

  targets: [person()],

  cost: { label: 'Mains jointes et rectangle d’aura chargé jusqu’au bout', unit: 'aura' },

  actions: {
    capture: {
      label: 'Capturer une capacité',
      evidence: asserted(
        'la capacité prend une capacité en carte ; le manga n’en montre pas la réussite',
      ),
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

    'play-a-captured-card': {
      label: 'Jouer une carte capturée',
      evidence: asserted('la carte rend la capacité disponible à son porteur'),
      conditions: [requiresParameter('targetAbilityId', 'Une carte est choisie')],
      effects: [abilityGrant()],
    },

    'capture-an-invincible-arrow': {
      label: 'Capturer la flèche de Halkenburg',
      refusal: 'La flèche transperce le rectangle d’aura : la carte ne se ferme pas',
      evidence: shown('ch. 411 — l’échec, montré comme tel'),
    },

    'capture-failed': {
      label: 'Capture avortée',
      evidence: shown('ch. 411 — la capture échoue contre la flèche de Halkenburg'),
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
  name: 'Aura Manipulation',
  owner: 'prince-benjamin',
  category: 'enhancer',

  site: {
    kind: 'enhance',
    instruction:
      'Click a target repeatedly to stack up to five layers of Ren; the fifth spills the mantle onto everything beside it.',
    rule: 'Benjamin’s immense aura reinforces physical output and defence in proportion to the aura committed.',
    cost: 'Increasing aura per reinforcement layer',
    color: '#f0b429',
    action: 'Reinforce with Ren',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [self()],

  cost: { label: 'Aura croissante à chaque couche de renfort', unit: 'aura' },

  actions: {
    reinforce: {
      label: 'Renforcer le corps',
      evidence: shown('ch. 361 — le corps tenu par le renforcement'),
      effects: [auraModifier({ mode: 'REINFORCEMENT', scope: 'self' })],
    },

    'harden-against-a-blow': {
      label: 'Encaisser un coup',
      evidence: shown('ch. 385 — le corps tient sous l’impact'),
      conditions: [effectIsLive('effectId', 'Le renforcement est actif')],
      effects: [auraModifier({ mode: 'REINFORCEMENT', braced: true })],
    },

    'reinforce-someone-else': {
      label: 'Renforcer un tiers',
      refusal: 'Le renforcement porte sur son propre corps',
    },

    release: {
      label: 'Relâcher',
      evidence: asserted('le renforcement se relâche à volonté'),
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
