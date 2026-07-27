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
  setEffectState,
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

  conditions: [canUseNen(), isConscious()],

  targets: [zone()],

  cost: { label: 'Épuisement — un trajet par nuit à l’origine', amount: 1, unit: 'trajet/nuit' },

  actions: {
    dig: {
      label: 'Creuser le tunnel',
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
      conditions: [effectIsLive('effectId', 'Le tunnel est encore ouvert')],
      effects: [
        moveEntity({
          entity: (ctx) => ctx.actor ?? { id: ctx.actorId, kind: 'CHARACTER' },
          locationId: (ctx) => param(ctx, 'fromLocationId'),
        }),
      ],
      hint: 'Impossible une fois complètement sorti du tunnel',
    },

    close: {
      label: 'Refermer le tunnel',
      conditions: [effectIsLive('effectId', 'Le tunnel est encore ouvert')],
      effects: [setEffectState({ state: 'ENDED' })],
    },

    'flag-repetition': {
      label: 'Marquer un trajet suspect',
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
