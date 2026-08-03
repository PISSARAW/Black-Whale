import {
  buildManifest,
  canUseNen,
  defineAbility,
  isConscious,
  param,
  perceptionMask,
  person,
  requiresTarget,
  setEffectState,
} from '@black-whale/ability-sdk'

/**
 * Convert Hands — Chrollo Lucilfer
 *
 * Two crossed perception masks and nothing else: unlike Grimmel, no soul moves.
 * The identity engine does not budge; only the perspective engine is fooled.
 * That contrast is the point — the site can tell *who is where* apart from *who
 * seems to be where*.
 */
export const convertHands = defineAbility({
  id: 'convert-hands',
  name: 'Convert Hands',
  owner: 'chrollo-lucilfer',
  category: 'specialist',

  site: {
    kind: 'identity-swap',
    instruction:
      'Select two elements to exchange their visible identities while retaining their original destinations and behavior.',
    rule: 'Left and right hand marks exchange appearances without exchanging the underlying person.',
    cost: 'Two marked identities',
    color: '#d6a5cc',
    action: 'Mark the first identity',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Deux identités marquées, une par main', amount: 2, unit: 'marques' },

  actions: {
    swap: {
      label: 'Échanger les apparences',
      conditions: [requiresTarget('Une cible est touchée')],
      effects: [
        // Right hand: the target looks like Chrollo.
        perceptionMask({
          appearsAs: (ctx) => ctx.actorId,
          attributes: { hand: 'right', tell: 'marques sur les paumes' },
        }),
        // Left hand: Chrollo looks like the target.
        perceptionMask({
          appearsAs: (ctx) => param(ctx, 'appearsAs') ?? ctx.targets[0],
          attributes: { hand: 'left', tell: 'marques sur les paumes' },
        }),
      ],
    },

    revert: {
      label: 'Rendre les apparences',
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  perspective: (ctx) => [{ type: 'replace', targetField: 'perceivedAs', value: ctx.targets[0] }],

  ui: { componentKey: 'ConvertHandsView' },

  interactionManifest: buildManifest('convert-hands', {
    inputMode: 'CLICK',
    allowedTargets: ['CHARACTER', 'BODY'],
    overlays: ['AURA'],
    entryActions: ['swap'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'ConvertHandsView',
  }),
})
