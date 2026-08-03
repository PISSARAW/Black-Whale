import {
  bodyState,
  buildManifest,
  canUseNen,
  curse,
  defineAbility,
  effectIsLive,
  masked,
  param,
  postMortem,
  requiresParameter,
  self,
  setEffectState,
} from '@black-whale/ability-sdk'

/**
 * Cat's Name — Camilla Hui Guo Rou
 *
 * The only mechanical resurrection in the catalogue, and the best simulation
 * demo the engine has: ask "what happens if X kills Camilla?" and the answer is
 * that X dies and Camilla comes back. The curse is masked, so the "Why?" panel
 * warns about it in the omniscient view and says nothing in a naive one — which
 * is precisely the trap Benjamin walked into at ch. 387.
 */
export const catsName = defineAbility({
  id: 'cats-name',
  name: "Cat's Name",
  owner: 'prince-camilla',
  category: 'specialist',

  site: {
    kind: 'resurrection',
    instruction:
      'Click the direct killer to simulate Camilla’s death; the post-mortem cat crushes that culprit, absorbs life and restores the page.',
    rule: 'Only direct death activates the counterattack; nonlethal harm or refusal to kill bypasses the ability.',
    cost: 'Camilla’s death · identifiable direct killer',
    color: '#ff8fab',
    action: 'Choose the direct killer',
  },

  conditions: [canUseNen()],

  targets: [self()],

  actions: {
    arm: {
      label: 'Armer la contre-attaque',
      effects: [
        // Permanent, dormant, invisible, and it must survive its own owner's
        // death — otherwise the post-mortem invariant would end it exactly when
        // it is supposed to fire.
        masked(
          postMortem(
            curse({
              trigger: 'owner-killed',
              rules: [
                'Ne se déclenche que si Camilla est tuée par un agresseur.',
                'Tue le meurtrier et absorbe sa vie.',
                'Ressuscite Camilla.',
                'Inutile contre quelqu’un qui refuse de la tuer.',
              ],
              attributes: { permanent: true },
            }),
          ),
        ),
      ],
    },

    trigger: {
      label: 'Un agresseur tue Camilla',
      conditions: [
        effectIsLive('effectId', 'La contre-attaque est armée'),
        requiresParameter('killerId', 'Le meurtrier est identifié'),
      ],
      effects: [
        setEffectState({ state: 'TRIGGERED' }),
        bodyState({ bodyId: (ctx) => param(ctx, 'killerId'), state: 'DEAD' }),
        // The resurrection, as a body-state transition like any other.
        bodyState({
          bodyId: (ctx) => param(ctx, 'bodyId') ?? 'prince-camilla',
          state: 'ALIVE',
        }),
      ],
      cost: { label: 'La vie du meurtrier', unit: 'vie' },
      hint: 'Avertissement affiché en mode omniscient uniquement',
    },
  },

  ui: { componentKey: 'CatsNameWarning' },

  interactionManifest: buildManifest('cats-name', {
    inputMode: 'CUSTOM',
    allowedTargets: ['CHARACTER', 'BODY'],
    overlays: ['AURA'],
    entryActions: ['arm'],
    requiredState: ['canUseNen'],
    customComponent: 'CatsNameWarning',
  }),
})
