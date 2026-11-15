import {
  asserted,
  buildManifest,
  canUseNen,
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

export { SAIYU_MONKEYS, saiyuPriestStaff, saiyuThreeMonkeys } from './saiyu.js'

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
      evidence: asserted({ kind: 'other', label: 'trois vers, dont la qualité fixe la puissance' }),
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
      evidence: asserted({ kind: 'other', label: 'la forme est la condition de la capacité' }),
    },

    'invoke-twice': {
      label: 'Invoquer deux fois le même haïku',
      refusal: 'Un poème pour un effet : il faut en écrire un autre',
    },

    invoke: {
      label: 'Invoquer l’effet',
      evidence: asserted({ kind: 'other', label: 'l’effet suit le poème une fois écrit' }),
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
      evidence: shown({
        kind: 'chapter',
        chapter: 320,
        label: 'ch. 320 — la volée rassemblée autour de Cheadle',
      }),
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
      evidence: asserted({
        kind: 'other',
        label: 'des oiseaux menés en nuée voient ce qui se passe en dessous',
      }),
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
      evidence: shown({
        kind: 'chapter',
        chapter: 320,
        label: 'ch. 320 — les oiseaux portent les plis',
      }),
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
      evidence: shown({
        kind: 'chapter',
        chapter: 385,
        label: 'ch. 385 — Leorio frappe ce qu’il ne voit pas directement',
      }),
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
      evidence: shown({
        kind: 'chapter',
        chapter: 385,
        label: 'ch. 385 — le coup passe par la matière, pas par l’air',
      }),
    },

    'choose-the-exit-point': {
      label: 'Choisir le point de sortie',
      evidence: shown({
        kind: 'chapter',
        chapter: 385,
        label: 'ch. 385 — le poing ressort là où Leorio l’a décidé',
      }),
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
      evidence: shown({
        kind: 'chapter',
        chapter: 385,
        label: 'ch. 385 — l’uppercut qui traverse la cloison',
      }),
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
