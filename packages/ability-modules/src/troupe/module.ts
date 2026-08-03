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
  param,
  person,
  requiresParameter,
  requiresTarget,
  self,
  setEffectState,
  shown,
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
    'play-without-preparation': {
      label: 'Jouer sans danse ni mélodie',
      refusal: 'La danse et la mélodie sont l’activation de tout le Battle Cantabile',
      evidence: shown('ch. 355 — la préparation précède chaque pièce'),
    },

    'keep-the-rhythm': {
      label: 'Tenir le rythme',
      // The armour lasts as long as the music does, so holding the beat is a
      // use in its own right.
      evidence: shown('ch. 355 — l’armure tient tant que la pièce continue'),
      effects: [auraModifier({ form: 'armour', sustained: true })],
      cost: { label: 'Souffle et mouvement continus', unit: 'souffle' },
    },

    'fight-in-silence': {
      label: 'Combattre sans musique',
      refusal: 'Sans danse ni mélodie, Bonolenov n’a ni armure ni lance',
      evidence: shown('ch. 355 — la musique porte la technique'),
    },

    perform: {
      label: 'Danser et jouer',
      evidence: shown('ch. 355 — la danse et la mélodie, puis l’armure'),
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

  arena: {
    effect: 'impact',
    cost: 6,
    persistent: true,
    condition: 'three-beat-sequence',
    risk: 'rhythm-break',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [self()],

  actions: {
    'aim-at-a-single-target': {
      label: 'Viser une seule cible',
      evidence: shown('ch. 356 — la sphère tombe sur qui elle vise'),
      conditions: [requiresTarget('Une cible est visée')],
      effects: [bodyState({ state: 'INJURED' })],
    },

    'drop-on-a-zone': {
      label: 'Écraser une zone',
      evidence: asserted('la sphère écrase ce qu’elle recouvre, pas seulement une cible'),
      conditions: [requiresParameter('locationId', 'Une zone est visée')],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'sphere-impact',
          attributes: (ctx) => ({ locationId: param(ctx, 'locationId'), scope: 'zone' }),
        }),
      ],
    },

    'summon-instantly': {
      label: 'Matérialiser sans préparation',
      refusal: 'La préparation est longue avant chaque usage : la sphère ne s’improvise pas',
      evidence: shown('ch. 356 — la danse et la mélodie précèdent la sphère'),
    },

    perform: {
      label: 'Matérialiser la sphère',
      evidence: shown('ch. 356 — la sphère tombe de tout son poids'),
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
    allowedTargets: ['CHARACTER', 'LOCATION', 'OBJECT'],
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
      evidence: shown('ch. 76 — la matière non vivante aspirée'),
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
      evidence: shown('ch. 76 — la limite énoncée avec la capacité'),
    },

    'medical-use': {
      label: 'Aspirer un fluide sur un blessé',
      // The one canon exception in spirit: what is drawn out is not the person.
      evidence: shown('ch. 316 — le sang retiré à un blessé'),
      conditions: [requiresTarget('Un blessé est traité')],
      effects: [effect({ kind: 'CUSTOM', discriminator: 'medical-suction' })],
    },

    'let-someone-else-disgorge': {
      label: 'Faire ressortir par un tiers',
      refusal: 'Seule Shizuku peut ressortir ce que Blinky a avalé',
      evidence: shown('ch. 76 — la règle énoncée avec la capacité'),
    },

    disgorge: {
      label: 'Recracher',
      evidence: shown('ch. 76 — ce qui a été aspiré ressort par sa seule main'),
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
      evidence: asserted('le tir s’arrête quand il cesse de projeter'),
      effects: [setEffectState({ state: 'ENDED', attributes: { reason: 'ceasefire' } })],
    },

    'fire-without-the-restriction': {
      label: 'Tirer sans la mutilation',
      refusal:
        'La puissance vient de la restriction : sans les phalanges sectionnées, il n’y a pas de capacité',
      evidence: shown('ch. 353 — la restriction volontaire est la capacité'),
    },

    'suppress-an-area': {
      label: 'Balayer une zone',
      evidence: shown('ch. 353 — le barrage couvre tout un secteur'),
      conditions: [requiresParameter('locationId', 'Une zone est balayée')],
      effects: [auraModifier({ mode: 'BARRAGE', scope: 'zone' })],
    },

    fire: {
      label: 'Ouvrir le feu',
      evidence: shown('ch. 353 — le barrage qui fauche les soldats'),
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
      evidence: shown('ch. 92 — le bras armé par la rotation'),
      effects: [auraModifier({ charge: 0, rotationDirection: 'clockwise' })],
    },

    rotate: {
      label: 'Tourner',
      evidence: shown('ch. 92 — la charge monte tour après tour'),
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
      evidence: shown('ch. 92 — la calibration est le point faible du hatsu'),
    },

    strike: {
      label: 'Frapper',
      evidence: shown('ch. 92 — toute la charge dans un seul coup'),
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
