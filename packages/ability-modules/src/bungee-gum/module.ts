import { defineAbility, canUseNen, isConscious, person, object, surface, self, attach, stretch, retract, detach, release, elasticConnection, adhesiveConnection } from '@black-whale/ability-sdk'

/**
 * Bungee Gum — Hisoka Morrow
 *
 * His Nen has properties of both rubber and gum.
 * Can be attached to any target and used to stretch, retract, and rebound.
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
})
