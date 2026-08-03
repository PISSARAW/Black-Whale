import {
  asserted,
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
  shown,
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

  site: {
    kind: 'scarlet',
    instruction:
      'Sweep a whole section at 100% efficiency in every category at once; each activation bills three more hours of session life.',
    rule: 'Scarlet eyes grant 100% efficiency in every Nen category, but one year consumed forces five minutes of Zetsu.',
    cost: '1 second = 1 hour of life',
    color: '#ef3340',
    action: 'Operate at full efficiency',
  },

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
      evidence: shown('ch. 358 — activation volontaire, 100 % dans toutes les catégories'),
      effects: [
        auraModifier({
          allCategories: 1.0,
          lifespanSpentHours: 0,
          activeSeconds: 0,
        }),
      ],
    },

    'trigger-by-emotion': {
      label: 'Déclencher par les yeux écarlates',
      // Not a choice: emotion opens the eyes, and the counter starts anyway.
      evidence: shown('ch. 366 — les yeux virent à l’écarlate sous l’émotion'),
      effects: [auraModifier({ allCategories: 1.0, involuntary: true, lifespanSpentHours: 0 })],
      cost: { label: 'Espérance de vie, sans décision préalable', unit: 'heure par seconde' },
      hint: 'Emploi subi : l’émotion active la capacité',
    },

    maintain: {
      label: 'Maintenir',
      evidence: shown('ch. 380 — Emperor Time tenu pendant tout le pont 1'),
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

    'forced-zetsu': {
      label: 'Subir le Zetsu forcé',
      // The price the price charges: an accumulated year costs five minutes of
      // Zetsu, during which nothing else can be cast.
      evidence: shown('ch. 380 — cinq minutes de Zetsu après une année consommée'),
      conditions: [effectIsLive('effectId', 'Emperor Time a été maintenu')],
      effects: [setEffectState({ state: 'ENDED', attributes: { forcedZetsuMinutes: 5 } })],
      cost: { label: 'Cinq minutes sans aucun Nen', amount: 5, unit: 'minutes' },
    },

    'lend-to-others': {
      label: 'Prêter l’efficacité à un tiers',
      refusal: 'Emperor Time ne multiplie que les chaînes de Kurapika, jamais le Nen d’autrui',
      evidence: asserted('la capacité porte sur ses propres catégories'),
    },

    deactivate: {
      label: 'Désactiver',
      evidence: shown('ch. 381 — Kurapika coupe pour cesser de payer'),
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
