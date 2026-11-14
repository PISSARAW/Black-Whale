import {
  asserted,
  attributeCounter,
  auraModifier,
  bodyState,
  buildManifest,
  canUseNen,
  constraint,
  defineAbility,
  effect,
  effectIsLive,
  isConscious,
  listParam,
  numberParam,
  object,
  person,
  requiresParameter,
  requiresTarget,
  setEffectState,
  shown,
  vow,
} from '@black-whale/ability-sdk'

export { battleCantabileJupiter, battleCantabilePrologue } from './battleCantabile.js'

/**
 * Blinky — Shizuku Murasaki
 *
 * A vacuum for everything that is not alive. The constraint is the ability, so
 * it lives on the effect rather than in the description: living matter is not
 * absorbed, and what goes in comes back only through Shizuku.
 */
export const blinky = defineAbility({
  id: 'blinky',
  name: 'Blinky',
  owner: 'shizuku-murasaki',
  category: 'conjurer',

  site: {
    kind: 'vacuum',
    instruction:
      'Name and vacuum nonliving content; Nen refuses to go in, which exposes traps, and a living target gets its foreign effects drawn out instead.',
    rule: 'Blinky sucks up any nonliving matter Shizuku names, except Nen constructs and things she considers alive.',
    cost: 'Declared nonliving target',
    color: '#85b9d8',
    action: 'Name something to vacuum',
  },

  arena: {
    effect: 'bind',
    cost: 14,
    persistent: false,
    condition: 'named-nonliving-target',
    risk: 'cannot-vacuum-nen',
    mechanic: 'vacuum',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [object()],

  cost: {
    label: 'Une cible déclarée non vivante — le Nen refuse d’entrer',
    amount: 1,
    unit: 'cible',
  },

  actions: {
    absorb: {
      label: 'Aspirer',
      evidence: shown({
        kind: 'chapter',
        chapter: 76,
        label: 'ch. 76 — la matière non vivante aspirée',
      }),
      conditions: [requiresTarget('Un objet est aspiré')],
      effects: [
        effect({
          kind: 'CONSTRAINT',
          discriminator: 'absorbed',
          attributes: (ctx) => ({
            containedIn: `blinky-${ctx.actorId}`,
            rules: [
              'N’aspire que la matière non vivante.',
              'La capacité de stockage est sans limite apparente.',
              'Seule Shizuku peut ressortir ce qui a été aspiré.',
            ],
          }),
        }),
      ],
    },

    'absorb-a-living-target': {
      label: 'Aspirer un être vivant',
      refusal: 'Le Nen refuse d’entrer dans le vivant : seule la matière inerte est aspirée',
      evidence: shown({
        kind: 'chapter',
        chapter: 76,
        label: 'ch. 76 — la limite énoncée avec la capacité',
      }),
    },

    'medical-use': {
      label: 'Aspirer un fluide sur un blessé',
      // The one canon exception in spirit: what is drawn out is not the person.
      evidence: shown({
        kind: 'chapter',
        chapter: 316,
        label: 'ch. 316 — le sang retiré à un blessé',
      }),
      conditions: [requiresTarget('Un blessé est traité')],
      effects: [effect({ kind: 'CUSTOM', discriminator: 'medical-suction' })],
    },

    'let-someone-else-disgorge': {
      label: 'Faire ressortir par un tiers',
      refusal: 'Seule Shizuku peut ressortir ce que Blinky a avalé',
      evidence: shown({
        kind: 'chapter',
        chapter: 76,
        label: 'ch. 76 — la règle énoncée avec la capacité',
      }),
    },

    disgorge: {
      label: 'Recracher',
      evidence: shown({
        kind: 'chapter',
        chapter: 76,
        label: 'ch. 76 — ce qui a été aspiré ressort par sa seule main',
      }),
      conditions: [effectIsLive('effectId', 'Quelque chose est stocké')],
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  ui: { componentKey: 'ContainerView' },

  interactionManifest: buildManifest('blinky', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['OBJECT'],
    overlays: ['RANGE'],
    entryActions: ['absorb'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'ContainerView',
  }),
})

/**
 * Double Machine Gun — Franklin Bordeau
 *
 * The teaching example of a voluntary vow: he cut his own fingertips off, and
 * the power comes from that. The "Vows and restrictions" sheet reads this
 * module, so the mutilation is a condition rather than a line of flavour text.
 */
export const doubleMachineGun = defineAbility({
  id: 'double-machine-gun',
  name: 'Double Machine Gun',
  owner: 'franklin-bordeau',
  category: 'emitter',

  site: {
    kind: 'barrage',
    instruction:
      'Every click sprays the target and everything standing beside it; Nen constructs do not stop the bullets.',
    rule: 'Severed fingertips emit a sustained, powerful volley whose force rewards commitment.',
    cost: 'Continuous emitted aura',
    color: '#e6ad57',
    action: 'Open fire',
  },

  arena: {
    effect: 'barrage',
    cost: 18,
    persistent: false,
    condition: 'clear-line',
    risk: 'recovery-window',
  },

  conditions: [
    canUseNen(),
    isConscious(),
    vow('severed-fingertips', 'Restriction : phalanges distales sectionnées volontairement'),
  ],

  targets: [person()],

  cost: { label: 'Mutilation volontaire et permanente', amount: 10, unit: 'phalanges' },

  actions: {
    'hold-the-fire': {
      label: 'Interrompre le barrage',
      evidence: asserted({ kind: 'other', label: 'le tir s’arrête quand il cesse de projeter' }),
      effects: [setEffectState({ state: 'ENDED', attributes: { reason: 'ceasefire' } })],
    },

    'fire-without-the-restriction': {
      label: 'Tirer sans la mutilation',
      refusal:
        'La puissance vient de la restriction : sans les phalanges sectionnées, il n’y a pas de capacité',
      evidence: shown({
        kind: 'chapter',
        chapter: 353,
        label: 'ch. 353 — la restriction volontaire est la capacité',
      }),
    },

    'suppress-an-area': {
      label: 'Balayer une zone',
      evidence: shown({
        kind: 'chapter',
        chapter: 353,
        label: 'ch. 353 — le barrage couvre tout un secteur',
      }),
      conditions: [requiresParameter('locationId', 'Une zone est balayée')],
      effects: [auraModifier({ mode: 'BARRAGE', scope: 'zone' })],
    },

    fire: {
      label: 'Ouvrir le feu',
      evidence: shown({
        kind: 'chapter',
        chapter: 353,
        label: 'ch. 353 — le barrage qui fauche les soldats',
      }),
      conditions: [requiresTarget('Une cible est visée')],
      effects: [
        auraModifier({ mode: 'BARRAGE', restrictionBonus: true }),
        // Area damage: the Cha-R soldiers die by the dozen in canon.
        (ctx) =>
          listParam(ctx, 'victimIds').flatMap((victimId) =>
            bodyState({ bodyId: victimId, state: 'DEAD' })(ctx),
          ),
      ],
    },
  },

  ui: { componentKey: 'BarrageView' },

  interactionManifest: buildManifest('double-machine-gun', {
    inputMode: 'DRAG',
    allowedTargets: ['CHARACTER', 'LOCATION', 'OBJECT'],
    overlays: ['TRAJECTORY', 'RANGE'],
    entryActions: ['fire'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'BarrageView',
  }),
})

/**
 * Ripper Cyclotron — Phinks Magcub
 *
 * The catalogue's reference for an accumulated charge: each rotation is one
 * increment on the effect, and the gauge on his sheet reads that counter. Hard
 * to calibrate in canon, which is exactly why the number is stored rather than
 * assumed.
 */
export const ripperCyclotron = defineAbility({
  id: 'ripper-cyclotron',
  name: 'Ripper Cyclotron',
  owner: 'phinks-magcub',
  category: 'enhancer',

  site: {
    kind: 'windup',
    instruction:
      'Wind the arm on one target, then punch a different one; under four rotations does nothing and over seven takes the bystanders too.',
    rule: 'Every full arm rotation increases the aura concentrated in the next punch.',
    cost: 'Visible wind-up time',
    color: '#f2c34f',
    action: 'Choose a target and wind up',
  },

  arena: {
    effect: 'impact',
    cost: 6,
    persistent: true,
    condition: 'consecutive-windup',
    risk: 'sequence-reset',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    'wind-up': {
      label: 'Armer le bras',
      evidence: shown({
        kind: 'chapter',
        chapter: 92,
        label: 'ch. 92 — le bras armé par la rotation',
      }),
      effects: [auraModifier({ charge: 0, rotationDirection: 'clockwise' })],
    },

    rotate: {
      label: 'Tourner',
      evidence: shown({
        kind: 'chapter',
        chapter: 92,
        label: 'ch. 92 — la charge monte tour après tour',
      }),
      conditions: [effectIsLive('effectId', 'Le bras est armé')],
      effects: [
        attributeCounter({
          increments: (ctx) => ({ charge: numberParam(ctx, 'rotations') ?? 1 }),
        }),
      ],
      cost: { label: 'Difficile à calibrer : la charge se libère d’un coup', unit: 'rotations' },
    },

    'release-early': {
      label: 'Relâcher avant d’être calibré',
      refusal: 'La charge est difficile à calibrer : relâchée trop tôt, elle part de travers',
      evidence: shown({
        kind: 'chapter',
        chapter: 92,
        label: 'ch. 92 — la calibration est le point faible du hatsu',
      }),
    },

    strike: {
      label: 'Frapper',
      evidence: shown({
        kind: 'chapter',
        chapter: 92,
        label: 'ch. 92 — toute la charge dans un seul coup',
      }),
      conditions: [
        requiresTarget('Une cible est frappée'),
        effectIsLive('effectId', 'Le bras est armé'),
      ],
      effects: [
        constraint({ rules: ['Toute la charge accumulée part dans un seul coup.'] }),
        setEffectState({ state: 'ENDED', attributes: { released: true } }),
      ],
    },
  },

  ui: { componentKey: 'ChargeGauge' },

  interactionManifest: buildManifest('ripper-cyclotron', {
    inputMode: 'HOLD',
    allowedTargets: ['CHARACTER', 'OBJECT'],
    overlays: ['AURA'],
    entryActions: ['wind-up'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'ChargeGauge',
  }),
})
