import {
  attributeCounter,
  auraModifier,
  buildManifest,
  canUseNen,
  defineAbility,
  effectIsLive,
  isConscious,
  numberParam,
  self,
  setEffectState,
} from '@black-whale/ability-sdk'

/** Canon: one hour of lifespan per second of Emperor Time. */
const HOURS_PER_SECOND = 1

/**
 * Emperor Time — Kurapika
 *
 * The most dramatic cost of the arc, made visible. The aura modifier is trivial
 * (100 % in every category); what matters is the counter: every second spent
 * under Emperor Time is an hour of life, accumulated on the effect and readable
 * on the timeline as "N heures consommées depuis le ch. 358".
 */
export const emperorTime = defineAbility({
  id: 'emperor-time',
  name: 'Emperor Time',
  owner: 'kurapika',
  category: 'specialist',

  conditions: [canUseNen(), isConscious()],

  targets: [self()],

  cost: {
    label: 'Espérance de vie',
    amount: HOURS_PER_SECOND,
    unit: 'heure par seconde',
  },

  actions: {
    activate: {
      label: 'Activer Emperor Time',
      effects: [
        auraModifier({
          allCategories: 1.0,
          lifespanSpentHours: 0,
          activeSeconds: 0,
        }),
      ],
    },

    maintain: {
      label: 'Maintenir',
      conditions: [effectIsLive('effectId', 'Emperor Time est actif')],
      effects: [
        attributeCounter({
          increments: (ctx) => {
            const seconds = numberParam(ctx, 'secondsElapsed') ?? 0
            return {
              activeSeconds: seconds,
              lifespanSpentHours: seconds * HOURS_PER_SECOND,
            }
          },
        }),
      ],
      cost: (ctx) => ({
        label: 'Espérance de vie consommée par cette période',
        amount: (numberParam(ctx, 'secondsElapsed') ?? 0) * HOURS_PER_SECOND,
        unit: 'heures',
      }),
      hint: 'Requiert Emperor Time actif',
    },

    deactivate: {
      label: 'Désactiver',
      conditions: [effectIsLive('effectId', 'Emperor Time est actif')],
      effects: [setEffectState({ state: 'ENDED' })],
      hint: 'Requiert Emperor Time actif',
    },
  },

  ui: { componentKey: 'EmperorTimeGauge' },

  interactionManifest: buildManifest('emperor-time', {
    inputMode: 'HOLD',
    allowedTargets: ['CHARACTER'],
    overlays: ['AURA'],
    entryActions: ['activate'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'EmperorTimeGauge',
  }),
})
