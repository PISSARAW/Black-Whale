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
  shown,
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

  site: {
    kind: 'animate',
    instruction:
      'Click a nonliving object to animate it a few seconds later, keeping its function; ten small bodies a day, two large, and the aura runs out.',
    rule: 'Touched machines and objects become living animals without losing their practical properties.',
    cost: 'Direct contact with an object',
    color: '#77c887',
    action: 'Animate an object',
  },

  arena: {
    effect: 'enhance',
    cost: 14,
    persistent: true,
    condition: 'touch-nonliving-object',
    risk: 'limited-transformations',
    mechanic: 'terrain',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [object()],

  cost: { label: 'Contact direct avec chaque objet transformé', unit: 'contact' },

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

  site: {
    kind: 'truth-punch',
    instruction:
      'Ask once and punch; keep hitting the same target and its own voice expands on the answer it already gave.',
    rule: 'The body’s emitted voice answers the question truthfully even when the conscious target lies or stays silent.',
    cost: 'A direct punch after a clear question',
    color: '#f1a06d',
    action: 'Question and punch a target',
  },

  arena: {
    effect: 'impact',
    cost: 10,
    persistent: false,
    condition: 'question-before-punch',
    risk: 'melee-contact',
    mechanic: 'truth',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    interrogate: {
      label: 'Frapper après la question',
      evidence: shown('ch. 380 — la question, puis le coup, puis la vérité'),
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

    'compare-with-the-claim': {
      label: 'Comparer avec ce qui a été dit',
      // The whole interest of the ability on the site: the mouth's version and
      // the body's version live side by side, BELIEVED against KNOWN.
      evidence: shown('ch. 380 — le corps répond même quand la bouche ment'),
      conditions: [requiresParameter('question', 'Une question a été posée')],
      effects: [
        knowledgeGrant({
          factId: (ctx) => `contradiction:${param(ctx, 'question') ?? 'question'}`,
          state: 'KNOWN',
          confidence: 1,
        }),
      ],
    },

    'punch-without-asking': {
      label: 'Frapper sans avoir demandé',
      refusal: 'Sans question posée juste avant, le coup n’est qu’un coup',
      evidence: shown('ch. 380 — la question précède toujours la frappe'),
    },

    'interrogate-at-distance': {
      label: 'Interroger à distance',
      refusal: 'La réponse passe par le contact : il faut frapper le corps',
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

  site: {
    kind: 'damage-transfer',
    instruction:
      'Rest the left hand on a recipient first; every blow after that lands there instead, and striking the recipient itself makes it take the damage.',
    rule: 'Damage is redirected between touched targets rather than erased, with stricter limits when living bodies are involved.',
    cost: 'Prior contact with both source and recipient',
    color: '#db8b78',
    action: 'Touch the protected target',
  },

  arena: {
    effect: 'restore',
    cost: 18,
    persistent: true,
    condition: 'touch-source-and-recipient',
    risk: 'damage-is-not-erased',
    mechanic: 'transfer',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person(), object()],

  cost: {
    label: 'Contact préalable avec la source et le destinataire',
    amount: 2,
    unit: 'contacts',
  },

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
