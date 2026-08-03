import {
  buildManifest,
  canUseNen,
  controlLink,
  defineAbility,
  effect,
  effectIsLive,
  isConscious,
  listParam,
  object,
  param,
  requiresParameter,
  requiresTarget,
  setEffectState,
  shown,
  spawnNenEntity,
} from '@black-whale/ability-sdk'

/**
 * Order Stamp — stolen from an unnamed user
 *
 * Animates objects with a head, not corpses, and takes a single spoken order.
 * Combined with Gallery Fake (ch. 357) it is the engine's load test: two hundred
 * constructs standing on one arena map.
 */
export const orderStamp = defineAbility({
  id: 'order-stamp',
  name: 'Order Stamp',
  owner: 'chrollo-lucilfer',
  category: 'conjurer',

  site: {
    kind: 'command',
    instruction:
      'Stamp up to 20 lifeless blocks that have a head; click a stamped one again to lock it in red, and once anything is locked the next click elsewhere is the order the locked puppets obey.',
    rule: 'The stamp controls puppets as objects, never beings the user considers alive.',
    cost: 'Only inanimate page bodies',
    color: '#cf6d62',
    action: 'Stamp page puppets',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [object()],

  cost: { label: 'Uniquement des corps que son porteur tient pour inanimés', unit: 'pantin' },

  actions: {
    animate: {
      label: 'Animer un objet',
      evidence: shown('ch. 357 — les objets à tête animés dans l’arène'),
      conditions: [requiresTarget('Un objet à tête est visé')],
      effects: [
        controlLink({
          vector: 'stamp',
          mode: 'control',
          attributes: (ctx) => ({
            order: param(ctx, 'order'),
            rules: [
              'N’anime que des objets pourvus d’une tête, jamais de vrais cadavres.',
              'Un seul ordre vocal simple par pantin.',
              'La décapitation annule l’animation.',
            ],
          }),
        }),
      ],
    },

    'animate-crowd': {
      label: 'Animer une foule',
      evidence: shown('ch. 357 — plus de deux cents pantins en même temps'),
      conditions: [requiresParameter('cohortId', 'Une cohorte de copies est visée')],
      effects: [
        spawnNenEntity({
          id: (ctx) => param(ctx, 'cohortId') ?? 'order-stamp-puppets',
          kind: 'COHORT',
          label: 'Pantins d’Order Stamp',
        }),
        effect({
          kind: 'CONTROL_LINK',
          discriminator: 'crowd',
          targets: (ctx) => [
            { id: param(ctx, 'cohortId') ?? 'order-stamp-puppets', kind: 'COHORT' as const },
          ],
          attributes: (ctx) => ({
            memberIds: listParam(ctx, 'memberIds'),
            order: param(ctx, 'order'),
            mode: 'control',
          }),
        }),
      ],
      hint: 'Plus de 200 pantins en canon (combo Gallery Fake, ch. 357)',
    },

    behead: {
      label: 'Décapiter un pantin',
      evidence: shown('ch. 357 — la décapitation annule l’animation'),
      conditions: [effectIsLive('effectId', 'Un pantin est animé')],
      effects: [setEffectState({ state: 'ENDED', attributes: { reason: 'beheaded' } })],
    },

    'animate-a-corpse': {
      label: 'Animer un vrai cadavre',
      refusal: 'Le tampon n’anime que des objets à tête, jamais un corps véritable',
      evidence: shown('ch. 357 — ce sont des copies qui se relèvent, pas les morts'),
    },

    'give-a-complex-order': {
      label: 'Donner un ordre complexe',
      refusal: 'Un ordre vocal simple par pantin : le tampon ne négocie pas',
    },
  },

  ui: { componentKey: 'PuppetCrowd' },

  interactionManifest: buildManifest('order-stamp', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['OBJECT', 'CHARACTER'],
    overlays: ['CONTROL_LINK'],
    entryActions: ['animate'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'PuppetCrowd',
  }),
})
