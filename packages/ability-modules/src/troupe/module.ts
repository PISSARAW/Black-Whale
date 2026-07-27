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

  conditions: [canUseNen(), isConscious()],

  targets: [self()],

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

  conditions: [canUseNen(), isConscious()],

  targets: [object()],

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
