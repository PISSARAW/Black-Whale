import {
  asserted,
  buildManifest,
  canUseNen,
  constraint,
  controlLink,
  defineAbility,
  effect,
  effectIsLive,
  isConscious,
  knowledgeGrant,
  listParam,
  moveEntity,
  numberParam,
  param,
  person,
  requiresParameter,
  requiresTarget,
  self,
  setEffectState,
  shown,
  spawnNenEntity,
  zone,
} from '@black-whale/ability-sdk'

/**
 * Priest's staff — Saiyu
 *
 * A staff of variable length, used as readily to hold an ally back as to finish
 * an opponent. The dual use is worth keeping as two actions: the Zodiacs
 * restrain far more often than they kill.
 */
export const saiyuPriestStaff = defineAbility({
  id: 'saiyu-priest-staff',
  name: 'Priest Staff',
  owner: 'saiyu',
  category: 'conjurer',

  site: {
    kind: 'staff',
    instruction:
      'Plant the staff and lengthen it: every thrust reaches one body further out along the row.',
    rule: 'The conjured staff extends and strikes with force at close or mid range.',
    cost: 'One controlled staff',
    color: '#d5a94f',
    action: 'Plant the staff',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Un seul bâton tenu et contrôlé', amount: 1, unit: 'bâton' },

  actions: {
    conjure: {
      label: 'Matérialiser le bâton',
      evidence: shown('ch. 349 — le bâton matérialisé'),
      effects: [
        spawnNenEntity({
          id: (ctx) => `saiyu-staff-${ctx.actorId}`,
          kind: 'CONSTRUCT',
          label: 'Bâton du prêtre',
          metadata: { lengthIsVariable: true },
        }),
      ],
    },

    'lengthen-the-staff': {
      label: 'Allonger le bâton',
      evidence: shown('ch. 349 — la longueur est ce qui se règle'),
      effects: [
        constraint({
          rules: ['La longueur du bâton se règle à volonté.'],
          attributes: (ctx) => ({ lengthMeters: numberParam(ctx, 'lengthMeters') }),
        }),
      ],
    },

    restrain: {
      label: 'Retenir un allié',
      evidence: shown('ch. 349 — le bâton retient sans blesser'),
      conditions: [requiresTarget('Un allié est retenu')],
      effects: [
        constraint({
          rules: ['Le bâton immobilise sans blesser.'],
          attributes: (ctx) => ({ lengthMeters: numberParam(ctx, 'lengthMeters') }),
        }),
      ],
    },

    strike: {
      label: 'Frapper à distance',
      evidence: shown('ch. 349 — le bâton s’allonge jusqu’à la cible'),
      conditions: [requiresTarget('Un adversaire est frappé')],
      effects: [
        constraint({
          rules: ['Le bâton s’allonge pour atteindre une cible éloignée.'],
          attributes: (ctx) => ({ lengthMeters: numberParam(ctx, 'lengthMeters'), lethal: true }),
        }),
      ],
    },
  },

  ui: { componentKey: 'StaffView' },

  interactionManifest: buildManifest('saiyu-priest-staff', {
    inputMode: 'DRAG',
    allowedTargets: ['CHARACTER', 'BODY', 'OBJECT'],
    overlays: ['RANGE', 'TRAJECTORY'],
    entryActions: ['conjure'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'StaffView',
  }),
})

/** The three monkeys, and the sense each one takes away. */
const MONKEYS = [
  { id: 'mizaru', sense: 'sight', label: 'Mizaru — la vue' },
  { id: 'kikazaru', sense: 'hearing', label: 'Kikazaru — l’ouïe' },
  { id: 'iwazaru', sense: 'speech', label: 'Iwazaru — la parole' },
] as const

/**
 * Three monkeys — Saiyu
 *
 * Each monkey cuts one channel of perception, which plugs straight into the
 * knowledge engine: a target under Mizaru stops generating visual facts, so
 * their perspective goes dark instead of merely being annotated "blinded".
 */
export const saiyuThreeMonkeys = defineAbility({
  id: 'saiyu-three-monkeys',
  name: 'Three Monkeys',
  owner: 'saiyu',
  category: 'conjurer',

  site: {
    kind: 'senses',
    instruction:
      'Each click seals sight, hearing, then speech across the site; the fourth releases all three senses.',
    rule: 'Three Nen monkeys rob the target of vision, hearing and speech when their attacks connect.',
    cost: 'Three successful sensory strikes',
    color: '#c58c5b',
    action: 'Seal sight',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Une frappe réussie par sens retiré', amount: 3, unit: 'frappes' },

  actions: Object.fromEntries([
    [
      'restore-a-sense',
      {
        label: 'Rendre un sens',
        evidence: asserted('ce que les singes retirent, ils peuvent le rendre'),
        effects: [setEffectState({ state: 'ENDED' })],
      },
    ],
    [
      'seal-without-a-hit',
      {
        label: 'Retirer un sens sans toucher la cible',
        refusal: 'Un sens retiré coûte une frappe réussie : sans contact, rien n’est scellé',
      },
    ],
    [
      'seal-a-fourth-sense',
      {
        label: 'Retirer un quatrième sens',
        refusal: 'Trois singes, trois sens : la vue, l’ouïe et la parole',
      },
    ],
    ...MONKEYS.map((monkey) => [
      `send-${monkey.id}`,
      {
        label: `Envoyer ${monkey.label}`,
        evidence: shown('ch. 349 — les trois singes coupent chacun leur canal'),
        conditions: [requiresTarget('Une cible est visée')],
        effects: [
          spawnNenEntity({
            id: `saiyu-${monkey.id}`,
            kind: 'NEN_ENTITY',
            label: monkey.label,
            metadata: { sense: monkey.sense },
          }),
          effect({
            kind: 'CONSTRAINT',
            discriminator: monkey.id,
            attributes: {
              sense: monkey.sense,
              rules: [
                `La cible perd ${monkey.sense === 'sight' ? 'la vue' : monkey.sense === 'hearing' ? 'l’ouïe' : 'la parole'}.`,
                'La perte des trois sens perturbe gravement la cible.',
              ],
            },
          }),
        ],
      },
    ]),
  ]),

  ui: { componentKey: 'SensesView' },

  interactionManifest: buildManifest('saiyu-three-monkeys', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'BODY'],
    overlays: ['CONTROL_LINK', 'RANGE'],
    entryActions: ['send-mizaru'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'SensesView',
  }),
})

export const SAIYU_MONKEYS = MONKEYS

/**
 * Great Hiker — Basho
 *
 * The poem is the ability: its quality and its seasonal word decide the power,
 * and both are stored so the effect can explain itself in the terms the manga
 * uses.
 */
export const greatHaiku = defineAbility({
  id: 'great-haiku',
  name: 'Great Hiker',
  owner: 'basho',
  category: 'specialist',

  site: {
    kind: 'poetry',
    instruction:
      'Select three pieces of page copy; a word of light purifies what it names, a word of fire burns it, and a poem with neither does nothing.',
    rule: 'The result grows stronger when the three selected lines form a convincing poem.',
    cost: 'Three lines · quality determines power',
    color: '#e7c873',
    action: 'Choose the first line',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [zone(), person()],

  cost: { label: 'Trois vers — leur qualité fixe la puissance', amount: 3, unit: 'vers' },

  actions: {
    compose: {
      label: 'Écrire un haïku',
      evidence: asserted('trois vers, dont la qualité fixe la puissance'),
      conditions: [requiresParameter('haiku', 'Un haïku est écrit')],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'haiku',
          attributes: (ctx) => ({
            haiku: param(ctx, 'haiku'),
            seasonWord: param(ctx, 'seasonWord'),
            // Better poetry, stronger effect: the canon is explicit about it.
            quality: numberParam(ctx, 'quality'),
          }),
        }),
      ],
    },

    'compose-without-a-season-word': {
      label: 'Écrire sans mot de saison',
      refusal: 'Le haïku obéit à sa forme : trois vers et le mot de saison',
      evidence: asserted('la forme est la condition de la capacité'),
    },

    'invoke-twice': {
      label: 'Invoquer deux fois le même haïku',
      refusal: 'Un poème pour un effet : il faut en écrire un autre',
    },

    invoke: {
      label: 'Invoquer l’effet',
      evidence: asserted('l’effet suit le poème une fois écrit'),
      conditions: [effectIsLive('effectId', 'Un haïku est écrit')],
      effects: [
        setEffectState({
          state: 'TRIGGERED',
          attributes: (ctx) => ({ invokedEffect: param(ctx, 'invokedEffect') }),
        }),
      ],
    },
  },

  ui: { componentKey: 'HaikuScroll' },

  interactionManifest: buildManifest('great-haiku', {
    inputMode: 'CUSTOM',
    allowedTargets: ['LOCATION', 'CHARACTER'],
    overlays: ['AURA', 'RANGE'],
    entryActions: ['compose'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'HaikuScroll',
  }),
})

/**
 * Bird manipulation — Cluck
 *
 * A mass control link over a cohort of birds, precise enough to deliver ballots.
 * Off the Black Whale, but it is the catalogue's other example of a controlled
 * flock, and it shares the cohort component.
 */
export const birdManipulation = defineAbility({
  id: 'bird-manipulation',
  name: 'Bird Manipulation',
  owner: 'cluck',
  category: 'manipulator',

  site: {
    kind: 'flock',
    instruction:
      'Assign birds to page elements; each pigeon carries a readable dispatch into the flock’s delivery panel.',
    rule: 'Hundreds of controlled birds can deliver documents accurately over a vast area.',
    cost: 'One controlled bird per dispatch',
    color: '#b9d8e8',
    action: 'Give a dispatch to the flock',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [zone()],

  cost: { label: 'Un lien d’aura par oiseau contrôlé', amount: 1, unit: 'lien/oiseau' },

  actions: {
    'gather-flock': {
      label: 'Rassembler la volée',
      evidence: shown('ch. 320 — la volée rassemblée autour de Cheadle'),
      effects: [
        spawnNenEntity({ id: 'cluck-flock', kind: 'COHORT', label: 'Volée de Cluck' }),
        controlLink({
          vector: 'flock',
          mode: 'control',
          targets: () => [{ id: 'cluck-flock', kind: 'COHORT' }],
          attributes: (ctx) => ({ memberIds: listParam(ctx, 'memberIds'), species: 'pigeons' }),
        }),
      ],
    },

    'scout-with-the-flock': {
      label: 'Faire observer par la volée',
      evidence: asserted('des oiseaux menés en nuée voient ce qui se passe en dessous'),
      effects: [
        knowledgeGrant({
          factId: (ctx) => `seen-by-flock:${param(ctx, 'locationId') ?? 'zone'}`,
          state: 'BELIEVED',
          confidence: 0.6,
        }),
      ],
    },

    'control-a-person': {
      label: 'Contrôler une personne',
      refusal: 'La capacité mène des oiseaux, pas des gens',
    },

    deliver: {
      label: 'Livrer un pli',
      evidence: shown('ch. 320 — les oiseaux portent les plis'),
      conditions: [
        effectIsLive('effectId', 'La volée est rassemblée'),
        requiresParameter('locationId', 'Une destination est choisie'),
      ],
      effects: [
        moveEntity({ entity: () => ({ id: 'cluck-flock', kind: 'COHORT' }) }),
        knowledgeGrant({
          factId: (ctx) => `delivered:${param(ctx, 'parcelId') ?? 'parcel'}`,
          state: 'KNOWN',
        }),
      ],
    },
  },

  ui: { componentKey: 'FlockView' },

  interactionManifest: buildManifest('bird-manipulation', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['LOCATION', 'CHARACTER'],
    overlays: ['CONTROL_LINK', 'TRAJECTORY'],
    entryActions: ['gather-flock'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'FlockView',
  }),
})

/**
 * Remote punch — Leorio Paradinight
 *
 * Small and memorable: aura travels through a surface and a fist comes out
 * somewhere chosen. On the map it is a trajectory that ignores the wall it
 * passed through.
 */
export const leorioRemotePunch = defineAbility({
  id: 'leorio-remote-punch',
  name: 'Remote Punch',
  owner: 'leorio-paradinight',
  category: 'emitter',

  site: {
    kind: 'remote-strike',
    instruction:
      'Strike an element and the aura runs along its surface, coming up under another element on that same surface; strike again for another fist.',
    rule: 'Aura travels through a surface and reproduces the punch at a distant point.',
    cost: 'A connected surface and emitted aura',
    color: '#62c6e8',
    action: 'Choose a remote impact',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person(), self()],

  cost: { label: 'Une surface continue et l’aura émise à travers elle', unit: 'aura' },

  actions: {
    'punch-around-a-corner': {
      label: 'Frapper hors de vue',
      evidence: shown('ch. 385 — Leorio frappe ce qu’il ne voit pas directement'),
      conditions: [requiresParameter('surfaceId', 'Une surface est frappée')],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'remote-punch-blind',
          attributes: (ctx) => ({ throughSurfaceId: param(ctx, 'surfaceId'), lineOfSight: false }),
        }),
      ],
    },

    'punch-through-a-gap': {
      label: 'Frapper à travers un vide',
      refusal: 'Il faut une surface continue : l’aura ne traverse pas le vide',
      evidence: shown('ch. 385 — le coup passe par la matière, pas par l’air'),
    },

    'choose-the-exit-point': {
      label: 'Choisir le point de sortie',
      evidence: shown('ch. 385 — le poing ressort là où Leorio l’a décidé'),
      conditions: [requiresParameter('exitPoint', 'Un point de sortie est choisi')],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'remote-punch-exit',
          attributes: (ctx) => ({ exitPoint: param(ctx, 'exitPoint') }),
        }),
      ],
    },

    punch: {
      label: 'Frapper à travers une surface',
      evidence: shown('ch. 385 — l’uppercut qui traverse la cloison'),
      conditions: [
        requiresTarget('Une cible est visée'),
        requiresParameter('surfaceId', 'Une surface est frappée'),
      ],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'remote-punch',
          attributes: (ctx) => ({
            throughSurfaceId: param(ctx, 'surfaceId'),
            exitPoint: param(ctx, 'exitPoint'),
            rules: ['L’aura traverse la surface et ressort au point choisi.'],
          }),
        }),
      ],
    },
  },

  ui: { componentKey: 'RemoteStrikeView' },

  interactionManifest: buildManifest('leorio-remote-punch', {
    inputMode: 'DRAW',
    allowedTargets: ['CHARACTER', 'OBJECT', 'LOCATION'],
    overlays: ['TRAJECTORY'],
    entryActions: ['punch'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'RemoteStrikeView',
  }),
})
