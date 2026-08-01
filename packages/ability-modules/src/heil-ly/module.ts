import {
  bodyState,
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
  object,
  param,
  person,
  portal,
  requiresParameter,
  requiresTarget,
  self,
  setEffectState,
  spawnNenEntity,
  zone,
} from '@black-whale/ability-sdk'

/**
 * Voconte — hideout doors
 *
 * A door network inside the Heil-Ly base. It recombines the topology the same
 * way Luini does, minus the sealed-room price: this is infrastructure, not an
 * escape hatch, so the doors persist and the map redraws around them.
 */
export const voconteHideoutDoors = defineAbility({
  id: 'voconte-hideout-doors',
  name: 'Voconte — portes du repaire',
  owner: 'voconte',
  category: 'conjurer',

  conditions: [canUseNen(), isConscious()],

  targets: [zone()],

  cost: { label: 'Deux murs préparés dans la planque Heil-Ly', amount: 2, unit: 'portes' },

  actions: {
    'open-door': {
      label: 'Créer une porte',
      conditions: [
        requiresParameter('fromLocationId', 'Une pièce de départ est choisie'),
        requiresParameter('locationId', 'Une pièce d’arrivée est choisie'),
      ],
      effects: [portal({ attributes: { network: 'heil-ly-hideout', permanent: true } })],
    },

    'walk-through': {
      label: 'Franchir une porte',
      conditions: [effectIsLive('effectId', 'La porte existe')],
      effects: [
        moveEntity({ entity: (ctx) => ctx.actor ?? { id: ctx.actorId, kind: 'CHARACTER' } }),
      ],
    },

    'close-door': {
      label: 'Refermer une porte',
      conditions: [effectIsLive('effectId', 'La porte existe')],
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  ui: { componentKey: 'PortalNetworkView' },

  interactionManifest: buildManifest('voconte-hideout-doors', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['LOCATION'],
    overlays: ['TRAJECTORY', 'RANGE'],
    entryActions: ['open-door'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'PortalNetworkView',
  }),
})

/**
 * Bloody Mary — Zakuro Custard
 *
 * Blood she has already shed, put to work: it restrains, or it splits into
 * eyed droplets that watch. The second mode is a knowledge source, so a wound
 * becomes surveillance.
 */
export const bloodyMary = defineAbility({
  id: 'bloody-mary',
  name: 'Bloody Mary',
  owner: 'zakuro-custard',
  category: 'manipulator',

  conditions: [canUseNen(), isConscious()],

  targets: [person(), self()],

  actions: {
    bleed: {
      label: 'Ouvrir une plaie',
      effects: [
        bodyState({ bodyId: (ctx) => param(ctx, 'bodyId') ?? ctx.actorId, state: 'INJURED' }),
        effect({
          kind: 'CUSTOM',
          discriminator: 'blood',
          attributes: { medium: 'blood', requiresOpenWound: true },
        }),
      ],
      cost: { label: 'Le sang doit être versé pour servir', unit: 'blessure' },
    },

    restrain: {
      label: 'Entraver',
      conditions: [
        requiresTarget('Une cible est entravée'),
        effectIsLive('effectId', 'Du sang est disponible'),
      ],
      effects: [constraint({ rules: ['Le sang manipulé immobilise la cible.'] })],
    },

    'split-into-eyes': {
      label: 'Diviser en gouttes-yeux',
      conditions: [effectIsLive('effectId', 'Du sang est disponible')],
      effects: [
        controlLink({ vector: 'blood-droplet', mode: 'observe' }),
        (ctx) =>
          listParam(ctx, 'watchedEntityIds').flatMap((watchedId) =>
            knowledgeGrant({ factId: `seen:${watchedId}`, state: 'KNOWN' })(ctx),
          ),
      ],
    },
  },

  ui: { componentKey: 'BloodControl' },

  interactionManifest: buildManifest('bloody-mary', {
    inputMode: 'DRAW',
    allowedTargets: ['CHARACTER', 'BODY', 'LOCATION'],
    overlays: ['CONTROL_LINK', 'RANGE'],
    entryActions: ['bleed'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'BloodControl',
  }),
})

/**
 * Weapon transformation — Padaille
 *
 * Body parts become tools he actually knows how to use, which is the stated
 * limit: an unfamiliar tool is not an option. Which of the three he gets is
 * not a limit but a cost — the shape is drawn, not picked, so `tool` records
 * what the arm became rather than what he asked for. The draw itself is the
 * caller's: effects here stay replayable, so nothing rolls a die in the SDK.
 */
export const padailleWeaponTransformation = defineAbility({
  id: 'padaille-weapon-transformation',
  name: 'I’m Coming to Get You',
  owner: 'padaille',
  category: 'conjurer',

  conditions: [canUseNen(), isConscious()],

  targets: [self()],

  cost: { label: 'Une partie du corps transformée par arme', amount: 1, unit: 'membre' },

  actions: {
    transform: {
      label: 'Transformer un membre',
      conditions: [requiresParameter('tool', 'La forme prise par le membre est connue')],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'weapon',
          attributes: (ctx) => ({
            tool: param(ctx, 'tool'),
            limb: param(ctx, 'limb') ?? 'right-arm',
            rules: [
              'Padaille ne peut transformer un membre qu’en un outil qu’il connaît.',
              'Marteau, perceuse ou hache : la forme est tirée au sort, Padaille ne la choisit pas.',
              'Le marteau enfonce la cible dans le sol, la perceuse y perce un trou, la hache la coupe en deux.',
            ],
          }),
        }),
      ],
    },

    revert: {
      label: 'Reprendre forme humaine',
      conditions: [effectIsLive('effectId', 'Un membre est transformé')],
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  ui: { componentKey: 'BodyWeaponView' },

  interactionManifest: buildManifest('padaille-weapon-transformation', {
    inputMode: 'CLICK',
    allowedTargets: ['CHARACTER', 'BODY'],
    overlays: ['AURA'],
    entryActions: ['transform'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'BodyWeaponView',
  }),
})

/**
 * Snake arm — Gel
 *
 * The arm becomes a snake whose bite delivers a substance. What it injects is
 * the interesting part, so it is recorded on the effect rather than folded into
 * a generic wound.
 */
export const snakeArm = defineAbility({
  id: 'snake-arm',
  name: 'Bras-serpent',
  owner: 'gel',
  category: 'transmuter',

  conditions: [canUseNen(), isConscious()],

  targets: [person(), object(), self()],

  cost: { label: 'Transformation partielle du bras maintenue', unit: 'aura' },

  actions: {
    transform: {
      label: 'Transformer le bras',
      effects: [
        spawnNenEntity({
          id: (ctx) => `gel-snake-${ctx.actorId}`,
          kind: 'CONSTRUCT',
          label: 'Bras-serpent',
          metadata: { bodyColor: 'black', headColor: 'purple', markings: 'four-hearts' },
        }),
      ],
    },

    bite: {
      label: 'Mordre',
      conditions: [requiresTarget('Une cible est mordue')],
      effects: [
        effect({
          kind: 'CURSE',
          discriminator: 'venom',
          attributes: (ctx) => ({
            substance: param(ctx, 'substance') ?? 'inconnue',
            delivery: 'bite',
          }),
        }),
        bodyState({ state: 'INJURED' }),
      ],
    },
  },

  ui: { componentKey: 'BodyWeaponView' },

  interactionManifest: buildManifest('snake-arm', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'BODY', 'OBJECT'],
    overlays: ['TRAJECTORY', 'RANGE'],
    entryActions: ['transform'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'BodyWeaponView',
  }),
})
