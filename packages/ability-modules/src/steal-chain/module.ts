import {
  abilityGrant,
  asserted,
  abilityRevoke,
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  isConscious,
  param,
  person,
  effectIsLive,
  requiresParameter,
  requiresTarget,
  setEffectState,
  shown,
  sourcedFrom,
} from '@black-whale/ability-sdk'

/**
 * Steal Chain — Kurapika steal-chain
 *
 * Fidélité /tour : absente — état seul (drainage) posé sur les techniques, aucune chaîne dans la scène, et la cible canon — une personne — n'existe pas encore pour ce doigt.
 */
export const stealChain = defineAbility({
  id: 'steal-chain',
  name: 'Steal Chain',
  owner: 'kurapika',
  category: 'conjurer',

  site: {
    kind: 'chain-rule',
    instruction:
      'Drive the syringe into a map character to drain their aura, hold them in Zetsu and keep one of their registered Hatsu.',
    rule: 'The target is forced into an aura-depleted state while the stolen ability becomes available to Kurapika.',
    cost: 'Contact, maintained drain and one captured ability',
    color: '#d7dce2',
    action: 'Drain a target’s Hatsu',
  },

  arena: {
    effect: 'bind',
    cost: 20,
    persistent: true,
    condition: 'syringe-contact-and-drain',
    risk: 'single-held-ability',
    mechanic: 'theft',
  },

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

  /**
   * One thumb, one stored ability: the grid here is mostly about what the
   * finger is already holding. Stealing a second power is not a missing feature
   * but the price the manga charges.
   */
  actions: {
    steal: {
      label: 'Voler la capacité',
      evidence: shown(
        "dans le quartier de Woble, la chaîne du pouce s'enroule sur Sayird, le garde compromis ; Little Eye quitte son porteur et passe au pouce de Kurapika. (montré, ch. 369)",
      ),
      conditions: [
        requiresTarget('Une victime est enchaînée'),
        requiresParameter('targetAbilityId', 'La capacité à voler est identifiée'),
      ],
      effects: [
        sourcedFrom(abilityRevoke({ reason: 'steal-chain' }), ['chapter-369']),
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
    },

    'drain-into-zetsu': {
      label: 'Vider la victime',
      evidence: shown(
        "l'aura de Sayird se vide entièrement : sous Gyo, son enveloppe s'éteint, Zetsu forcé jusqu'à nouvel ordre. (montré, ch. 369)",
      ),
      conditions: [requiresTarget('Une victime est enchaînée')],
      effects: [setEffectState({ state: 'ACTIVE', attributes: { forcedZetsu: true } })],
    },

    'return-ability': {
      label: 'Rendre la capacité',
      evidence: asserted(
        'ce que le pouce tient, il peut le relâcher — c’est ce qui rend le prêt possible',
      ),
      conditions: [effectIsLive('effectId', 'Une capacité est détenue')],
      effects: [setEffectState({ state: 'ENDED', attributes: { returned: true } })],
    },

    'steal-second': {
      label: 'Le pouce occupé (refus)',
      refusal:
        'tant que la capacité volée est détenue, le doigt reste pris : la roue grise « rendre » comme « voler une deuxième capacité », conditions affichées. (affirmé)',
    },
  },

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
