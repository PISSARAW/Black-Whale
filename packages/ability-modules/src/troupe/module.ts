import {
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
  requiresTarget,
  self,
  setEffectState,
  spawnNenEntity,
  vow,
} from '@black-whale/ability-sdk'

/**
 * Battle Cantabile: Prologue — Bonolenov Ndongo
 *
 * Dance and melody first, always: the activation is a sequence, and the armour
 * that materialises is a construct rather than a stat.
 */
export const battleCantabilePrologue = defineAbility({
  id: 'battle-cantabile-prologue',
  name: 'Battle Cantabile: Prologue',
  owner: 'bonolenov-ndongo',
  category: 'conjurer',

  site: {
    kind: 'rhythm',
    instruction:
      'Play the piece over one element to conjure its warrior attire and spear: it gains reach over its neighbours and cover against everything else.',
    rule: 'Air passing through the body’s holes becomes battle music whose rhythm carries the technique.',
    cost: 'Continuous movement and rhythm',
    color: '#d7b56d',
    action: 'Begin the rhythm',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [self()],

  cost: { label: 'Mouvement et rythme continus', unit: 'souffle' },

  actions: {
    perform: {
      label: 'Danser et jouer',
      effects: [
        spawnNenEntity({
          id: (ctx) => `prologue-armour-${ctx.actorId}`,
          kind: 'CONSTRUCT',
          label: 'Armure du Prologue',
          metadata: { requiresDance: true, requiresMelody: true },
        }),
        auraModifier({
          form: 'armour',
          rules: ['Nécessite la danse et la mélodie jouée par les trous du corps.'],
        }),
      ],
    },
  },

  ui: { componentKey: 'BattleCantabileView' },

  interactionManifest: buildManifest('battle-cantabile-prologue', {
    inputMode: 'SEQUENCE',
    allowedTargets: ['CHARACTER'],
    overlays: ['AURA'],
    entryActions: ['perform'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'BattleCantabileView',
  }),
})

/**
 * Battle Cantabile: Jupiter — Bonolenov Ndongo
 *
 * The same preparation, a far larger sphere: mass is the whole ability, so the
 * module carries it as an attribute the map can draw at scale.
 */
export const battleCantabileJupiter = defineAbility({
  id: 'battle-cantabile-jupiter',
  name: 'Battle Cantabile: Jupiter',
  owner: 'bonolenov-ndongo',
  category: 'conjurer',

  site: {
    kind: 'impact',
    instruction:
      'Conjure Jupiter over a target; once the dance is done it chases, and only leaving earshot of the music escapes it.',
    rule: 'The conjured planet crushes the designated target with overwhelming mass.',
    cost: 'One massive impact',
    color: '#d9935b',
    action: 'Choose the impact site',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [self()],

  actions: {
    perform: {
      label: 'Matérialiser la sphère',
      effects: [
        spawnNenEntity({
          id: (ctx) => `jupiter-sphere-${ctx.actorId}`,
          kind: 'CONSTRUCT',
          label: 'Sphère de Jupiter',
          metadata: (ctx) => ({ massFactor: numberParam(ctx, 'massFactor') ?? 1 }),
        }),
        effect({
          kind: 'CUSTOM',
          discriminator: 'sphere',
          attributes: (ctx) => ({
            massFactor: numberParam(ctx, 'massFactor') ?? 1,
            requiresDance: true,
            requiresMelody: true,
          }),
        }),
      ],
      cost: { label: 'Préparation longue avant chaque usage', unit: 'temps' },
    },
  },

  ui: { componentKey: 'BattleCantabileView' },

  interactionManifest: buildManifest('battle-cantabile-jupiter', {
    inputMode: 'SEQUENCE',
    allowedTargets: ['CHARACTER', 'LOCATION'],
    overlays: ['AURA', 'RANGE'],
    entryActions: ['perform'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'BattleCantabileView',
  }),
})

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

    disgorge: {
      label: 'Recracher',
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

  conditions: [
    canUseNen(),
    isConscious(),
    vow('severed-fingertips', 'Restriction : phalanges distales sectionnées volontairement'),
  ],

  targets: [person()],

  cost: { label: 'Mutilation volontaire et permanente', amount: 10, unit: 'phalanges' },

  actions: {
    fire: {
      label: 'Ouvrir le feu',
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
    allowedTargets: ['CHARACTER', 'LOCATION'],
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

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    'wind-up': {
      label: 'Armer le bras',
      effects: [auraModifier({ charge: 0, rotationDirection: 'clockwise' })],
    },

    rotate: {
      label: 'Tourner',
      conditions: [effectIsLive('effectId', 'Le bras est armé')],
      effects: [
        attributeCounter({
          increments: (ctx) => ({ charge: numberParam(ctx, 'rotations') ?? 1 }),
        }),
      ],
      cost: { label: 'Difficile à calibrer : la charge se libère d’un coup', unit: 'rotations' },
    },

    strike: {
      label: 'Frapper',
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
    allowedTargets: ['CHARACTER'],
    overlays: ['AURA'],
    entryActions: ['wind-up'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'ChargeGauge',
  }),
})
