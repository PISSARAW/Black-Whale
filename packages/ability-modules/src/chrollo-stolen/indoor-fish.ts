import {
  bodyState,
  buildManifest,
  canUseNen,
  constraint,
  defineAbility,
  effectIsLive,
  isConscious,
  locationIsSealed,
  param,
  requiresParameter,
  setEffectState,
  spawnNenEntity,
  zone,
} from '@black-whale/ability-sdk'

/**
 * Indoor Fish — stolen from an unnamed user
 *
 * The mirror image of Luini: where Luini needs a sealed room to open portals,
 * these fish need one to exist at all. Opening the room ends the effect, and the
 * wounds they inflict are painless until it does.
 */
export const indoorFish = defineAbility({
  id: 'indoor-fish',
  name: 'Indoor Fish',
  owner: 'chrollo-lucilfer',
  category: 'conjurer',

  site: {
    kind: 'devour',
    instruction:
      'Click page copy to let the fish consume its words while the layout remains eerily intact until Zetsu.',
    rule: 'Indoor Fish eat flesh only inside a sealed room; victims feel nothing and remain alive until the ability ends.',
    cost: 'Enclosed active page',
    color: '#78b6c9',
    action: 'Release the fish indoors',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [zone()],

  cost: { label: 'Une pièce close, la page ouverte et maintenue', amount: 1, unit: 'pièce close' },

  actions: {
    release: {
      label: 'Lâcher les poissons',
      conditions: [
        requiresParameter('locationId', 'Une pièce est choisie'),
        locationIsSealed('La pièce est complètement close'),
      ],
      effects: [
        spawnNenEntity({
          id: (ctx) => `indoor-fish-${param(ctx, 'locationId') ?? 'room'}`,
          kind: 'CONSTRUCT',
          label: 'Poissons squelettiques',
          metadata: { survivesOnlyInSealedRoom: true },
        }),
        constraint({
          rules: [
            'Les poissons ne survivent que dans une pièce entièrement close.',
            'Les morsures sont indolores tant que l’effet dure.',
            'L’ouverture de la pièce met fin à la capacité.',
          ],
          attributes: (ctx) => ({ locationId: param(ctx, 'locationId'), painless: true }),
        }),
      ],
    },

    'room-opened': {
      label: 'La pièce s’ouvre',
      conditions: [effectIsLive('effectId', 'Les poissons sont lâchés')],
      effects: [
        setEffectState({ state: 'ENDED', attributes: { reason: 'room-opened' } }),
        // The damage lands all at once when the effect ends.
        bodyState({ state: 'INJURED' }),
      ],
      hint: 'Les blessures différées deviennent effectives',
    },
  },

  ui: { componentKey: 'RuleZonePanel' },

  interactionManifest: buildManifest('indoor-fish', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['LOCATION', 'CHARACTER'],
    overlays: ['RANGE'],
    entryActions: ['release'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'RuleZonePanel',
  }),
})
