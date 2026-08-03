import {
  asserted,
  buildManifest,
  canUseNen,
  constraint,
  declaredFlag,
  defineAbility,
  isConscious,
  knowledgeGrant,
  listParam,
  numberParam,
  param,
  person,
  requiresTarget,
  setEffectState,
  shown,
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
      evidence: shown('ch. 397 — le contrat énoncé terme par terme, puis accepté'),
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

    'read-the-terms': {
      label: 'Lire les termes',
      // The most literal rendering of "explainable conditions": the contract is
      // displayed as written, and the panel shows nothing else.
      evidence: shown('ch. 397 — les termes sont énoncés avant la signature'),
      effects: [
        knowledgeGrant({
          factId: (ctx) => `contract-terms:${param(ctx, 'contractId') ?? 'contract'}`,
          state: 'KNOWN',
        }),
      ],
    },

    fulfil: {
      label: 'Exécuter le contrat',
      evidence: shown('ch. 397 — la récompense suit l’exécution'),
      effects: [setEffectState({ state: 'ENDED', attributes: { outcome: 'fulfilled' } })],
    },

    'sign-without-consent': {
      label: 'Imposer un contrat',
      refusal: 'Le contrat est volontaire : sans accord libre, il n’y a pas de capacité',
      evidence: shown('ch. 397 — le consentement est la condition d’entrée'),
    },

    'change-the-terms': {
      label: 'Changer les termes en cours',
      refusal: 'Les termes signés valent tels quels : ils ne se réécrivent pas',
      evidence: asserted('la capacité exécute ce qui a été convenu, rien d’autre'),
    },

    breach: {
      label: 'Rompre le contrat',
      evidence: shown('ch. 397 — la pénalité inscrite s’applique'),
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
