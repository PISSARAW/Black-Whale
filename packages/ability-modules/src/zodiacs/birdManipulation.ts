import {
  asserted,
  buildManifest,
  canUseNen,
  controlLink,
  defineAbility,
  effectIsLive,
  isConscious,
  knowledgeGrant,
  listParam,
  moveEntity,
  param,
  requiresParameter,
  shown,
  spawnNenEntity,
  zone,
} from '@black-whale/ability-sdk'

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
