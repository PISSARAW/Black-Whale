import {
  attributeCounter,
  bodyState,
  buildManifest,
  canUseNen,
  curse,
  declaredFlag,
  defineAbility,
  effect,
  effectIsLive,
  masked,
  numberParam,
  param,
  person,
  postMortem,
  requiresParameter,
  setEffectState,
} from '@black-whale/ability-sdk'

/**
 * Yomotsu Hegui — Gidal and the Have-Nots
 *
 * Months of ritual preparation, then a knife: burn the object, drink the ashes,
 * take your own life. The curse only exists after its caster does not, so it is
 * post-mortem by definition, and its strength is a function the module records
 * rather than a number it invents — proximity, eye contact, preparation, resolve.
 *
 * What it gives the site is the omniscient view of hatred accruing for months
 * before anything visible happens.
 */
export const yomotsuHegui = defineAbility({
  id: 'yomotsu-hegui',
  name: 'Yomotsu Hegui',
  owner: 'gidal',
  category: 'specialist',

  conditions: [canUseNen()],

  targets: [person()],

  cost: { label: 'La vie de l’officiant', unit: 'vie' },

  actions: {
    prepare: {
      label: 'Commencer la préparation',
      conditions: [requiresParameter('curseTargetId', 'Une cible est désignée')],
      effects: [
        // Dormant and masked for months: only the omniscient view sees the
        // gauge climb.
        masked(
          effect({
            kind: 'CUSTOM',
            discriminator: 'preparation',
            state: 'DORMANT',
            attributes: (ctx) => ({
              curseTargetId: param(ctx, 'curseTargetId'),
              preparationDays: 0,
              rules: [
                'Des mois de préparation rituelle.',
                'Activation : brûler l’objet, boire les cendres, se donner la mort.',
              ],
            }),
          }),
        ),
      ],
    },

    ripen: {
      label: 'Poursuivre le rituel',
      conditions: [effectIsLive('effectId', 'Une préparation est en cours')],
      effects: [
        attributeCounter({
          increments: (ctx) => ({ preparationDays: numberParam(ctx, 'days') ?? 1 }),
        }),
      ],
    },

    consummate: {
      label: 'Consommer le rituel',
      conditions: [
        effectIsLive('effectId', 'Une préparation est en cours'),
        declaredFlag('ritualCompleted', true, 'Objet brûlé, cendres bues, poignard prêt'),
      ],
      effects: [
        setEffectState({ state: 'TRIGGERED' }),
        // The suicide is the activation, not a side effect.
        bodyState({ bodyId: (ctx) => param(ctx, 'bodyId') ?? ctx.actorId, state: 'DEAD' }),
        postMortem(
          curse({
            active: true,
            trigger: 'ritual-suicide',
            rules: [
              'Draine l’aura de la cible après la mort de l’officiant.',
              'La force dépend de la proximité, du contact visuel, de la préparation et de la résolution.',
            ],
            attributes: (ctx) => ({
              curseTargetId: param(ctx, 'curseTargetId'),
              strengthFactors: {
                proximity: numberParam(ctx, 'proximity'),
                eyeContact: ctx.parameters?.['eyeContact'] === true,
                preparationDays: numberParam(ctx, 'preparationDays'),
                resolve: numberParam(ctx, 'resolve'),
              },
            }),
          }),
        ),
      ],
    },
  },

  ui: { componentKey: 'HatredGauge' },

  interactionManifest: buildManifest('yomotsu-hegui', {
    inputMode: 'SEQUENCE',
    allowedTargets: ['CHARACTER', 'BODY'],
    overlays: ['AURA', 'RANGE'],
    entryActions: ['prepare'],
    requiredState: ['canUseNen'],
    customComponent: 'HatredGauge',
  }),
})
