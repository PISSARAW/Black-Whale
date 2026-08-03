import {
  buildManifest,
  canUseNen,
  defineAbility,
  isConscious,
  moveEntity,
  person,
  requiresParameter,
  requiresTarget,
  unrevealed,
} from '@black-whale/ability-sdk'

/**
 * Teleportation — an unnamed stolen ability
 *
 * Moving somebody who did not agree to move, without line of sight (Nobunaga,
 * pushed aside). Unnamed in canon, so the module names nothing.
 */
export const chrolloTeleportation = defineAbility({
  id: 'chrollo-teleportation',
  name: 'Teleport',
  owner: 'chrollo-lucilfer',
  category: 'specialist',

  site: {
    kind: 'teleport',
    instruction:
      'Click one element to move it somewhere else on the page; you do not choose where it lands and it is not asked.',
    rule: 'The stolen technique forcibly relocates targets without requiring visible travel.',
    cost: 'Two valid destinations',
    color: '#7dd4d0',
    action: 'Choose the first target',
  },

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
