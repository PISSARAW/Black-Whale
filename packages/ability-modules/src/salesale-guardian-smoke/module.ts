import {
  attributeCounter,
  auraModifier,
  buildManifest,
  canUseNen,
  declaredFlag,
  defineAbility,
  effect,
  effectIsLive,
  numberParam,
  param,
  requiresParameter,
  shown,
  spawnNenEntity,
  zone,
} from '@black-whale/ability-sdk'

const COHORT_ID = 'salesale-converted'

/**
 * Salé-salé's guardian — smoke of benevolence
 *
 * The site's second contagion engine after Morena, and it shares the component:
 * a cohort that grows by spatial proximity. Converts carry copies that spread
 * the smoke further, and holding one's breath is the only defence — a condition,
 * not a saving throw.
 */
export const salesaleGuardianSmoke = defineAbility({
  id: 'salesale-guardian-smoke',
  name: 'Diffusive Aura Smoke',
  owner: 'prince-salesale',
  category: 'unknown',

  site: {
    kind: 'diffusive-smoke',
    instruction:
      'Expose neighboring sections repeatedly; converted controls join a spreading panel that routes visitors toward Salé-salé.',
    rule: 'Low-level coercive smoke builds goodwill over hours, creates secondary emitters and fails against targets holding their breath.',
    cost: 'Sustained exposure · breathable aura smoke',
    color: '#b7aac8',
    action: 'Release the first smoke cloud',
  },

  conditions: [canUseNen()],

  targets: [zone()],

  cost: {
    label: 'Exposition prolongée à la fumée — échoue si la cible retient son souffle',
    unit: 'heures',
  },

  actions: {
    diffuse: {
      label: 'Diffuser la fumée',
      evidence: shown('ch. 386 — la fumée de bienveillance emplit la pièce'),
      conditions: [requiresParameter('locationId', 'Une pièce est enfumée')],
      effects: [
        spawnNenEntity({ id: COHORT_ID, kind: 'COHORT', label: 'Convertis de Salé-salé' }),
        auraModifier({
          scope: 'room',
          mood: 'benevolent',
          rules: [
            'La conversion est progressive.',
            'Les convertis portent des copies qui propagent la fumée.',
            'Retenir son souffle protège.',
          ],
        }),
        effect({
          kind: 'CUSTOM',
          discriminator: 'contagion',
          targets: () => [{ id: COHORT_ID, kind: 'COHORT' }],
          attributes: { cohortId: COHORT_ID, memberIds: [], spread: 'spatial-proximity' },
        }),
      ],
    },

    convert: {
      label: 'Convertir un occupant',
      evidence: shown('ch. 386 — la conversion vient avec le temps d’exposition'),
      conditions: [
        effectIsLive('effectId', 'La fumée est encore active'),
        declaredFlag('holdingBreath', false, 'La cible ne retient pas son souffle'),
      ],
      effects: [
        attributeCounter({
          append: (ctx) => ({ memberIds: ctx.targets }),
          attributes: (ctx) => ({
            // Exposure time drives the conversion probability the heat map draws.
            lastExposureSeconds: numberParam(ctx, 'exposureSeconds'),
            lastConvertedIn: param(ctx, 'locationId'),
          }),
        }),
      ],
    },

    'spread-by-a-convert': {
      label: 'Propager par un converti',
      // Each convert carries a copy: the cohort grows without the guardian.
      evidence: shown('ch. 386 — les convertis portent des copies qui propagent'),
      conditions: [effectIsLive('effectId', 'Des convertis existent')],
      effects: [
        attributeCounter({
          append: (ctx) => ({ memberIds: ctx.targets }),
          attributes: (ctx) => ({ spreadBy: param(ctx, 'carrierId'), secondHand: true }),
        }),
      ],
    },

    'convert-through-held-breath': {
      label: 'Convertir quelqu’un qui retient son souffle',
      refusal: 'Retenir son souffle protège : la fumée ne prend pas',
      evidence: shown('ch. 386 — la parade est énoncée dans la scène'),
    },

    'convert-at-a-distance': {
      label: 'Convertir hors de la fumée',
      refusal: 'La conversion demande de partager l’air : hors du nuage, rien ne passe',
    },
  },

  ui: { componentKey: 'ContagionHeatmap' },

  interactionManifest: buildManifest('salesale-guardian-smoke', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['LOCATION', 'CHARACTER'],
    overlays: ['AURA', 'RANGE'],
    entryActions: ['diffuse'],
    requiredState: ['canUseNen'],
    customComponent: 'ContagionHeatmap',
  }),
})
