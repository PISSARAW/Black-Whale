import {
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
  name: 'Bâton du prêtre',
  owner: 'saiyu',
  category: 'conjurer',

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Un seul bâton tenu et contrôlé', amount: 1, unit: 'bâton' },

  actions: {
    conjure: {
      label: 'Matérialiser le bâton',
      effects: [
        spawnNenEntity({
          id: (ctx) => `saiyu-staff-${ctx.actorId}`,
          kind: 'CONSTRUCT',
          label: 'Bâton du prêtre',
          metadata: { lengthIsVariable: true },
        }),
      ],
    },

    restrain: {
      label: 'Retenir un allié',
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
    allowedTargets: ['CHARACTER', 'BODY'],
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
  name: 'Les trois singes',
  owner: 'saiyu',
  category: 'conjurer',

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Une frappe réussie par sens retiré', amount: 3, unit: 'frappes' },

  actions: Object.fromEntries(
    MONKEYS.map((monkey) => [
      `send-${monkey.id}`,
      {
        label: `Envoyer ${monkey.label}`,
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
  ),

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

  conditions: [canUseNen(), isConscious()],

  targets: [zone(), person()],

  cost: { label: 'Trois vers — leur qualité fixe la puissance', amount: 3, unit: 'vers' },

  actions: {
    compose: {
      label: 'Écrire un haïku',
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

    invoke: {
      label: 'Invoquer l’effet',
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
  name: 'Manipulation des oiseaux',
  owner: 'cluck',
  category: 'manipulator',

  conditions: [canUseNen(), isConscious()],

  targets: [zone()],

  cost: { label: 'Un lien d’aura par oiseau contrôlé', amount: 1, unit: 'lien/oiseau' },

  actions: {
    'gather-flock': {
      label: 'Rassembler la volée',
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

    deliver: {
      label: 'Livrer un pli',
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
  name: 'Coup de poing à distance',
  owner: 'leorio-paradinight',
  category: 'emitter',

  conditions: [canUseNen(), isConscious()],

  targets: [person(), self()],

  cost: { label: 'Une surface continue et l’aura émise à travers elle', unit: 'aura' },

  actions: {
    punch: {
      label: 'Frapper à travers une surface',
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
