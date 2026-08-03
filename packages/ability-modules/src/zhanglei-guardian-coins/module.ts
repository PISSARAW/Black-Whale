import {
  attributeCounter,
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  effectIsLive,
  knowledgeGrant,
  moveEntity,
  numberParam,
  object,
  param,
  requiresParameter,
  shown,
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
  name: 'Guardian Coins',
  owner: 'prince-zhanglei',
  category: 'unknown',

  site: {
    kind: 'coin-growth',
    instruction:
      'Revisit the same holder to multiply the coin by ten and eventually awaken it; giving the coin to anyone else resets it to 1 and wipes what was accumulated.',
    rule: 'One coin is produced daily, accumulates Nen over time and resets to value one whenever ownership changes.',
    cost: 'Long accumulation · transfer resets value',
    color: '#d7b34f',
    action: 'Mint a value-one coin',
  },

  conditions: [canUseNen()],

  targets: [object()],

  actions: {
    mint: {
      label: 'Frapper une pièce',
      evidence: shown('ch. 395 — la pièce frappée et donnée'),
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
      evidence: shown('ch. 395 — une unité de valeur par jour'),
      conditions: [effectIsLive('effectId', 'La pièce existe')],
      effects: [
        attributeCounter({ increments: (ctx) => ({ value: numberParam(ctx, 'days') ?? 1 }) }),
      ],
    },

    'trace-a-coin': {
      label: 'Suivre une pièce',
      // A coin is an object on the map: where it went, and through whose hands,
      // is a thread the timeline can follow on its own.
      evidence: shown('ch. 395+ — la pièce circule de main en main'),
      conditions: [effectIsLive('effectId', 'La pièce existe')],
      effects: [
        knowledgeGrant({
          factId: (ctx) => `coin-holder:${param(ctx, 'serial') ?? '1'}`,
          state: 'KNOWN',
        }),
      ],
    },

    'keep-the-value-through-a-transfer': {
      label: 'Transmettre la pièce sans perdre sa valeur',
      refusal: 'Le transfert remet la valeur à zéro : c’est le prix du don',
      evidence: shown('ch. 395 — la règle énoncée avec la capacité'),
    },

    transfer: {
      label: 'Donner la pièce',
      evidence: shown('ch. 395 — la pièce remise à Hisoka'),
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
    allowedTargets: ['OBJECT', 'CHARACTER', 'LOCATION'],
    overlays: ['RANGE'],
    entryActions: ['mint'],
    requiredState: ['canUseNen'],
    customComponent: 'CoinLedger',
  }),
})
