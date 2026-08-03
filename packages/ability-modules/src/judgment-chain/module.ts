import {
  bodyState,
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  effectIsLive,
  isConscious,
  listParam,
  person,
  requiresTarget,
  self,
  setEffectState,
} from '@black-whale/ability-sdk'

/**
 * Judgment Chain — Kurapika, middle finger
 *
 * A curse planted in a heart, dormant, carrying the rules declared out loud at
 * activation. It only becomes an event when a rule is broken — which is why it
 * needs `EFFECT_STATE_CHANGED` rather than a permanent active effect.
 */
export const judgmentChain = defineAbility({
  id: 'judgment-chain',
  name: 'Judgment Chain',
  owner: 'kurapika',
  category: 'conjurer',

  site: {
    kind: 'heart-vow',
    instruction:
      'Put the stake in one subject and declare up to two rules onto that same subject; touching anything else is the violation.',
    rule: 'The implanted chain pierces the heart only when the declared rule is knowingly violated.',
    cost: 'Emperor Time · explicit rule · lethal enforcement',
    color: '#d7dce2',
    action: 'Choose the contract subject',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person(), self()],

  actions: {
    plant: {
      label: 'Planter la chaîne',
      conditions: [requiresTarget('Un cœur est visé')],
      effects: [
        // The rules are dictated out loud at activation and are the whole
        // contract, so they travel on the effect and the UI lists them per heart.
        effect({
          kind: 'CURSE',
          state: 'DORMANT',
          attributes: (ctx) => ({
            rules: listParam(ctx, 'rules'),
            trigger: 'rule-violation',
          }),
        }),
      ],
      cost: { label: 'Une chaîne par cœur enchaîné', amount: 1, unit: 'chaîne' },
    },

    trigger: {
      label: 'Déclencher la sentence',
      conditions: [effectIsLive('effectId', 'La chaîne visée est toujours en place')],
      effects: [
        setEffectState({ state: 'TRIGGERED', attributes: { violated: true } }),
        // The canonical sentence: the chain pierces the heart it was planted in.
        bodyState({ state: 'DEAD' }),
      ],
      cost: { label: 'Mort de la cible', unit: 'vie' },
      hint: 'Requiert une règle enfreinte',
    },

    release: {
      label: 'Retirer la chaîne',
      conditions: [effectIsLive('effectId', 'La chaîne visée est toujours en place')],
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  ui: { componentKey: 'ChainInteraction' },

  interactionManifest: buildManifest('judgment-chain', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'BODY', 'LOCATION'],
    overlays: ['CONTROL_LINK'],
    entryActions: ['select-finger'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'ChainInteraction',
  }),
})
