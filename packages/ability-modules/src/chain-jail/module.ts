import {
  asserted,
  buildManifest,
  canUseNen,
  constraint,
  defineAbility,
  effectIsLive,
  isConscious,
  person,
  requiresTarget,
  setEffectState,
  shown,
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

  /**
   * The grid of uses (§8): what the jail does, and — just as canonical — what it
   * refuses. A vow-bound ability is the clearest case where a greyed entry
   * teaches more than a missing one.
   */
  actions: {
    bind: {
      label: 'Emprisonner une Araignée',
      evidence: shown('ch. 84 — capture d’Uvogin'),
      conditions: [requiresTarget('Une cible est enchaînée')],
      effects: [
        constraint({
          rules: VOW_RULES,
          attributes: { escapable: false, suppressesNen: true, vowId: 'chain-jail' },
        }),
      ],
    },

    'hold-for-interrogation': {
      label: 'Maintenir pendant l’interrogatoire',
      evidence: shown('ch. 85-86 — Uvogin interrogé, puis ch. 122 — Chrollo'),
      conditions: [effectIsLive('effectId', 'La chaîne tient encore')],
      // The coupling the manga always shows: the jail holds while the Dowsing
      // Chain asks the questions.
      effects: [setEffectState({ state: 'ACTIVE', attributes: { interrogation: true } })],
      hint: 'Se couple à la Chaîne de Divination pour l’interrogatoire',
    },

    release: {
      label: 'Relâcher la chaîne',
      evidence: asserted('la chaîne se retire à volonté ; elle ne cède à aucune autre main'),
      conditions: [effectIsLive('effectId', 'La chaîne tient encore')],
      effects: [setEffectState({ state: 'ENDED' })],
    },

    'bind-outsider': {
      label: 'Emprisonner hors Brigade',
      refusal: 'Serment : hors Brigade Fantôme, la Chaîne du Jugement tue Kurapika',
      evidence: shown('ch. 84 — le serment énoncé'),
    },

    'bind-self': {
      label: 'S’enchaîner soi-même',
      refusal: 'L’index emprisonne autrui ; c’est le majeur que Kurapika retourne contre lui',
    },
  },

  cost: {
    label: 'Serment : mort en cas d’usage hors Brigade Fantôme',
    unit: 'vie',
  },

  ui: { componentKey: 'ChainInteraction' },

  interactionManifest: buildManifest('chain-jail', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'BODY', 'LOCATION'],
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
