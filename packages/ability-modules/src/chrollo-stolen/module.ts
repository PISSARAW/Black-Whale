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
  locationIsSealed,
  moveEntity,
  numberParam,
  object,
  param,
  person,
  requiresParameter,
  requiresTarget,
  setEffectState,
  spawnNenEntity,
  unrevealed,
  zone,
} from '@black-whale/ability-sdk'

/**
 * The pages of Chrollo's book that the P1 wave left as descriptions. Each one is
 * short because each one does a single thing; what matters is that the book is
 * no longer a list of names — every page a reader opens now actually runs.
 */

/**
 * Indoor Fish — stolen from an unnamed user
 *
 * The mirror image of Luini: where Luini needs a sealed room to open portals,
 * these fish need one to exist at all. Opening the room ends the effect, and the
 * wounds they inflict are painless until it does.
 */
export const indoorFish = defineAbility({
  id: 'indoor-fish',
  name: 'Indoor Fish',
  owner: 'chrollo-lucilfer',
  category: 'conjurer',

  conditions: [canUseNen(), isConscious()],

  targets: [zone()],

  cost: { label: 'Une pièce close, la page ouverte et maintenue', amount: 1, unit: 'pièce close' },

  actions: {
    release: {
      label: 'Lâcher les poissons',
      conditions: [
        requiresParameter('locationId', 'Une pièce est choisie'),
        locationIsSealed('La pièce est complètement close'),
      ],
      effects: [
        spawnNenEntity({
          id: (ctx) => `indoor-fish-${param(ctx, 'locationId') ?? 'room'}`,
          kind: 'CONSTRUCT',
          label: 'Poissons squelettiques',
          metadata: { survivesOnlyInSealedRoom: true },
        }),
        constraint({
          rules: [
            'Les poissons ne survivent que dans une pièce entièrement close.',
            'Les morsures sont indolores tant que l’effet dure.',
            'L’ouverture de la pièce met fin à la capacité.',
          ],
          attributes: (ctx) => ({ locationId: param(ctx, 'locationId'), painless: true }),
        }),
      ],
    },

    'room-opened': {
      label: 'La pièce s’ouvre',
      conditions: [effectIsLive('effectId', 'Les poissons sont lâchés')],
      effects: [
        setEffectState({ state: 'ENDED', attributes: { reason: 'room-opened' } }),
        // The damage lands all at once when the effect ends.
        bodyState({ state: 'INJURED' }),
      ],
      hint: 'Les blessures différées deviennent effectives',
    },
  },

  ui: { componentKey: 'RuleZonePanel' },

  interactionManifest: buildManifest('indoor-fish', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['LOCATION', 'CHARACTER'],
    overlays: ['RANGE'],
    entryActions: ['release'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'RuleZonePanel',
  }),
})

/**
 * Fun Fun Cloth — stolen from Owl
 *
 * Transport of an entity by another entity: whatever is wrapped leaves the
 * board — `containedIn` rather than a position — and comes back intact
 * elsewhere. Canonically used to carry corpses off the sumo arena.
 */
export const funFunCloth = defineAbility({
  id: 'fun-fun-cloth',
  name: 'Fun Fun Cloth',
  owner: 'chrollo-lucilfer',
  category: 'conjurer',

  conditions: [canUseNen(), isConscious()],

  targets: [person(), object()],

  cost: { label: 'Les cibles rangées restent prisonnières du tissu', unit: 'aura' },

  actions: {
    wrap: {
      label: 'Envelopper',
      conditions: [requiresTarget('Une cible est enveloppée')],
      effects: [
        effect({
          kind: 'CONSTRAINT',
          discriminator: 'wrapped',
          attributes: (ctx) => ({
            containedIn: `fun-fun-cloth:${ctx.actorId}`,
            miniaturised: true,
            rules: ['La cible est miniaturisée et restituée intacte.'],
          }),
        }),
      ],
    },

    unwrap: {
      label: 'Déballer',
      conditions: [effectIsLive('effectId', 'Une cible est enveloppée')],
      effects: [
        setEffectState({ state: 'ENDED' }),
        moveEntity({ certainty: 'CONFIRMED', precision: 'EXACT_ROOM' }),
      ],
    },
  },

  ui: { componentKey: 'ContainerView' },

  interactionManifest: buildManifest('fun-fun-cloth', {
    inputMode: 'DRAG',
    allowedTargets: ['CHARACTER', 'BODY', 'OBJECT'],
    overlays: ['RANGE'],
    entryActions: ['wrap'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'ContainerView',
  }),
})

/**
 * Teleportation — an unnamed stolen ability
 *
 * Moving somebody who did not agree to move, without line of sight (Nobunaga,
 * pushed aside). Unnamed in canon, so the module names nothing.
 */
export const chrolloTeleportation = defineAbility({
  id: 'chrollo-teleportation',
  name: 'Téléportation (capacité volée sans nom)',
  owner: 'chrollo-lucilfer',
  category: 'specialist',

  conditions: [canUseNen(), isConscious()],

  notes: [
    unrevealed('chrollo-teleport-name', 'Le nom et les conditions de la capacité sont inconnus'),
  ],

  targets: [person()],

  cost: {
    label: 'Deux destinations valides et la page volée en main',
    amount: 2,
    unit: 'destinations',
  },

  actions: {
    displace: {
      label: 'Déplacer une personne',
      conditions: [
        requiresTarget('Une personne est déplacée'),
        requiresParameter('locationId', 'Une destination est choisie'),
      ],
      effects: [
        // No line of sight required, and no consent either.
        moveEntity({ certainty: 'CONFIRMED', precision: 'EXACT_ROOM' }),
      ],
    },
  },

  ui: { componentKey: 'PortalNetworkView' },

  interactionManifest: buildManifest('chrollo-teleportation', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'LOCATION'],
    overlays: ['TRAJECTORY'],
    entryActions: ['displace'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'PortalNetworkView',
  }),
})

/**
 * Order Stamp — stolen from an unnamed user
 *
 * Animates objects with a head, not corpses, and takes a single spoken order.
 * Combined with Gallery Fake (ch. 357) it is the engine's load test: two hundred
 * constructs standing on one arena map.
 */
export const orderStamp = defineAbility({
  id: 'order-stamp',
  name: 'Order Stamp',
  owner: 'chrollo-lucilfer',
  category: 'conjurer',

  conditions: [canUseNen(), isConscious()],

  targets: [object()],

  cost: { label: 'Uniquement des corps que son porteur tient pour inanimés', unit: 'pantin' },

  actions: {
    animate: {
      label: 'Animer un objet',
      conditions: [requiresTarget('Un objet à tête est visé')],
      effects: [
        controlLink({
          vector: 'stamp',
          mode: 'control',
          attributes: (ctx) => ({
            order: param(ctx, 'order'),
            rules: [
              'N’anime que des objets pourvus d’une tête, jamais de vrais cadavres.',
              'Un seul ordre vocal simple par pantin.',
              'La décapitation annule l’animation.',
            ],
          }),
        }),
      ],
    },

    'animate-crowd': {
      label: 'Animer une foule',
      conditions: [requiresParameter('cohortId', 'Une cohorte de copies est visée')],
      effects: [
        spawnNenEntity({
          id: (ctx) => param(ctx, 'cohortId') ?? 'order-stamp-puppets',
          kind: 'COHORT',
          label: 'Pantins d’Order Stamp',
        }),
        effect({
          kind: 'CONTROL_LINK',
          discriminator: 'crowd',
          targets: (ctx) => [
            { id: param(ctx, 'cohortId') ?? 'order-stamp-puppets', kind: 'COHORT' as const },
          ],
          attributes: (ctx) => ({
            memberIds: listParam(ctx, 'memberIds'),
            order: param(ctx, 'order'),
            mode: 'control',
          }),
        }),
      ],
      hint: 'Plus de 200 pantins en canon (combo Gallery Fake, ch. 357)',
    },

    behead: {
      label: 'Décapiter un pantin',
      conditions: [effectIsLive('effectId', 'Un pantin est animé')],
      effects: [setEffectState({ state: 'ENDED', attributes: { reason: 'beheaded' } })],
    },
  },

  ui: { componentKey: 'PuppetCrowd' },

  interactionManifest: buildManifest('order-stamp', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['OBJECT', 'CHARACTER'],
    overlays: ['CONTROL_LINK'],
    entryActions: ['animate'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'PuppetCrowd',
  }),
})

/**
 * Gallery Fake — inherited from Kortopi
 *
 * Copies that last a day. Its creator is dead, so on the timeline this page is
 * revoked at Kortopi's death: the world engine does that on its own, and the
 * book's contents change as the reader scrolls.
 */
export const galleryFake = defineAbility({
  id: 'gallery-fake',
  name: 'Gallery Fake',
  owner: 'chrollo-lucilfer',
  category: 'conjurer',

  conditions: [canUseNen(), isConscious()],

  targets: [object()],

  actions: {
    copy: {
      label: 'Copier un objet',
      conditions: [requiresTarget('Un objet est touché')],
      effects: [
        spawnNenEntity({
          id: (ctx) => `gallery-fake-${ctx.targets[0] ?? 'object'}`,
          kind: 'CONSTRUCT',
          label: 'Copie',
          metadata: (ctx) => ({
            originalId: ctx.targets[0],
            // Twenty-four hours, and gone with its creator.
            lifespanHours: 24,
            diesWithCreator: 'kortopi',
          }),
        }),
        effect({
          kind: 'CUSTOM',
          discriminator: 'copy',
          attributes: { lifespanHours: 24, indistinguishable: true },
        }),
      ],
      cost: { label: 'La copie disparaît', amount: 24, unit: 'heures' },
    },
  },

  ui: { componentKey: 'CopyLedger' },

  interactionManifest: buildManifest('gallery-fake', {
    inputMode: 'CLICK',
    allowedTargets: ['OBJECT'],
    overlays: ['AURA'],
    entryActions: ['copy'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'CopyLedger',
  }),
})

/**
 * Black Voice — inherited from Shalnark
 *
 * Total control through a planted antenna, and a second antenna held as a
 * threat. The interesting event is not the control but the revocation: Shalnark
 * dies, the page dies, and the timeline shows it.
 */
export const blackVoice = defineAbility({
  id: 'black-voice',
  name: 'Black Voice',
  owner: 'chrollo-lucilfer',
  category: 'manipulator',

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Une antenne implantée par cible contrôlée', amount: 1, unit: 'antenne' },

  actions: {
    'plant-antenna': {
      label: 'Planter une antenne',
      conditions: [requiresTarget('Une cible est piquée')],
      effects: [
        controlLink({
          vector: 'antenna',
          mode: 'control',
          attributes: {
            rules: [
              'Le contrôle est total et se commande par téléphone.',
              'Une seconde antenne sert de menace.',
            ],
          },
        }),
      ],
    },

    command: {
      label: 'Donner un ordre',
      conditions: [effectIsLive('effectId', 'Une antenne est plantée')],
      // The controller acts with the target's body: actorId stays Chrollo.
      effects: [
        setEffectState({
          state: 'ACTIVE',
          attributes: (ctx) => ({ lastOrder: param(ctx, 'order'), actingBodyId: ctx.targets[0] }),
        }),
      ],
    },
  },

  ui: { componentKey: 'AntennaControl' },

  interactionManifest: buildManifest('black-voice', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'BODY'],
    overlays: ['CONTROL_LINK'],
    entryActions: ['plant-antenna'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'AntennaControl',
  }),
})

/**
 * Lovely Ghostwriter — stolen from Neon Nostrade
 *
 * Predictions in verse, for a page that no longer works: Neon lost her ability,
 * so the sheet is historical. Modelling the loss is the point — the catalogue
 * should show what a hatsu *was*, dated.
 */
export const lovelyGhostwriter = defineAbility({
  id: 'lovely-ghostwriter',
  name: 'Lovely Ghostwriter',
  owner: 'chrollo-lucilfer',
  category: 'specialist',

  conditions: [canUseNen()],

  notes: [
    unrevealed(
      'ghostwriter-loss',
      'Capacité perdue par Neon ; la page ne fonctionne plus (date exacte non révélée)',
    ),
  ],

  targets: [person()],

  cost: { label: 'Des informations sur la cible et un support écrit', unit: 'page' },

  actions: {
    predict: {
      label: 'Écrire la prédiction',
      conditions: [requiresTarget('Un sujet est visé')],
      effects: [
        knowledgeGrant({
          factId: (ctx) => `prophecy:${ctx.targets[0] ?? 'subject'}`,
          state: 'BELIEVED',
          confidence: 0.8,
        }),
        effect({
          kind: 'CUSTOM',
          discriminator: 'prophecy',
          attributes: (ctx) => ({
            form: 'poem',
            coversMonths: numberParam(ctx, 'coversMonths') ?? 1,
            subjectId: ctx.targets[0],
          }),
        }),
      ],
    },
  },

  ui: { componentKey: 'ProphecyPoem' },

  interactionManifest: buildManifest('lovely-ghostwriter', {
    inputMode: 'CUSTOM',
    allowedTargets: ['CHARACTER', 'EVENT'],
    overlays: ['FUTURE'],
    entryActions: ['predict'],
    requiredState: ['canUseNen'],
    customComponent: 'ProphecyPoem',
  }),
})
