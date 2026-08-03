import {
  abilityRevoke,
  attributeCounter,
  buildManifest,
  canUseNen,
  constraint,
  defineAbility,
  effect,
  effectAttributeAtLeast,
  effectIsLive,
  isConscious,
  knowledgeGrant,
  numberParam,
  param,
  person,
  requiresParameter,
  soleObserverOf,
  spawnNenEntity,
} from '@black-whale/ability-sdk'

/** Canon: a success seals Rihan's own Nen for two days. */
const SEAL_HOURS = 48
/** Analysis is complete at a hundred percent, and not before. */
const COMPLETE = 100

/**
 * Predator — Rihan
 *
 * The only ability in the catalogue whose activation condition is the knowledge
 * engine itself: the analysis counts only if Rihan is the sole observer of what
 * he learned. Information handed to him by somebody else voids it, so the
 * condition checks that no other observer holds the same facts.
 */
export const rihanPredator = defineAbility({
  id: 'rihan-predator',
  name: 'Predator',
  owner: 'rihan',
  category: 'specialist',

  site: {
    kind: 'predator',
    instruction:
      'Read one registered Hatsu three times on your own; Predator then counters it everywhere it is carried, and costs all Nen for forty-eight hours.',
    rule: 'Predator becomes stronger and more specialized as Rihan correctly deduces an enemy ability’s conditions.',
    cost: 'Accurate analysis · weak against unknowns',
    color: '#7bb66c',
    action: 'Begin analyzing a target',
  },

  arena: {
    effect: 'enhance',
    cost: 100,
    persistent: false,
    condition: 'three-correct-readings',
    risk: 'forty-eight-hour-zetsu',
    mechanic: 'analysis',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: {
    label: 'Nen scellé après un succès',
    amount: SEAL_HOURS,
    unit: 'heures',
  },

  actions: {
    analyse: {
      label: 'Analyser une capacité',
      conditions: [requiresParameter('targetAbilityId', 'Une capacité cible est désignée')],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'analysis',
          attributes: (ctx) => ({
            targetAbilityId: param(ctx, 'targetAbilityId'),
            progress: 0,
            rules: [
              'L’analyse doit être menée seul.',
              'Toute information fournie par autrui rend l’analyse inopérante.',
            ],
          }),
        }),
        knowledgeGrant({
          factId: (ctx) => `ability-analysis:${param(ctx, 'targetAbilityId') ?? 'unknown'}`,
          state: 'KNOWN',
        }),
      ],
    },

    observe: {
      label: 'Poursuivre l’analyse',
      conditions: [effectIsLive('effectId', 'Une analyse est en cours')],
      effects: [
        attributeCounter({
          increments: (ctx) => ({ progress: numberParam(ctx, 'progressDelta') ?? 10 }),
        }),
      ],
    },

    devour: {
      label: 'Lâcher la contre-mesure',
      conditions: [
        effectIsLive('effectId', 'Une analyse est en cours'),
        effectAttributeAtLeast({
          key: 'progress',
          threshold: COMPLETE,
          label: 'L’analyse est complète',
        }),
        soleObserverOf('ability-analysis:', 'Rihan est le seul à détenir cette analyse'),
      ],
      effects: [
        spawnNenEntity({
          id: (ctx) => `predator-${param(ctx, 'targetAbilityId') ?? 'prey'}`,
          kind: 'CONSTRUCT',
          label: 'Créature contre-mesure',
          metadata: (ctx) => ({ preyAbilityId: param(ctx, 'targetAbilityId') }),
        }),
        abilityRevoke({ reason: 'devoured-by-predator' }),
        // The price is paid by Rihan, immediately and on the timeline.
        constraint({
          rules: [`Nen de Rihan scellé pendant ${SEAL_HOURS} heures.`],
          attributes: { sealHours: SEAL_HOURS, appliesTo: 'self' },
        }),
      ],
    },
  },

  ui: { componentKey: 'PredatorAnalysisGauge' },

  interactionManifest: buildManifest('rihan-predator', {
    inputMode: 'SEQUENCE',
    allowedTargets: ['CHARACTER', 'AURA'],
    overlays: ['AURA', 'RANGE'],
    entryActions: ['analyse'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'PredatorAnalysisGauge',
  }),
})
