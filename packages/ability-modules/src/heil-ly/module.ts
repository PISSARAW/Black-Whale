import {
  asserted,
  bodyState,
  buildManifest,
  canUseNen,
  constraint,
  controlLink,
  defineAbility,
  effect,
  effectIsLive,
  hypothesis,
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
  shown,
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
  name: 'Hideout Doors',
  owner: 'voconte',
  category: 'conjurer',

  site: {
    kind: 'door-network',
    instruction:
      'Arm one frame and one return frame; stepping into either comes out at the other, walking past does nothing, and Nen constructs are not moved.',
    rule: 'The doors connect prepared rooms throughout the Heil-Ly base instead of opening unrestricted portals anywhere.',
    cost: 'Prepared hideout walls and connected rooms',
    color: '#7ec8b6',
    action: 'Install the first door',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [zone()],

  cost: { label: 'Deux murs préparés dans la planque Heil-Ly', amount: 2, unit: 'portes' },

  actions: {
    'open-door': {
      label: 'Créer une porte',
      evidence: shown('ch. 383 — le repaire recombiné par ses portes'),
      conditions: [
        requiresParameter('fromLocationId', 'Une pièce de départ est choisie'),
        requiresParameter('locationId', 'Une pièce d’arrivée est choisie'),
      ],
      effects: [portal({ attributes: { network: 'heil-ly-hideout', permanent: true } })],
    },

    'walk-through': {
      label: 'Franchir une porte',
      evidence: shown('ch. 383 — les membres circulent par le réseau'),
      conditions: [effectIsLive('effectId', 'La porte existe')],
      effects: [
        moveEntity({ entity: (ctx) => ctx.actor ?? { id: ctx.actorId, kind: 'CHARACTER' } }),
      ],
    },

    'open-outside-the-hideout': {
      label: 'Ouvrir une porte hors du repaire',
      refusal: 'Le réseau ne relie que les pièces du repaire',
      evidence: asserted('la capacité est décrite sur le repaire, pas au-delà'),
    },

    'close-door': {
      label: 'Refermer une porte',
      evidence: asserted('une porte créée se referme'),
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

  site: {
    kind: 'blood-search',
    instruction:
      'Release a drop and leave it: it reports its findings on its own over the next minutes, then dries up and takes them with it.',
    rule: 'Only Zakuro’s own blood can be manipulated; autonomous eyed droplets expire after roughly thirty to forty minutes.',
    cost: 'Open wound · carried blood supply · limited search time',
    color: '#b51f3c',
    action: 'Release the first blood drop',
  },

  arena: {
    effect: 'bind',
    cost: 12,
    persistent: true,
    condition: 'shed-blood',
    risk: 'blood-loss',
    mechanic: 'tracking',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person(), self()],

  actions: {
    bleed: {
      label: 'Ouvrir une plaie',
      evidence: shown('ch. 383 — le sang versé pour servir'),
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

    'use-someone-elses-blood': {
      label: 'Manipuler le sang d’autrui',
      evidence: hypothesis('le manga ne montre la capacité que sur son propre sang'),
      effects: [constraint({ rules: ['Le sang d’un tiers est manipulé.'] })],
    },

    'act-without-an-open-wound': {
      label: 'Agir sans plaie ouverte',
      refusal: 'Il faut du sang versé : sans plaie, la capacité n’a rien à manipuler',
      evidence: shown('ch. 383 — la plaie précède toujours l’effet'),
    },

    restrain: {
      label: 'Entraver',
      evidence: shown('ch. 383 — le sang manipulé immobilise'),
      conditions: [
        requiresTarget('Une cible est entravée'),
        effectIsLive('effectId', 'Du sang est disponible'),
      ],
      effects: [constraint({ rules: ['Le sang manipulé immobilise la cible.'] })],
    },

    'split-into-eyes': {
      label: 'Diviser en gouttes-yeux',
      evidence: shown('ch. 383 — les gouttes qui regardent'),
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

  site: {
    kind: 'weapon-body',
    instruction:
      'Strike a target and see what the arm became: a hammer drives it into the floor, a drill bores a hole through it, an axe cuts it in two.',
    rule: 'The arm takes one of the three shapes at random — Padaille transforms his own body into tools he knows rather than conjuring equipment, but he does not pick which one answers.',
    cost: 'Transformed limb · no say in the shape',
    color: '#c6925e',
    action: 'Swing whatever the arm became',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [self()],

  cost: { label: 'Une partie du corps transformée par arme', amount: 1, unit: 'membre' },

  actions: {
    transform: {
      label: 'Transformer un membre',
      evidence: shown('ch. 383 — le corps armé par la transformation'),
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

    'strike-with-the-weapon': {
      label: 'Frapper avec l’arme',
      evidence: shown('ch. 383 — le membre transformé sert d’arme'),
      conditions: [requiresTarget('Une cible est frappée')],
      effects: [bodyState({ state: 'INJURED' })],
    },

    'transform-a-second-limb': {
      label: 'Transformer un second membre',
      refusal: 'Une partie du corps par arme : le reste demeure humain',
      evidence: asserted('la limite énoncée avec la capacité'),
    },

    revert: {
      label: 'Reprendre forme humaine',
      evidence: asserted('la forme humaine revient quand le combat cesse'),
      conditions: [effectIsLive('effectId', 'Un membre est transformé')],
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  ui: { componentKey: 'BodyWeaponView' },

  interactionManifest: buildManifest('padaille-weapon-transformation', {
    inputMode: 'CLICK',
    allowedTargets: ['CHARACTER', 'BODY', 'OBJECT'],
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
  name: 'Snake Arm',
  owner: 'gel',
  category: 'transmuter',

  site: {
    kind: 'serpent',
    instruction:
      'Coil the arm three times to tighten it — pinned from the second — and a fourth touch lets go of everything at once.',
    rule: 'Gel partially transforms her arm into a snake capable of instantly restraining a Zodiac-level target.',
    cost: 'Maintained partial transformation',
    color: '#86c98a',
    action: 'Choose something to restrain',
  },

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

    'grip-with-the-snake': {
      label: 'Saisir avec le bras-serpent',
      evidence: asserted('le bras allongé retient autant qu’il frappe'),
      conditions: [requiresTarget('Une cible est saisie')],
      effects: [constraint({ rules: ['Le bras-serpent enserre la cible.'] })],
    },

    'bite-through-armour': {
      label: 'Mordre à travers une armure',
      evidence: hypothesis('la morsure opposée à une protection d’aura'),
      effects: [bodyState({ state: 'INJURED' })],
    },

    bite: {
      label: 'Mordre',
      evidence: shown('ch. 383 — le bras-serpent mord'),
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
