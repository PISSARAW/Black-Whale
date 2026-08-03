import {
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  effectIsLive,
  isConscious,
  locationAlreadyVisited,
  locationIsSealed,
  moveEntity,
  param,
  portal,
  requiresParameter,
  setEffectState,
  zone,
} from '@black-whale/ability-sdk'

/**
 * Luini — spatial teleportation
 *
 * Portals opened from a sealed room towards places already visited, through a
 * private transit space. Two rules make it a puzzle rather than free movement:
 * the destination must be in Luini's own history, and opening the anchor room's
 * door burns that room for good.
 */
export const luiniSpatialTeleportation = defineAbility({
  id: 'luini-spatial-teleportation',
  name: 'Spatial Teleportation',
  owner: 'luini',
  category: 'specialist',

  site: {
    kind: 'spatial',
    instruction:
      'Send sections into the hidden room, which only opens from a section with a single way out; unsealing that section burns it for good.',
    rule: 'Luini passes through walls into a private connected space but must respect his marked entry points.',
    cost: 'Prepared boundary and return route',
    color: '#8a78d6',
    action: 'Open the hidden room',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [zone()],

  cost: { label: 'Une frontière marquée à l’avance et un itinéraire de retour', unit: 'frontière' },

  actions: {
    anchor: {
      label: 'Ancrer la pièce',
      conditions: [
        requiresParameter('fromLocationId', 'Une pièce d’ancrage est choisie'),
        locationIsSealed('La porte de la pièce d’ancrage est fermée'),
      ],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'anchor',
          attributes: (ctx) => ({
            anchorLocationId: param(ctx, 'fromLocationId'),
            rules: [
              'La pièce d’ancrage doit rester close.',
              'Si la porte s’ouvre, la pièce est brûlée définitivement.',
            ],
          }),
        }),
      ],
    },

    open: {
      label: 'Ouvrir un portail',
      conditions: [
        requiresParameter('locationId', 'Une destination est choisie'),
        // The timeline is the activation condition: Luini can only reach a room
        // his own presence history already contains.
        locationAlreadyVisited('La destination a déjà été visitée par Luini'),
        locationIsSealed('La porte de la pièce d’ancrage est fermée'),
      ],
      effects: [
        portal({ attributes: { transitSpace: 'private' } }),
        moveEntity({ entity: (ctx) => ctx.actor ?? { id: ctx.actorId, kind: 'CHARACTER' } }),
      ],
    },

    'burn-anchor': {
      label: 'La porte d’ancrage s’ouvre',
      conditions: [effectIsLive('effectId', 'Le réseau de portails existe')],
      effects: [
        // Canonical invalidation: not a cooldown, a permanent loss.
        setEffectState({
          state: 'ENDED',
          attributes: { burned: true, reason: 'anchor-door-opened' },
        }),
      ],
      hint: 'La pièce est perdue définitivement',
    },
  },

  ui: { componentKey: 'PortalNetworkView' },

  interactionManifest: buildManifest('luini-spatial-teleportation', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['LOCATION'],
    overlays: ['TRAJECTORY', 'RANGE'],
    entryActions: ['anchor', 'open'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'PortalNetworkView',
  }),
})
