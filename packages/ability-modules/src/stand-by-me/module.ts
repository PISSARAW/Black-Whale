import {
  abilityGrant,
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  person,
  requiresTarget,
  shown,
} from '@black-whale/ability-sdk'

/**
 * Stand By Me — Yushohi
 *
 * Chapter 414 establishes only the transfer: Yushohi lends the ability to
 * Chiyamasi before the breach of room 1009. Its combat effect and natural Nen
 * category remain unrevealed, so the module records the loan without inventing
 * what the borrower can do with it.
 */
export const standByMe = defineStandByMe()

function defineStandByMe() {
  return defineAbility({
    id: 'stand-by-me',
    name: 'Stand By Me',
    owner: 'yushohi',
    category: 'unknown',

    site: {
      kind: 'ability-lending',
      instruction:
        'Choose one allied soldier to carry Stand By Me. The revealed canon stops at the loan; no unshown combat effect is simulated.',
      rule: 'Yushohi can lend Stand By Me to another soldier; its actual effect remains unrevealed.',
      cost: 'Temporary transfer · further conditions unrevealed',
      color: '#88a8d8',
      action: 'Lend Stand By Me',
    },

    conditions: [canUseNen()],
    targets: [person()],
    cost: { label: 'Transfert temporaire à un allié', unit: 'prêt' },

    actions: {
      lend: {
        label: 'Prêter Stand By Me',
        evidence: shown('ch. 414 — Yushohi prête Stand By Me à Chiyamasi'),
        conditions: [requiresTarget('Un soldat allié reçoit la capacité')],
        effects: [
          abilityGrant({ abilityId: 'stand-by-me', ownerId: (ctx) => ctx.targets[0] }),
          effect({
            kind: 'CUSTOM',
            discriminator: 'loan',
            attributes: { loaned: true, revealedEffect: false },
          }),
        ],
      },
      'use-unrevealed-effect': {
        label: 'Employer son effet au combat',
        refusal: "Le chapitre 414 montre le prêt, pas l'effet de la capacité",
        evidence: shown('ch. 414 — seul le transfert à Chiyamasi est montré'),
      },
      'state-unrevealed-duration': {
        label: 'Fixer la durée du prêt',
        refusal: "La durée de Stand By Me n'est pas révélée",
        evidence: shown('ch. 414 — aucune durée n’est donnée avec le prêt'),
      },
      'state-unrevealed-category': {
        label: 'Nommer la catégorie naturelle',
        refusal: "La catégorie de Nen de Yushohi n'est pas révélée",
        evidence: shown('ch. 414 — le prêt ne révèle pas la catégorie'),
      },
    },

    ui: { componentKey: 'AbilityLoanPanel' },

    interactionManifest: buildManifest('stand-by-me', {
      inputMode: 'TARGET_SELECTION',
      allowedTargets: ['CHARACTER'],
      overlays: ['CONTROL_LINK'],
      entryActions: ['lend'],
      requiredState: ['canUseNen'],
      customComponent: 'AbilityLoanPanel',
    }),
  })
}
