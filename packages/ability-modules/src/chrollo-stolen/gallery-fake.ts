import {
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  isConscious,
  object,
  requiresTarget,
  spawnNenEntity,
} from '@black-whale/ability-sdk'

/**
 * Gallery Fake — inherited from Kortopi
 *
 * Copies that last a day. Its creator is dead, so on the timeline this page is
 * revoked at Kortopi's death: the world engine does that on its own, and the
 * book's contents change as the reader scrolls.
 */
export const galleryFake = defineAbility({
  id: 'gallery-fake',
  name: 'Gallery Fake',
  owner: 'chrollo-lucilfer',
  category: 'conjurer',

  site: {
    kind: 'clone',
    instruction:
      'Click a page element to lay a perfect-looking inert duplicate beside it: the copy answers to nothing the original does.',
    rule: 'Gallery Fake creates exact copies that lack the original’s living qualities and special powers.',
    cost: 'Copies vanish after twenty-four hours',
    color: '#a7c8c5',
    action: 'Copy a visible object',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [object()],

  actions: {
    copy: {
      label: 'Copier un objet',
      conditions: [requiresTarget('Un objet est touché')],
      effects: [
        spawnNenEntity({
          id: (ctx) => `gallery-fake-${ctx.targets[0] ?? 'object'}`,
          kind: 'CONSTRUCT',
          label: 'Copie',
          metadata: (ctx) => ({
            originalId: ctx.targets[0],
            // Twenty-four hours, and gone with its creator.
            lifespanHours: 24,
            diesWithCreator: 'kortopi',
          }),
        }),
        effect({
          kind: 'CUSTOM',
          discriminator: 'copy',
          attributes: { lifespanHours: 24, indistinguishable: true },
        }),
      ],
      cost: { label: 'La copie disparaît', amount: 24, unit: 'heures' },
    },
  },

  ui: { componentKey: 'CopyLedger' },

  interactionManifest: buildManifest('gallery-fake', {
    inputMode: 'CLICK',
    allowedTargets: ['OBJECT'],
    overlays: ['AURA'],
    entryActions: ['copy'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'CopyLedger',
  }),
})
