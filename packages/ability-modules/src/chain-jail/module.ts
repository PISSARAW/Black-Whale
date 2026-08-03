import {
  buildManifest,
  canUseNen,
  constraint,
  defineAbility,
  isConscious,
  person,
  requiresTarget,
  targetHasAffiliation,
  vow,
} from '@black-whale/ability-sdk'

/** The vow, verbatim. The "Why?" panel shows these lines and nothing else. */
const VOW_RULES = [
  'La chaîne ne peut être utilisée que contre un membre de la Brigade Fantôme.',
  'L’enfreindre déclenche la Chaîne du Jugement sur Kurapika lui-même.',
  'La cible ne peut ni se libérer ni utiliser son Nen tant que la chaîne tient.',
]

/**
 * Chain Jail — Kurapika, index finger
 *
 * The restriction is the ability: an unbreakable jail bought with a vow whose
 * violation is lethal. Modelling the vow as a condition rather than as prose is
 * what makes the panel pedagogical — the reader sees the price before the effect.
 */
export const chainJail = defineAbility({
  id: 'chain-jail',
  name: 'Chain Jail',
  owner: 'kurapika',
  category: 'conjurer',

  site: {
    kind: 'chain-bind',
    instruction:
      'Bind a Phantom Troupe member into forced Zetsu; selecting anyone else violates the fatal vow and immediately ends the Hatsu.',
    rule: 'The absolute restraint is usable only against Spiders and suppresses their aura and movement completely.',
    cost: 'Kurapika’s life if used on a non-Spider',
    color: '#c9ced6',
    action: 'Choose a Spider',
  },

  conditions: [
    canUseNen(),
    isConscious(),
    requiresTarget('Une cible est enchaînée'),
    targetHasAffiliation('phantom-troupe', 'La cible est membre de la Brigade Fantôme'),
    vow('chain-jail', 'Serment : usage réservé à la Brigade Fantôme, sous peine de mort'),
  ],

  targets: [person()],

  effects: [
    constraint({
      rules: VOW_RULES,
      attributes: { escapable: false, suppressesNen: true, vowId: 'chain-jail' },
    }),
  ],

  cost: {
    label: 'Serment : mort en cas d’usage hors Brigade Fantôme',
    unit: 'vie',
  },

  ui: { componentKey: 'ChainInteraction' },

  interactionManifest: buildManifest('chain-jail', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'BODY'],
    overlays: ['CONTROL_LINK', 'RANGE'],
    entryActions: ['select-finger'],
    requiredState: ['isConscious', 'canUseNen'],
    perspectiveTransition: {
      canChangeBody: false,
      canChangeConsciousness: false,
      canFollowAura: false,
    },
    customComponent: 'ChainInteraction',
  }),
})
