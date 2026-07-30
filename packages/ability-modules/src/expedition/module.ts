import {
  attributeCounter,
  auraModifier,
  buildManifest,
  canUseNen,
  constraint,
  defineAbility,
  effect,
  effectIsLive,
  inZetsu,
  isConscious,
  knowledgeGrant,
  listParam,
  moveEntity,
  numberParam,
  param,
  person,
  portal,
  requiresParameter,
  requiresTarget,
  self,
  setEffectState,
  zone,
} from '@black-whale/ability-sdk'

/** Canon: the vehicle carries up to five passengers, whose aura is the fuel. */
const PASSENGER_CAPACITY = 5

/**
 * Vehicle transformation — Kurton
 *
 * A body that becomes a boat or a car, burning its passengers' aura to move.
 * A potential escape route by sea if canon ever goes there; for now the module
 * records the capacity and the fuel, which is what a plan needs to be honest.
 */
export const kurtonVehicleTransformation = defineAbility({
  id: 'kurton-vehicle-transformation',
  name: 'Kurton — transformation en véhicule',
  owner: 'kurton',
  category: 'conjurer',

  conditions: [canUseNen(), isConscious()],

  targets: [self()],

  cost: { label: 'Aura des passagers consommée comme carburant', unit: 'aura' },

  actions: {
    transform: {
      label: 'Se transformer',
      conditions: [requiresParameter('vehicle', 'La forme du véhicule est choisie')],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'vehicle',
          attributes: (ctx) => ({
            vehicle: param(ctx, 'vehicle'),
            capacity: PASSENGER_CAPACITY,
            passengerIds: listParam(ctx, 'passengerIds'),
            fuel: 'passenger-aura',
          }),
        }),
      ],
    },

    travel: {
      label: 'Se déplacer',
      conditions: [
        effectIsLive('effectId', 'Kurton est transformé'),
        requiresParameter('locationId', 'Une destination est choisie'),
      ],
      effects: [
        moveEntity({ entity: (ctx) => ctx.actor ?? { id: ctx.actorId, kind: 'CHARACTER' } }),
        attributeCounter({
          increments: (ctx) => ({ fuelSpent: numberParam(ctx, 'distance') ?? 1 }),
        }),
      ],
    },

    revert: {
      label: 'Reprendre forme humaine',
      conditions: [effectIsLive('effectId', 'Kurton est transformé')],
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  ui: { componentKey: 'VehicleView' },

  interactionManifest: buildManifest('kurton-vehicle-transformation', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'LOCATION'],
    overlays: ['TRAJECTORY', 'RANGE'],
    entryActions: ['transform'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'VehicleView',
  }),
})

/**
 * Transport portals — Tokarine
 *
 * Logistics rather than combat: relay points for the expedition's goods. Off the
 * ship, so it shares the portal component and adds nothing to it beyond a
 * manifest of what is being moved.
 */
export const transportPortals = defineAbility({
  id: 'transport-portals',
  name: 'Portails de transport',
  owner: 'tokarine',
  category: 'emitter',

  conditions: [canUseNen(), isConscious()],

  targets: [zone()],

  cost: { label: 'Cargaison limitée, transportée par étapes entre relais', unit: 'trajets' },

  actions: {
    'open-relay': {
      label: 'Ouvrir un relais',
      conditions: [
        requiresParameter('fromLocationId', 'Un point de départ est choisi'),
        requiresParameter('locationId', 'Un point d’arrivée est choisi'),
      ],
      effects: [portal({ attributes: { purpose: 'logistics', network: 'expedition-relays' } })],
    },

    ship: {
      label: 'Expédier des marchandises',
      conditions: [effectIsLive('effectId', 'Un relais est ouvert')],
      effects: [
        moveEntity({
          entity: (ctx) => ({ id: param(ctx, 'cargoId') ?? 'cargo', kind: 'OBJECT' }),
        }),
      ],
    },
  },

  ui: { componentKey: 'PortalNetworkView' },

  interactionManifest: buildManifest('transport-portals', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['LOCATION', 'OBJECT'],
    overlays: ['TRAJECTORY', 'RANGE'],
    entryActions: ['open-relay'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'PortalNetworkView',
  }),
})

/**
 * Aura projectile — Theta
 *
 * A single weak shot whose point is not the damage: it is a Zetsu test on
 * Tserriednich, and what it produces is knowledge — she learns how much control
 * the prince already has, and keeps it to herself.
 */
export const thetaAuraProjectile = defineAbility({
  id: 'theta-aura-projectile',
  name: 'Projectile d’aura',
  owner: 'theta',
  category: 'emitter',

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Trois secondes de concentration sans faille', amount: 3, unit: 'secondes' },

  actions: {
    test: {
      label: 'Tester l’élève',
      conditions: [requiresTarget('Un élève est testé'), inZetsu()],
      effects: [
        auraModifier({ mode: 'PROJECTILE', strength: 'weak', purpose: 'zetsu-exercise' }),
        constraint({ rules: ['L’exercice se déroule en Zetsu.'] }),
        // The real output: Theta now knows what the prince can do, and nobody
        // else does — which is exactly the shape Predator's condition looks for.
        knowledgeGrant({
          factId: (ctx) => `nen-control-level:${ctx.targets[0] ?? 'student'}`,
          state: 'KNOWN',
          confidence: 0.9,
        }),
      ],
    },
  },

  ui: { componentKey: 'ZetsuTestView' },

  interactionManifest: buildManifest('theta-aura-projectile', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER'],
    overlays: ['TRAJECTORY', 'AURA'],
    entryActions: ['test'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'ZetsuTestView',
  }),
})
