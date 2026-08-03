import {
  buildManifest,
  canUseNen,
  constraint,
  declaredFlag,
  defineAbility,
  isConscious,
  listParam,
  numberParam,
  param,
  person,
  requiresTarget,
  setEffectState,
} from '@black-whale/ability-sdk'

/**
 * Moonlight Act — Longhi
 *
 * A contract with explicit terms, rewards and penalties, enforced by
 * Manipulation. The most literal materialisation of "explainable conditions" the
 * catalogue offers: the terms *are* the lines of the "Why?" panel, and both
 * signatures are recorded because the contract is voluntary on both sides.
 */
export const moonlightAct = defineAbility({
  id: 'moonlight-act',
  name: 'Moonlight Act',
  owner: 'longhi',
  category: 'manipulator',

  site: {
    kind: 'contract',
    instruction:
      'Two parties sign voluntarily; touching either of them honours the terms and rewards both, touching anyone else is a breach worth a week of Zetsu.',
    rule: 'Only a voluntary agreement with explicit terms can be rewarded or punished by the Manipulation contract.',
    cost: 'Mutual consent · declared duration and penalty',
    color: '#c6ddff',
    action: 'Choose the first signatory',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Un accord volontaire, aux termes et à la sanction déclarés', unit: 'contrat' },

  actions: {
    sign: {
      label: 'Signer le contrat',
      conditions: [
        requiresTarget('Un cocontractant est présent'),
        // Consent is the ability: without it there is no contract at all.
        declaredFlag('consented', true, 'Le cocontractant accepte librement'),
      ],
      effects: [
        (ctx) =>
          constraint({
            rules: listParam(ctx, 'terms'),
            attributes: {
              reward: param(ctx, 'reward'),
              penalty: param(ctx, 'penalty'),
              durationDays: numberParam(ctx, 'durationDays'),
              voluntary: true,
            },
          })(ctx).map((event) => ({
            ...event,
            // Both parties are the source of the contract, not just the caster.
            sourceIds: [ctx.actorId, ...ctx.targets],
          })),
      ],
    },

    fulfil: {
      label: 'Exécuter le contrat',
      effects: [setEffectState({ state: 'ENDED', attributes: { outcome: 'fulfilled' } })],
    },

    breach: {
      label: 'Rompre le contrat',
      effects: [setEffectState({ state: 'TRIGGERED', attributes: { outcome: 'breached' } })],
      hint: 'Applique la pénalité inscrite au contrat',
    },
  },

  ui: { componentKey: 'ContractPanel' },

  interactionManifest: buildManifest('moonlight-act', {
    inputMode: 'SEQUENCE',
    allowedTargets: ['CHARACTER', 'LOCATION'],
    overlays: ['CONTROL_LINK'],
    entryActions: ['sign'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'ContractPanel',
  }),
})
