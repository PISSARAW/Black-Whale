import {
  bodyState,
  buildManifest,
  canUseNen,
  constraint,
  defineAbility,
  effect,
  effectIsLive,
  isConscious,
  knowledgeGrant,
  numberParam,
  object,
  param,
  person,
  requiresParameter,
  requiresTarget,
  setEffectState,
  spawnNenEntity,
} from '@black-whale/ability-sdk'

/**
 * Biohazard — Hinrigh Biganduffno
 *
 * An object becomes a living animal without losing its function: handcuffs that
 * still cuff, but bite. The module keeps both facts on the effect, because the
 * whole trick is that the object never stops being useful.
 */
export const biohazardHinrigh = defineAbility({
  id: 'biohazard-hinrigh',
  name: 'Biohazard',
  owner: 'hinrigh-biganduffno',
  category: 'conjurer',

  conditions: [canUseNen(), isConscious()],

  targets: [object()],

  actions: {
    animate: {
      label: 'Changer un objet en animal',
      conditions: [requiresTarget('Un objet est touché')],
      effects: [
        spawnNenEntity({
          id: (ctx) => `biohazard-${ctx.targets[0] ?? 'object'}`,
          kind: 'NEN_ENTITY',
          label: 'Objet vivant',
          metadata: (ctx) => ({
            originalObjectId: ctx.targets[0],
            keepsOriginalFunction: true,
          }),
        }),
        effect({
          kind: 'CUSTOM',
          discriminator: 'living-object',
          attributes: {
            keepsOriginalFunction: true,
            rules: ['L’objet devient vivant sans perdre sa fonction d’origine.'],
          },
        }),
      ],
    },

    revert: {
      label: 'Rendre l’objet inerte',
      conditions: [effectIsLive('effectId', 'Un objet est animé')],
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  ui: { componentKey: 'LivingObjectView' },

  interactionManifest: buildManifest('biohazard-hinrigh', {
    inputMode: 'CLICK',
    allowedTargets: ['OBJECT', 'CHARACTER'],
    overlays: ['AURA'],
    entryActions: ['animate'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'LivingObjectView',
  }),
})

/**
 * Body and Soul — Lynch Fullbokko
 *
 * The body answers truthfully even when its owner lies, which makes it the
 * cleanest illustration of KNOWN against BELIEVED in the catalogue: two facts
 * about the same question, one from the mouth and one from the flesh.
 */
export const bodyAndSoul = defineAbility({
  id: 'body-and-soul',
  name: 'Body and Soul',
  owner: 'lynch-fullbokko',
  category: 'emitter',

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    interrogate: {
      label: 'Frapper après la question',
      conditions: [
        requiresTarget('Un interrogé est frappé'),
        requiresParameter('question', 'Une question a été posée'),
      ],
      effects: [
        bodyState({ state: 'INJURED' }),
        // What the body says: true, whatever the mouth claimed.
        knowledgeGrant({
          factId: (ctx) => `truth:${param(ctx, 'question') ?? 'question'}`,
          state: 'KNOWN',
          confidence: 1,
        }),
        // What the target said out loud, kept separately so the two can be
        // compared in the perspective panel.
        knowledgeGrant({
          factId: (ctx) => `claim:${param(ctx, 'question') ?? 'question'}`,
          state: 'BELIEVED',
          confidence: 0.5,
        }),
      ],
      cost: { label: 'Un coup par question', amount: 1, unit: 'coup' },
    },
  },

  ui: { componentKey: 'InterrogationPanel' },

  interactionManifest: buildManifest('body-and-soul', {
    inputMode: 'SEQUENCE',
    allowedTargets: ['CHARACTER', 'BODY'],
    overlays: ['AURA'],
    entryActions: ['interrogate'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'InterrogationPanel',
  }),
})

/**
 * Damage: Sweet Home — Terebellum
 *
 * Damage taken by one touched target is paid by another. Two touches, one
 * transfer — the ledger of who actually suffers is what the module records.
 */
export const damageSweetHome = defineAbility({
  id: 'damage-sweet-home',
  name: 'Damage: Sweet Home',
  owner: 'terebellum',
  category: 'emitter',

  conditions: [canUseNen(), isConscious()],

  targets: [person(), object()],

  actions: {
    link: {
      label: 'Relier une source et un réceptacle',
      conditions: [
        requiresParameter('sourceId', 'La source des dégâts est touchée'),
        requiresParameter('sinkId', 'Le réceptacle est touché'),
      ],
      effects: [
        constraint({
          rules: ['Les dégâts subis par la source sont reportés sur le réceptacle.'],
          attributes: (ctx) => ({
            damageSourceId: param(ctx, 'sourceId'),
            damageSinkId: param(ctx, 'sinkId'),
            requiresTouch: true,
          }),
        }),
      ],
    },

    transfer: {
      label: 'Reporter les dégâts',
      conditions: [effectIsLive('effectId', 'Un report est en place')],
      effects: [
        bodyState({ bodyId: (ctx) => param(ctx, 'sinkId'), state: 'INJURED' }),
        effect({
          kind: 'CUSTOM',
          discriminator: 'transfer',
          attributes: (ctx) => ({
            amount: numberParam(ctx, 'amount'),
            from: param(ctx, 'sourceId'),
            to: param(ctx, 'sinkId'),
          }),
        }),
      ],
    },
  },

  ui: { componentKey: 'DamageLedger' },

  interactionManifest: buildManifest('damage-sweet-home', {
    inputMode: 'SEQUENCE',
    allowedTargets: ['CHARACTER', 'BODY', 'OBJECT'],
    overlays: ['CONTROL_LINK'],
    entryActions: ['link'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'DamageLedger',
  }),
})
