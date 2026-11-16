import {
  asserted,
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
      evidence: shown({
        kind: 'chapter',
        chapter: 383,
        label: 'ch. 383 — l’objet devient vivant sans perdre sa fonction',
      }),
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

    'animate-a-living-target': {
      label: 'Animer un être déjà vivant',
      refusal: 'La capacité anime des objets : le vivant n’a rien à recevoir',
    },

    'keep-the-original-function': {
      label: 'Se servir de l’objet animé',
      // The canon detail worth an entry of its own: a living door is still a
      // door, so the object keeps doing its job while it moves.
      evidence: shown({
        kind: 'chapter',
        chapter: 383,
        label: 'ch. 383 — l’objet garde sa fonction d’origine',
      }),
      conditions: [effectIsLive('effectId', 'Un objet est animé')],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'living-object-in-use',
          attributes: { keepsOriginalFunction: true },
        }),
      ],
    },

    revert: {
      label: 'Rendre l’objet inerte',
      evidence: asserted({ kind: 'other', label: 'l’objet redevient inerte' }),
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
      evidence: shown({
        kind: 'chapter',
        chapter: 380,
        label: 'ch. 380 — la question, puis le coup, puis la vérité',
      }),
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
      evidence: shown({
        kind: 'chapter',
        chapter: 380,
        label: 'ch. 380 — le corps répond même quand la bouche ment',
      }),
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
      evidence: shown({
        kind: 'chapter',
        chapter: 380,
        label: 'ch. 380 — la question précède toujours la frappe',
      }),
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
 * At the instant damage is dealt, the right hand takes it from the struck
 * target and the left hand sends it into whatever it touches. Damage dealt to
 * Terebellum himself needs only the left-hand contact.
 */
export const damageSweetHome = defineAbility({
  id: 'damage-sweet-home',
  name: 'Damage: Sweet Home',
  owner: 'terebellum',
  category: 'emitter',

  site: {
    kind: 'damage-transfer',
    instruction:
      'At the moment of impact, touch the damaged object or person with the right hand and the recipient with the left. Damage dealt directly to Terebellum needs only the left hand.',
    rule: 'Damage is transferred rather than erased. If the right hand absorbs damage while the left hand touches nothing, the left hand takes it.',
    cost: 'Simultaneous contact at the moment of damage',
    color: '#db8b78',
    action: 'Absorb right, transfer left',
  },

  arena: {
    effect: 'restore',
    cost: 18,
    persistent: true,
    condition: 'simultaneous-hand-contact-on-impact',
    risk: 'untransferred-damage-hits-left-hand',
    mechanic: 'transfer',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person(), object()],

  cost: {
    label: 'Contacts simultanés au moment des dégâts',
    amount: 2,
    unit: 'contacts',
  },

  actions: {
    link: {
      label: 'Absorber à droite et transférer à gauche',
      evidence: shown({
        kind: 'chapter',
        chapter: 399,
        label: 'ch. 399 — les deux mains transfèrent les dégâts au moment du coup',
      }),
      conditions: [
        requiresParameter(
          'sourceId',
          'La main droite touche l’objet ou la personne au moment où les dégâts sont infligés',
        ),
        requiresParameter('sinkId', 'La main gauche touche le réceptacle au même instant'),
      ],
      effects: [
        constraint({
          rules: [
            'Les dégâts reçus par la cible de la main droite sont absorbés par Terebellum puis transférés à la cible de la main gauche.',
            'Les deux contacts doivent exister au moment où les dégâts sont infligés.',
          ],
          attributes: (ctx) => ({
            damageSourceId: param(ctx, 'sourceId'),
            damageSinkId: param(ctx, 'sinkId'),
            rightHandContactRequiredOnImpact: true,
            leftHandContactRequiredOnImpact: true,
          }),
        }),
      ],
    },

    'self-transfer': {
      label: 'Transférer une blessure reçue directement',
      evidence: shown({
        kind: 'chapter',
        chapter: 399,
        label: 'ch. 399 — ses propres dégâts se transfèrent par la main gauche seule',
      }),
      conditions: [
        requiresParameter('sinkId', 'La main gauche touche le réceptacle au moment du coup'),
      ],
      effects: [
        constraint({
          rules: [
            'Quand Terebellum est lui-même frappé, aucun contact de la main droite n’est nécessaire.',
            'Les dégâts reçus sont transférés à ce que touche sa main gauche.',
          ],
          attributes: (ctx) => ({
            damageSourceId: 'terebellum',
            damageSinkId: param(ctx, 'sinkId'),
            rightHandContactRequiredOnImpact: false,
            leftHandContactRequiredOnImpact: true,
          }),
        }),
      ],
    },

    'absorb-without-left-contact': {
      label: 'Absorber sans réceptacle à gauche',
      evidence: shown({
        kind: 'chapter',
        chapter: 399,
        label: 'ch. 399 — faute de réceptacle, la main gauche subit les dégâts',
      }),
      conditions: [
        requiresParameter(
          'sourceId',
          'La main droite touche l’objet ou la personne au moment où les dégâts sont infligés',
        ),
      ],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'left-hand-backlash',
          attributes: (ctx) => ({
            from: param(ctx, 'sourceId'),
            to: 'terebellum-left-hand',
          }),
        }),
      ],
    },

    'link-without-touching': {
      label: 'Relier sans contact',
      refusal: 'Les contacts requis doivent être maintenus au moment exact des dégâts',
      evidence: shown({
        kind: 'chapter',
        chapter: 399,
        label: 'ch. 399 — le transfert dépend des contacts au moment du coup',
      }),
    },

    'erase-the-damage': {
      label: 'Effacer les dégâts',
      refusal: 'Les dégâts sont déplacés, jamais annulés : quelqu’un les prend',
      evidence: shown({
        kind: 'chapter',
        chapter: 399,
        label: 'ch. 399 — le report est un transfert, pas un soin',
      }),
    },

    transfer: {
      label: 'Reporter les dégâts',
      evidence: shown({
        kind: 'chapter',
        chapter: 399,
        label: 'ch. 399 — le coup part ailleurs que là où il a frappé',
      }),
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
    entryActions: ['link', 'self-transfer', 'absorb-without-left-contact'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'DamageLedger',
  }),
})
