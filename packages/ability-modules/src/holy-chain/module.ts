import {
  bodyState,
  buildManifest,
  canUseNen,
  defineAbility,
  isConscious,
  person,
  requiresTarget,
  self,
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

  conditions: [canUseNen(), isConscious(), requiresTarget('Un blessé est soigné')],

  targets: [person(), self()],

  cost: { label: 'Aura de soin — pleine efficacité seulement sous Emperor Time', unit: 'aura' },

  effects: [bodyState({ state: 'ALIVE' })],

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
