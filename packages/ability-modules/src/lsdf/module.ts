import {
  buildManifest,
  canUseNen,
  constraint,
  declaredFlag,
  defineAbility,
  effectIsLive,
  moveEntity,
  numberParam,
  param,
  requiresParameter,
  setEffectState,
  shown,
  spawnNenEntity,
  zone,
} from '@black-whale/ability-sdk'

/**
 * A Battle of Wits: LSDF — Yokotani
 *
 * A location with published laws: guards appear against intruders, at a strength
 * proportional to the crime committed, and they expel rather than wound. The
 * whole thing is conditioned on Morena being at the hideout, so the Heil-Ly base
 * is a rules zone that switches off when she leaves.
 */
export const lsdf = defineAbility({
  id: 'lsdf',
  name: 'A Battle of Wits: LSDF',
  owner: 'yokotani',
  category: 'conjurer',

  site: {
    kind: 'legal-defense',
    instruction:
      'Designate the hideout, then stand a numbered guard on any intruder inside it: it can do nothing, and nothing can be done to it.',
    rule: 'The invincible guards work only in Morena’s hideout after Yokotani identifies unlawful intruders; they expel but cannot injure.',
    cost: 'Morena present · hideout only · declared offense',
    color: '#d4c58b',
    action: 'Establish hideout jurisdiction',
  },

  arena: {
    effect: 'bind',
    cost: 20,
    persistent: true,
    condition: 'declared-hideout-intruder',
    risk: 'cannot-inflict-harm',
    mechanic: 'jurisdiction',
  },

  conditions: [canUseNen()],

  targets: [zone()],

  cost: {
    label: 'Morena présente, dans la planque, pour une infraction déclarée',
    unit: 'juridiction',
  },

  actions: {
    arm: {
      label: 'Armer la zone',
      evidence: shown('ch. 383 — la zone protégée du repaire'),
      conditions: [
        requiresParameter('locationId', 'Un lieu est protégé'),
        declaredFlag('morenaPresent', true, 'Morena est présente au repaire'),
      ],
      effects: [
        constraint({
          rules: [
            'Des gardes invincibles apparaissent face aux intrus.',
            'Leur niveau dépend de la gravité du crime commis.',
            'Ils expulsent sans blesser.',
            'La zone est conditionnée à la présence de Morena au repaire.',
          ],
          attributes: (ctx) => ({
            locationId: param(ctx, 'locationId'),
            scope: 'location',
            requiresPresenceOf: 'morena-prudo',
          }),
        }),
      ],
    },

    'spawn-guard': {
      label: 'Faire apparaître un garde',
      evidence: shown('ch. 383 — le garde arrive au niveau du crime commis'),
      conditions: [
        effectIsLive('effectId', 'La zone est armée'),
        requiresParameter('crimeSeverity', 'La gravité du crime est établie'),
      ],
      effects: [
        spawnNenEntity({
          id: (ctx) => `lsdf-guard-${param(ctx, 'intruderId') ?? 'intruder'}`,
          kind: 'CONSTRUCT',
          label: 'Garde LSDF',
          metadata: (ctx) => ({
            // Proportional, not fixed: a trespasser and a murderer meet
            // different guards.
            level: numberParam(ctx, 'crimeSeverity'),
            expelsRatherThanHarms: true,
          }),
        }),
      ],
    },

    expel: {
      label: 'Expulser l’intrus',
      evidence: shown('ch. 383 — l’intrus est expulsé, pas blessé'),
      conditions: [effectIsLive('effectId', 'La zone est armée')],
      effects: [moveEntity({ certainty: 'CONFIRMED', precision: 'EXACT_ROOM' })],
    },

    'harm-an-intruder': {
      label: 'Blesser un intrus',
      refusal: 'Les gardes expulsent sans blesser',
      evidence: shown('ch. 383 — la règle énoncée avec la capacité'),
    },

    'hold-the-zone-without-morena': {
      label: 'Tenir la zone sans Morena',
      refusal: 'La zone est conditionnée à la présence de Morena au repaire',
      evidence: shown('ch. 383 — la condition énoncée avec la capacité'),
    },

    disarm: {
      label: 'Désarmer la zone',
      evidence: shown('ch. 383 — la zone tombe quand Morena quitte le repaire'),
      conditions: [effectIsLive('effectId', 'La zone est armée')],
      effects: [
        setEffectState({ state: 'ENDED', attributes: { reason: 'owner-left-the-hideout' } }),
      ],
    },
  },

  ui: { componentKey: 'RuleZonePanel' },

  interactionManifest: buildManifest('lsdf', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['LOCATION', 'CHARACTER'],
    overlays: ['RANGE'],
    entryActions: ['arm'],
    requiredState: ['canUseNen'],
    customComponent: 'RuleZonePanel',
  }),
})
