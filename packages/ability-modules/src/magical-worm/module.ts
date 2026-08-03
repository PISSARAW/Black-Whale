import {
  attributeCounter,
  buildManifest,
  canUseNen,
  defineAbility,
  effectIsLive,
  isConscious,
  locationAlreadyVisited,
  moveEntity,
  param,
  portal,
  requiresParameter,
  requiresTarget,
  setEffectState,
  shown,
  zone,
} from '@black-whale/ability-sdk'

/**
 * Magical Worm — Fugetsu
 *
 * Two portals and a move between locations that are not adjacent: the trips that
 * make no sense on the location graph become readable as a dotted tunnel. The
 * asymmetry is the point — Benjamin can see she leaves without knowing how.
 *
 * Canon: originally once a night and exhausting, the return door opened by Kacho.
 * After Kacho's death Fugetsu repeats the trips, which the module flags as
 * suspicious rather than silently normalising.
 */
export const magicalWorm = defineAbility({
  id: 'magical-worm',
  name: 'Magical Worm',
  owner: 'prince-fugetsu',
  category: 'conjurer',

  site: {
    kind: 'portal',
    instruction:
      'Right-click two map states to place Start and Return Doors; each crossing restores URL, tier and zoom but repeated use exhausts the site.',
    rule: 'The paired dimensional tunnel normally works once per night; abnormal repeated travel dangerously drains Fugetsu.',
    cost: 'One safe nightly route · escalating exhaustion',
    color: '#80edc7',
    action: 'Place the Start Door',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [zone()],

  cost: { label: 'Épuisement — un trajet par nuit à l’origine', amount: 1, unit: 'trajet/nuit' },

  actions: {
    dig: {
      label: 'Creuser le tunnel',
      evidence: shown('ch. 379 — la porte, le tunnel, la trappe de sortie'),
      conditions: [
        requiresParameter('locationId', 'Une destination est choisie'),
        locationAlreadyVisited('La destination fait partie des lieux connus de Fugetsu'),
      ],
      effects: [
        portal({ discriminator: 'entrance' }),
        portal({
          discriminator: 'exit',
          fromLocationId: (ctx) => param(ctx, 'locationId'),
          toLocationId: (ctx) => param(ctx, 'fromLocationId'),
          attributes: { role: 'return-hatch' },
        }),
        moveEntity({ entity: (ctx) => ctx.actor ?? { id: ctx.actorId, kind: 'CHARACTER' } }),
      ],
    },

    'return-through': {
      label: 'Faire demi-tour',
      evidence: shown('ch. 379 — le retour tant qu’on n’est pas complètement sorti'),
      conditions: [effectIsLive('effectId', 'Le tunnel est encore ouvert')],
      effects: [
        moveEntity({
          entity: (ctx) => ctx.actor ?? { id: ctx.actorId, kind: 'CHARACTER' },
          locationId: (ctx) => param(ctx, 'fromLocationId'),
        }),
      ],
      hint: 'Impossible une fois complètement sorti du tunnel',
    },

    'carry-a-passenger': {
      label: 'Emmener quelqu’un',
      // The escape only works because the tunnel takes two.
      evidence: shown('ch. 379 — les jumelles passent ensemble'),
      conditions: [
        effectIsLive('effectId', 'Le tunnel est encore ouvert'),
        requiresTarget('Un passager est emmené'),
      ],
      effects: [moveEntity({ locationId: (ctx) => param(ctx, 'locationId') })],
    },

    'dig-to-an-unknown-room': {
      label: 'Creuser vers un lieu inconnu',
      refusal: 'La sortie se choisit parmi les lieux que Fugetsu connaît déjà',
      evidence: shown('ch. 379 — la destination est un endroit vu'),
    },

    'return-after-fully-exiting': {
      label: 'Revenir après être sortie',
      refusal: 'Le retour n’est possible que tant qu’on n’a pas complètement quitté le tunnel',
      evidence: shown('ch. 379 — la règle énoncée par Kacho'),
    },

    close: {
      label: 'Refermer le tunnel',
      evidence: shown('ch. 379 — le passage se referme derrière elles'),
      conditions: [effectIsLive('effectId', 'Le tunnel est encore ouvert')],
      effects: [setEffectState({ state: 'ENDED' })],
    },

    'flag-repetition': {
      label: 'Marquer un trajet suspect',
      evidence: shown('ch. 398+ — les trajets se répètent, l’épuisement n’arrive plus'),
      conditions: [effectIsLive('effectId', 'Le tunnel est encore ouvert')],
      effects: [
        // Post-Kacho, the trips repeat without the expected exhaustion. The manga
        // treats this as a red flag; so does the module.
        attributeCounter({
          increments: { nightlyTrips: 1 },
          attributes: { suspicious: true },
        }),
      ],
    },
  },

  ui: { componentKey: 'MagicalWormTunnel' },

  interactionManifest: buildManifest('magical-worm', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['LOCATION'],
    overlays: ['TRAJECTORY', 'RANGE'],
    entryActions: ['dig'],
    requiredState: ['isConscious', 'canUseNen'],
    perspectiveTransition: {
      canChangeBody: false,
      canChangeConsciousness: false,
      canFollowAura: true,
    },
    customComponent: 'MagicalWormTunnel',
  }),
})
