import {
  abilityGrant,
  abilityRevoke,
  auraModifier,
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  effectAttribute,
  effectIsLive,
  isConscious,
  param,
  person,
  requiresParameter,
  requiresTarget,
  setEffectState,
  targetRefs,
} from '@black-whale/ability-sdk'

/**
 * Stealth Dolphin — Kurapika, ring finger (loan)
 *
 * Lending a stolen ability to somebody who cannot use Nen. The loan is what
 * turns Oito into a Nen user in the world state: the grant opens her aura nodes,
 * and using the ability consumes the loan back.
 */
export const stealthDolphin = defineAbility({
  id: 'stealth-dolphin',
  name: 'Stealth Dolphin',
  owner: 'kurapika',
  category: 'conjurer',

  site: {
    kind: 'ability-loan',
    instruction:
      'Read out what Steal Chain has already taken, then loan it to one recipient; it is spent after a single use and a non-user is awakened by it.',
    rule: 'The dolphin exists during Emperor Time, explains the captured ability and opens a non-user’s aura nodes when the loan is consumed.',
    cost: 'Emperor Time remains active until the loaded ability is used',
    color: '#63d5e6',
    action: 'Analyze a stolen ability',
  },

  arena: {
    effect: 'enhance',
    cost: 16,
    persistent: false,
    condition: 'previously-stolen-ability',
    risk: 'single-use-loan',
    mechanic: 'loan',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    lend: {
      label: 'Prêter la capacité',
      conditions: [
        requiresTarget('Un emprunteur est désigné'),
        requiresParameter('targetAbilityId', 'La capacité prêtée est identifiée'),
      ],
      effects: [
        abilityGrant({ ownerId: (ctx) => targetRefs(ctx)[0]?.id }),
        effect({
          kind: 'ABILITY_GRANT',
          discriminator: 'loan',
          attributes: (ctx) => ({
            loan: true,
            storedAbilityId: param(ctx, 'targetAbilityId'),
            borrowerId: targetRefs(ctx)[0]?.id,
            uses: 1,
          }),
        }),
        // Canon: the borrower's aura nodes are opened for the duration of the
        // loan. Oito shows up in the world state as a Nen user because of this.
        auraModifier({ nenNodesOpened: true, byLoan: true }),
      ],
      cost: { label: 'Un doigt immobilisé pendant le prêt', amount: 1, unit: 'doigt' },
    },

    consume: {
      label: 'Consommer le prêt',
      conditions: [effectIsLive('effectId', 'Le prêt est encore actif')],
      effects: [
        abilityRevoke({
          // The loan effect knows which ability it holds; the caller only has to
          // point at it.
          abilityId: (ctx) =>
            param(ctx, 'targetAbilityId') ??
            (effectAttribute(ctx, 'storedAbilityId') as string | undefined),
          ownerId: (ctx) =>
            param(ctx, 'borrowerId') ??
            (effectAttribute(ctx, 'borrowerId') as string | undefined) ??
            targetRefs(ctx)[0]?.id,
          reason: 'loan-consumed',
        }),
        setEffectState({ state: 'ENDED' }),
      ],
      hint: 'Requiert un prêt en cours',
    },
  },

  ui: { componentKey: 'ChainInteraction' },

  interactionManifest: buildManifest('stealth-dolphin', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER'],
    overlays: ['CONTROL_LINK', 'AURA'],
    entryActions: ['select-finger'],
    requiredState: ['isConscious', 'canUseNen'],
    perspectiveTransition: {
      canChangeBody: false,
      canChangeConsciousness: false,
      canFollowAura: true,
    },
    customComponent: 'ChainInteraction',
  }),
})
