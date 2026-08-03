import {
  asserted,
  bodyState,
  buildManifest,
  canUseNen,
  defineAbility,
  effectIsLive,
  isConscious,
  person,
  requiresTarget,
  self,
  shown,
} from '@black-whale/ability-sdk'

/**
 * Holy Chain — Kurapika, little finger
 *
 * Healing typed as a body-state transition rather than as a number: the site
 * tracks whether a body is ALIVE, INJURED or DEAD, so a cure is INJURED → ALIVE.
 * Under Emperor Time the same action resolves instantly, which the cost field of
 * the Emperor Time plan is what actually pays for.
 */
export const holyChain = defineAbility({
  id: 'holy-chain',
  name: 'Holy Chain',
  owner: 'kurapika',
  category: 'conjurer',

  site: {
    kind: 'healing',
    instruction:
      'Close a wound in two passes; content that is not damaged gives the cross nothing to work on.',
    rule: 'The cross-tipped thumb chain accelerates natural healing and reaches full restorative efficiency during Emperor Time.',
    cost: 'Enhancement aura · strongest under Emperor Time',
    color: '#d9f1df',
    action: 'Choose something wounded',
  },

  arena: {
    effect: 'restore',
    cost: 22,
    persistent: false,
    condition: 'emperor-time',
    risk: 'lifespan-cost',
    mechanic: 'healing',
  },

  conditions: [canUseNen(), isConscious(), requiresTarget('Un blessé est soigné')],

  targets: [person(), self()],

  cost: { label: 'Aura de soin — pleine efficacité seulement sous Emperor Time', unit: 'aura' },

  effects: [bodyState({ state: 'ALIVE' })],

  /**
   * Healing is one gesture with three speeds and one hard refusal. The refusal
   * is the point: the little finger closes wounds, it does not undo a death —
   * which is exactly why the Kurta cannot be brought back.
   */
  actions: {
    heal: {
      label: 'Soigner un blessé',
      evidence: shown('ch. 380 — Kurapika referme les blessures autour de lui'),
      conditions: [requiresTarget('Un blessé est soigné')],
      effects: [bodyState({ state: 'ALIVE' })],
    },

    'heal-self': {
      label: 'Se soigner',
      evidence: asserted('l’auriculaire se retourne sur son porteur comme sur autrui'),
      effects: [bodyState({ state: 'ALIVE' })],
    },

    'heal-instantly': {
      label: 'Soigner sous Emperor Time',
      evidence: shown('ch. 373 — pleine efficacité de toutes les catégories'),
      conditions: [
        requiresTarget('Un blessé est soigné'),
        effectIsLive('emperorTimeEffectId', 'Emperor Time est actif'),
      ],
      effects: [bodyState({ state: 'ALIVE' })],
      cost: { label: 'Espérance de vie consommée pendant le soin', unit: 'heures' },
      hint: 'Requiert Emperor Time — le soin est instantané, la vie se paie',
    },

    stabilise: {
      label: 'Stabiliser sans refermer',
      evidence: asserted('le soin accélère la guérison naturelle plutôt qu’il ne la remplace'),
      conditions: [requiresTarget('Un blessé est stabilisé')],
      effects: [bodyState({ state: 'STABILIZED' })],
    },

    revive: {
      label: 'Ranimer un mort',
      refusal: 'La chaîne accélère la guérison ; elle ne ramène personne de la mort',
    },
  },

  ui: { componentKey: 'ChainInteraction' },

  interactionManifest: buildManifest('holy-chain', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'BODY'],
    overlays: ['AURA'],
    entryActions: ['select-finger'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'ChainInteraction',
  }),
})
