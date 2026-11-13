import {
  asserted,
  auraModifier,
  bodyState,
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  isConscious,
  numberParam,
  param,
  requiresParameter,
  requiresTarget,
  self,
  shown,
  spawnNenEntity,
} from '@black-whale/ability-sdk'

/** Armour sustained by Bonolenov's dance and melody. */
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
      evidence: shown({
        kind: 'chapter',
        chapter: 355,
        label: 'ch. 355 — la préparation précède chaque pièce',
      }),
    },
    'keep-the-rhythm': {
      label: 'Tenir le rythme',
      evidence: shown({
        kind: 'chapter',
        chapter: 355,
        label: 'ch. 355 — l’armure tient tant que la pièce continue',
      }),
      effects: [auraModifier({ form: 'armour', sustained: true })],
      cost: { label: 'Souffle et mouvement continus', unit: 'souffle' },
    },
    'fight-in-silence': {
      label: 'Combattre sans musique',
      refusal: 'Sans danse ni mélodie, Bonolenov n’a ni armure ni lance',
      evidence: shown({
        kind: 'chapter',
        chapter: 355,
        label: 'ch. 355 — la musique porte la technique',
      }),
    },
    perform: {
      label: 'Danser et jouer',
      evidence: shown({
        kind: 'chapter',
        chapter: 355,
        label: 'ch. 355 — la danse et la mélodie, puis l’armure',
      }),
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

/** Bonolenov's prepared sphere and its overwhelming mass. */
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
      evidence: shown({
        kind: 'chapter',
        chapter: 356,
        label: 'ch. 356 — la sphère tombe sur qui elle vise',
      }),
      conditions: [requiresTarget('Une cible est visée')],
      effects: [bodyState({ state: 'INJURED' })],
    },
    'drop-on-a-zone': {
      label: 'Écraser une zone',
      evidence: asserted({
        kind: 'other',
        label: 'la sphère écrase ce qu’elle recouvre, pas seulement une cible',
      }),
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
      evidence: shown({
        kind: 'chapter',
        chapter: 356,
        label: 'ch. 356 — la danse et la mélodie précèdent la sphère',
      }),
    },
    perform: {
      label: 'Matérialiser la sphère',
      evidence: shown({
        kind: 'chapter',
        chapter: 356,
        label: 'ch. 356 — la sphère tombe de tout son poids',
      }),
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
