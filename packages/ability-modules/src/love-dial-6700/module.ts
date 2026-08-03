import {
  attributeCounter,
  auraModifier,
  belowCapacity,
  buildManifest,
  canUseNen,
  defineAbility,
  effectIsLive,
  isConscious,
  knowledgeGrant,
  moveEntity,
  numberParam,
  param,
  person,
  requiresParameter,
} from '@black-whale/ability-sdk'

/** Canon: the dial answers a limited number of times per day. */
const DAILY_QUOTA = 4

/**
 * Love Dial 6700 — Chrollo Lucilfer
 *
 * A search by criteria that answers with a number, not an address. Its whole
 * point on the map is the `probability` field of a spatial estimate: the search
 * circle tightens call after call instead of jumping to a room.
 */
export const loveDial6700 = defineAbility({
  id: 'love-dial-6700',
  name: 'Love Dial 6700',
  owner: 'chrollo-lucilfer',
  category: 'specialist',

  site: {
    kind: 'divination',
    instruction:
      'Dial from an area to learn only whether the ideal partner is in range; the handset then refuses until you move, and it has six calls a day.',
    rule: 'The phone-like divination tool guides its user toward a desired person through changing compatibility readings.',
    cost: 'Repeated readings improve direction',
    color: '#f08db6',
    action: 'Take an affinity reading',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Appels disponibles aujourd’hui', amount: DAILY_QUOTA, unit: 'appels/jour' },

  actions: {
    dial: {
      label: 'Composer',
      conditions: [
        requiresParameter('criteria', 'Des critères de recherche sont fournis'),
        belowCapacity(
          'callsToday',
          DAILY_QUOTA,
          `Moins de ${DAILY_QUOTA} appels passés aujourd’hui`,
        ),
      ],
      effects: [
        auraModifier({ mode: 'SEARCH', criteria: 'declared', dailyQuota: DAILY_QUOTA }),
        knowledgeGrant({
          factId: (ctx) => `position:${param(ctx, 'searchTargetId') ?? 'unknown'}`,
          state: 'BELIEVED',
          confidence: 0.5,
        }),
        // A tier, a probability — never a confirmed room.
        moveEntity({
          precision: 'TIER',
          certainty: 'PROBABLE',
          probability: 0.5,
        }),
      ],
    },

    'narrow-down': {
      label: 'Resserrer la recherche',
      conditions: [effectIsLive('effectId', 'Une recherche est en cours')],
      effects: [
        attributeCounter({
          increments: { callsToday: 1 },
          attributes: (ctx) => ({
            // Each call is one more guiding number: the circle shrinks.
            lastGuidingNumber: numberParam(ctx, 'guidingNumber'),
          }),
        }),
      ],
    },
  },

  ui: { componentKey: 'LoveDialSearch' },

  interactionManifest: buildManifest('love-dial-6700', {
    inputMode: 'CUSTOM',
    allowedTargets: ['CHARACTER', 'LOCATION'],
    overlays: ['RANGE'],
    entryActions: ['dial'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'LoveDialSearch',
  }),
})
