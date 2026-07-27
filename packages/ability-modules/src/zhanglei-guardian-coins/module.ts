import {
  attributeCounter,
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  effectIsLive,
  moveEntity,
  numberParam,
  object,
  param,
  requiresParameter,
  spawnNenEntity,
} from '@black-whale/ability-sdk'

const coinId = (serial: string): string => `zhanglei-coin-${serial}`

/**
 * Guardian coins — Zhang Lei
 *
 * A coin whose value grows by one a day and resets when it changes hands. The
 * site already has story-time days, and the coin is a traceable object, so its
 * circulation — handed to Hisoka, to the Troupe (ch. 395+) — becomes a narrative
 * thread you can follow on the map rather than a piece of trivia.
 */
export const zhangleiGuardianCoins = defineAbility({
  id: 'zhanglei-guardian-coins',
  name: 'Zhang Lei — pièces du gardien',
  owner: 'prince-zhanglei',
  category: 'unknown',

  conditions: [canUseNen()],

  targets: [object()],

  actions: {
    mint: {
      label: 'Frapper une pièce',
      conditions: [requiresParameter('serial', 'La pièce est identifiée')],
      effects: [
        spawnNenEntity({
          id: (ctx) => coinId(param(ctx, 'serial') ?? '1'),
          kind: 'OBJECT',
          label: 'Pièce de Zhang Lei',
        }),
        effect({
          kind: 'CUSTOM',
          discriminator: 'coin',
          targets: (ctx) => [{ id: coinId(param(ctx, 'serial') ?? '1'), kind: 'OBJECT' as const }],
          attributes: {
            value: 0,
            rules: [
              'La valeur augmente d’une unité par jour.',
              'Le transfert remet la valeur à zéro.',
            ],
          },
        }),
      ],
    },

    accrue: {
      label: 'Laisser mûrir',
      conditions: [effectIsLive('effectId', 'La pièce existe')],
      effects: [
        attributeCounter({ increments: (ctx) => ({ value: numberParam(ctx, 'days') ?? 1 }) }),
      ],
    },

    transfer: {
      label: 'Donner la pièce',
      conditions: [
        effectIsLive('effectId', 'La pièce existe'),
        requiresParameter('holderId', 'Un nouveau porteur est désigné'),
      ],
      effects: [
        // Handing it over is exactly what makes it worthless again.
        attributeCounter({
          attributes: (ctx) => ({ value: 0, holderId: param(ctx, 'holderId') }),
        }),
        moveEntity({
          entity: (ctx) => ({ id: coinId(param(ctx, 'serial') ?? '1'), kind: 'OBJECT' }),
        }),
      ],
      cost: { label: 'La valeur accumulée est perdue', unit: 'valeur' },
    },
  },

  ui: { componentKey: 'CoinLedger' },

  interactionManifest: buildManifest('zhanglei-guardian-coins', {
    inputMode: 'CLICK',
    allowedTargets: ['OBJECT', 'CHARACTER'],
    overlays: ['RANGE'],
    entryActions: ['mint'],
    requiredState: ['canUseNen'],
    customComponent: 'CoinLedger',
  }),
})
