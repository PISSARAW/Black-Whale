import {
  abilityGrant,
  abilityRevoke,
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  isConscious,
  param,
  person,
  requiresParameter,
  requiresTarget,
  sourcedFrom,
} from '@black-whale/ability-sdk'

/**
 * Steal Chain — Kurapika, thumb
 *
 * The theft of Little Eye (ch. 369) in four events: the victim loses the
 * ability, an ABILITY_GRANT effect holds it, and Kurapika gains it. Without
 * `ABILITY_REVOKED` the victim would keep a power the manga took away.
 */
export const stealChain = defineAbility({
  id: 'steal-chain',
  name: 'Steal Chain',
  owner: 'kurapika',
  category: 'conjurer',

  conditions: [
    canUseNen(),
    isConscious(),
    requiresTarget('Une victime est enchaînée'),
    requiresParameter('targetAbilityId', 'La capacité à voler est identifiée'),
  ],

  targets: [person()],

  effects: [
    sourcedFrom(abilityRevoke({ reason: 'steal-chain' }), ['chapter-369']),
    // The stolen ability is held by an effect, so the timeline can show where a
    // power sits between two owners.
    effect({
      kind: 'ABILITY_GRANT',
      discriminator: 'stolen',
      attributes: (ctx) => ({
        storedAbilityId: param(ctx, 'targetAbilityId'),
        victimId: ctx.targets[0],
        transferable: true,
      }),
    }),
    abilityGrant(),
  ],

  cost: { label: 'Occupe le pouce tant que la capacité est détenue', amount: 1, unit: 'doigt' },

  ui: { componentKey: 'ChainInteraction' },

  interactionManifest: buildManifest('steal-chain', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER'],
    overlays: ['CONTROL_LINK'],
    entryActions: ['select-finger'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'ChainInteraction',
  }),
})
