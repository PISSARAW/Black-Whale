import {
  defineAbility,
  canUseNen,
  isConscious,
  person,
  object,
  surface,
  self,
  attach,
  stretch,
  retract,
  detach,
  release,
  elasticConnection,
  adhesiveConnection,
  buildManifest,
  wheelEntry,
} from '@black-whale/ability-sdk'

/**
 * Bungee Gum — Hisoka Morrow
 *
 * His Nen has properties of both rubber and gum.
 * Can be attached to any target and used to stretch, retract, and rebound.
 *
 * Interaction grammar (section 17):
 *   1. Select an anchor point (DRAG origin)
 *   2. Pull the filament toward a target
 *   3. Attach to a second point
 *   4. Adjust tension
 *   5. Release or retract
 */
export const bungeeGum = defineAbility({
  id: 'bungee-gum',
  owner: 'hisoka',

  conditions: [
    canUseNen(),
    isConscious(),
  ],

  targets: [
    person(),
    object(),
    surface(),
    self(),
  ],

  interactions: [
    attach(),
    stretch(),
    retract(),
    detach(),
    release(),
  ],

  effects: [
    elasticConnection(),
    adhesiveConnection(),
  ],

  ui: { componentKey: 'BungeeGumInteraction' },

  interactionManifest: buildManifest('bungee-gum', {
    inputMode: 'DRAG',
    allowedTargets: ['CHARACTER', 'OBJECT', 'LOCATION'],
    overlays: ['AURA', 'TENSION'],
    entryActions: ['select-anchor'],
    requiredState: ['isConscious', 'canUseNen'],
    perspectiveTransition: {
      canChangeBody: false,
      canChangeConsciousness: false,
      canFollowAura: false,
    },
    customComponent: 'BungeeGumInteraction',
  }),

  actionWheel: [
    wheelEntry({ id: 'attach', label: 'Attacher', abilityId: 'bungee-gum', visibility: 'available' }),
    wheelEntry({ id: 'stretch', label: 'Étirer', abilityId: 'bungee-gum', visibility: 'locked', hint: 'Requiert un point d\'ancrage actif' }),
    wheelEntry({ id: 'retract', label: 'Rétracter', abilityId: 'bungee-gum', visibility: 'locked', hint: 'Requiert un filament tendu' }),
    wheelEntry({ id: 'detach', label: 'Détacher', abilityId: 'bungee-gum', visibility: 'locked', hint: 'Requiert une connexion active' }),
    wheelEntry({ id: 'release', label: 'Relâcher', abilityId: 'bungee-gum', visibility: 'available' }),
  ],
})
