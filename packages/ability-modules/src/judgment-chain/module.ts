import {
  asserted,
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
  shown,
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
      evidence: shown('ch. 122 — la chaîne dans le cœur de Chrollo, deux règles dictées'),
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

    'plant-on-self': {
      label: 'Se planter la chaîne',
      // The vow's other half: the same finger enforces the restriction its
      // owner accepted, which is why the panel shows the rule on Kurapika too.
      evidence: shown('ch. 84 — le majeur retourné contre lui-même'),
      effects: [
        effect({
          kind: 'CURSE',
          state: 'DORMANT',
          attributes: (ctx) => ({
            rules: listParam(ctx, 'rules'),
            trigger: 'vow-violation',
            onSelf: true,
          }),
        }),
      ],
      cost: { label: 'La vie de Kurapika en cas de manquement', unit: 'vie' },
    },

    trigger: {
      label: 'Déclencher la sentence',
      evidence: shown('ch. 84 — la sentence énoncée : le cœur est percé'),
      conditions: [effectIsLive('effectId', 'La chaîne visée est toujours en place')],
      effects: [
        setEffectState({ state: 'TRIGGERED', attributes: { violated: true } }),
        // The canonical sentence: the chain pierces the heart it was planted in.
        bodyState({ state: 'DEAD' }),
      ],
      cost: { label: 'Mort de la cible', unit: 'vie' },
      hint: 'Requiert une règle enfreinte',
    },

    'declare-additional-rule': {
      label: 'Ajouter une règle',
      refusal: 'Les règles se dictent à la pose : la chaîne plantée ne se renégocie pas',
      evidence: asserted('le contrat est énoncé une fois, à l’activation'),
    },

    release: {
      label: 'Retirer la chaîne',
      evidence: asserted('seul Kurapika peut retirer ce qu’il a planté'),
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
