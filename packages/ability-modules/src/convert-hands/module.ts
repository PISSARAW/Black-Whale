import {
  asserted,
  buildManifest,
  canUseNen,
  defineAbility,
  isConscious,
  param,
  perceptionMask,
  person,
  requiresTarget,
  setEffectState,
  shown,
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
      evidence: shown('ch. 372 — l’échange au contact pendant le combat de sumo'),
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

    'swap-to-flee': {
      label: 'Échanger pour rompre le contact',
      // The use that matters on the Black Whale: the hunted wears the hunter's
      // face long enough to walk away.
      evidence: shown('ch. 372 — Chrollo quitte la scène sous une autre apparence'),
      conditions: [requiresTarget('Une cible est touchée')],
      effects: [
        perceptionMask({
          appearsAs: (ctx) => param(ctx, 'appearsAs') ?? ctx.targets[0],
          attributes: { hand: 'left', purpose: 'escape', tell: 'marques sur les paumes' },
        }),
      ],
    },

    'check-palms': {
      label: 'Vérifier les paumes',
      // The counter-use the manga hands to the other side: the marks betray.
      evidence: shown('ch. 372 — les marques sur les paumes trahissent l’échange'),
      conditions: [requiresTarget('Une paume est examinée')],
      effects: [setEffectState({ state: 'ENDED', attributes: { revealedBy: 'palm-marks' } })],
    },

    'swap-at-distance': {
      label: 'Échanger à distance',
      refusal: 'L’échange se fait au contact : les deux mains doivent toucher',
      evidence: asserted('une main pour chaque identité marquée'),
    },

    revert: {
      label: 'Rendre les apparences',
      evidence: asserted('ce que les deux mains ont échangé, elles le rendent'),
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  perspective: (ctx) => [{ type: 'replace', targetField: 'perceivedAs', value: ctx.targets[0] }],

  ui: { componentKey: 'ConvertHandsView' },

  interactionManifest: buildManifest('convert-hands', {
    inputMode: 'CLICK',
    allowedTargets: ['CHARACTER', 'BODY', 'OBJECT'],
    overlays: ['AURA'],
    entryActions: ['swap'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'ConvertHandsView',
  }),
})
