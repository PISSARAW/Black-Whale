import {
  asserted,
  attributeCounter,
  auraModifier,
  buildManifest,
  canUseNen,
  constraint,
  defineAbility,
  effect,
  effectIsLive,
  hypothesis,
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
  shown,
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
  name: 'Transformation into a boat or vehicle',
  owner: 'kurton',
  category: 'conjurer',

  site: {
    kind: 'vehicle',
    instruction:
      'Board up to five page passengers, then click one passenger again to launch the whole convoy on their shared aura.',
    rule: 'Kurton becomes a vehicle whose capacity is five and whose fuel is supplied symbiotically by its passengers.',
    cost: 'Shared passenger aura · five-seat limit',
    color: '#f2a65a',
    action: 'Board a passenger',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [self()],

  cost: { label: 'Aura des passagers consommée comme carburant', unit: 'aura' },

  actions: {
    transform: {
      label: 'Se transformer',
      evidence: asserted('la capacité change son corps en véhicule'),
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

    'board-a-sixth-passenger': {
      label: 'Embarquer un sixième passager',
      refusal: 'Cinq places : au-delà, le véhicule ne prend personne',
      evidence: asserted('la capacité de cinq est donnée avec la capacité'),
    },

    travel: {
      label: 'Se déplacer',
      evidence: asserted('les passagers fournissent le carburant du trajet'),
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
      evidence: asserted('la forme humaine revient quand la course est finie'),
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
  name: 'Transport Portals',
  owner: 'tokarine',
  category: 'emitter',

  site: {
    kind: 'relay',
    instruction:
      'Load sections and advance each through three visible relay stages into recoverable transport storage without teleporting.',
    rule: 'The ability transports limited cargo between expedition relays but explicitly cannot teleport it.',
    cost: 'Low capacity · staged transport',
    color: '#e2b86e',
    action: 'Load cargo at relay one',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [zone()],

  cost: { label: 'Cargaison limitée, transportée par étapes entre relais', unit: 'trajets' },

  actions: {
    'open-relay': {
      label: 'Ouvrir un relais',
      evidence: asserted('les relais logistiques de l’expédition'),
      conditions: [
        requiresParameter('fromLocationId', 'Un point de départ est choisi'),
        requiresParameter('locationId', 'Un point d’arrivée est choisi'),
      ],
      effects: [portal({ attributes: { purpose: 'logistics', network: 'expedition-relays' } })],
    },

    'ship-in-one-hop': {
      label: 'Expédier d’un seul trajet',
      refusal: 'Le transport se fait par étapes, de relais en relais',
      evidence: asserted('la logistique décrite avec la capacité'),
    },

    'ship-a-person': {
      label: 'Expédier une personne',
      evidence: hypothesis('un relais employé pour autre chose que du fret'),
      effects: [
        moveEntity({ entity: (ctx) => ({ id: param(ctx, 'cargoId') ?? 'cargo', kind: 'OBJECT' }) }),
      ],
    },

    ship: {
      label: 'Expédier des marchandises',
      evidence: asserted('la cargaison passe de relais en relais'),
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
  name: 'Aura Projectile',
  owner: 'theta',
  category: 'emitter',

  site: {
    kind: 'training-shot',
    instruction:
      'Select a target to seal its action in Zetsu; holding perfectly still for three seconds restores it after the controlled shot.',
    rule: 'Theta fires a controlled aura projectile to test whether a student can maintain complete Zetsu under pressure.',
    cost: 'Three seconds of flawless concentration',
    color: '#8fe3f0',
    action: 'Choose a Zetsu trainee',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Trois secondes de concentration sans faille', amount: 3, unit: 'secondes' },

  actions: {
    'restore-after-the-shot': {
      label: 'Rendre l’action après le tir',
      evidence: shown('ch. 391 — trois secondes d’immobilité parfaite, puis on reprend'),
      effects: [setEffectState({ state: 'ENDED', attributes: { restoredAfterSeconds: 3 } })],
    },

    'keep-what-she-learned': {
      label: 'Garder l’information pour soi',
      // The shot's real output: Theta knows what the prince can do, and nobody
      // else does — the exact shape Predator's sole-observer condition wants.
      evidence: shown('ch. 391 — elle ne rapporte pas ce qu’elle a compris'),
      effects: [
        knowledgeGrant({
          factId: (ctx) => `nen-control-level:${ctx.targets[0] ?? 'student'}`,
          state: 'KNOWN',
          confidence: 0.9,
        }),
      ],
    },

    'test-a-hostile-target': {
      label: 'Employer le tir comme attaque',
      refusal: 'Le projectile est faible : c’est un exercice, pas une arme',
    },

    test: {
      label: 'Tester l’élève',
      evidence: shown('ch. 391 — le tir d’exercice sur le prince en Zetsu'),
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
