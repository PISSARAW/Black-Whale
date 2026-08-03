import {
  attributeCounter,
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  effectIsLive,
  inZetsu,
  numberParam,
  self,
  setEffectState,
} from '@black-whale/ability-sdk'

/** Canon: the vision always covers the next ten seconds. */
export const PARALLEL_FUTURE_WINDOW_SECONDS = 10

/**
 * Parallel Future — Tserriednich Hui Guo Rou
 *
 * Not an effect: a simulation branch. Activating forks ten seconds of predicted
 * events; holding slides that window; concluding merges the predicted branch
 * back for everyone *except* Tserriednich, who acts on what he saw.
 *
 * The module owns the rules and the bookkeeping; the fork and the selective
 * merge themselves belong to the simulation engine (`SimulationEngine.mergeBranch`
 * with `excludeSubjectIds`), because they operate on branches rather than on the
 * world state.
 */
export const parallelFuture = defineAbility({
  id: 'parallel-future',
  name: 'Parallel Future',
  owner: 'prince-tserriednich',
  category: 'specialist',

  site: {
    kind: 'future',
    instruction:
      'Observe next-chapter bodies for ten seconds and click possible actions to leave predicted afterimages while choosing a divergent reality.',
    rule: 'Everyone except Tserriednich continues perceiving the immutable prediction even when his real actions change.',
    cost: 'Complete Zetsu · ten-second vision',
    color: '#7dd3fc',
    action: 'Enter the ten-second future',
  },

  conditions: [canUseNen()],

  targets: [self()],

  actions: {
    'open-window': {
      label: 'Ouvrir la fenêtre de 10 secondes',
      conditions: [inZetsu()],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'future-window',
          attributes: {
            windowSeconds: PARALLEL_FUTURE_WINDOW_SECONDS,
            heldSeconds: 0,
            rules: [
              'Zetsu, yeux fermés : vision des dix prochaines secondes.',
              'En maintenant le Zetsu, la vision reste en avance de dix secondes.',
              'Perception double : présent et futur simultanés.',
              'À la fin, les autres vivent les dix secondes prédites ; lui agit autrement.',
            ],
          },
        }),
      ],
      cost: {
        label: 'Zetsu maintenu — aucune défense pendant la vision',
        amount: PARALLEL_FUTURE_WINDOW_SECONDS,
        unit: 'secondes sans aura',
      },
    },

    hold: {
      label: 'Maintenir la vision',
      conditions: [inZetsu(), effectIsLive('effectId', 'La fenêtre est ouverte')],
      effects: [
        attributeCounter({
          increments: (ctx) => ({ heldSeconds: numberParam(ctx, 'secondsElapsed') ?? 0 }),
        }),
      ],
      hint: 'La fenêtre glisse : toujours dix secondes d’avance',
    },

    conclude: {
      label: 'Conclure — le futur prédit devient réel',
      conditions: [effectIsLive('effectId', 'La fenêtre est ouverte')],
      effects: [
        // The merge itself is a branch operation: the module records the
        // divergence so the caller knows whose events to drop when merging.
        setEffectState({
          state: 'TRIGGERED',
          attributes: {
            mergeStrategy: 'selective',
            divergingSubjectIds: ['prince-tserriednich'],
          },
        }),
      ],
      hint: 'Les autres vivent les dix secondes prédites ; Tserriednich diverge',
    },
  },

  ui: { componentKey: 'ParallelFutureView' },

  interactionManifest: buildManifest('parallel-future', {
    inputMode: 'HOLD',
    allowedTargets: ['CHARACTER', 'EVENT'],
    overlays: ['FUTURE', 'TRAJECTORY'],
    entryActions: ['open-window'],
    requiredState: ['canUseNen', 'inZetsu'],
    perspectiveTransition: {
      canChangeBody: false,
      canChangeConsciousness: false,
      canFollowAura: false,
    },
    // Split screen: present on the left, +10 s on the right.
    customComponent: 'ParallelFutureView',
  }),
})
