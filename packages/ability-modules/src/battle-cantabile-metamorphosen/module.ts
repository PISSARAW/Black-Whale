import {
  beliefBroadcast,
  buildManifest,
  canUseNen,
  checklist,
  defineAbility,
  effectIsLive,
  isConscious,
  listParam,
  numberParam,
  param,
  perceptionMask,
  person,
  requiresParameter,
  setEffectState,
} from '@black-whale/ability-sdk'

/** Canon: the disguise cannot outlast the time actually spent with the model. */
const durationCondition = () =>
  checklist('metamorphosen-preparation', 'Danse et mélodie exécutées', ['dance', 'melody'])

/**
 * Battle Cantabile: Metamorphosen — Bonolenov Ndongo
 *
 * On the Black Whale, Bonolenov *is* the fog of war: he wears Hisoka, Zakuro,
 * Lynch, Owl. The apparent map shows Hisoka on Tier 5 while the omniscient map
 * shows Bonolenov — this ability is the reason the status header has an
 * "apparent" perspective mode at all.
 */
export const battleCantabileMetamorphosen = defineAbility({
  id: 'battle-cantabile-metamorphosen',
  name: 'Battle Cantabile: Metamorphosen',
  owner: 'bonolenov-ndongo',
  category: 'conjurer',

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    transform: {
      label: 'Prendre l’apparence',
      conditions: [
        durationCondition(),
        requiresParameter('appearsAs', 'Le modèle imité est identifié'),
      ],
      effects: [
        perceptionMask({
          appearsAs: (ctx) => param(ctx, 'appearsAs'),
          auraDetectable: true,
          attributes: (ctx) => ({
            // The disguise lasts at most as long as he spent with the model.
            maxDurationSeconds: numberParam(ctx, 'timeSpentWithModelSeconds'),
            requiresDance: true,
            requiresMelody: true,
          }),
        }),
        beliefBroadcast({
          factId: (ctx) => `present:${param(ctx, 'appearsAs') ?? 'model'}`,
          observerIds: (ctx) => listParam(ctx, 'witnessIds'),
        }),
      ],
      cost: {
        label: 'Durée plafonnée par le temps passé avec le modèle',
        unit: 'secondes',
      },
    },

    revert: {
      label: 'Reprendre son apparence',
      conditions: [effectIsLive('effectId', 'Un déguisement est actif')],
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  perspective: (ctx) => [
    { type: 'replace', targetField: 'perceivedAs', value: param(ctx, 'appearsAs') },
  ],

  ui: { componentKey: 'MetamorphosenView' },

  interactionManifest: buildManifest('battle-cantabile-metamorphosen', {
    // Dance then melody: the activation is a sequence, and skipping it fails.
    inputMode: 'SEQUENCE',
    allowedTargets: ['CHARACTER', 'BODY'],
    overlays: ['AURA'],
    entryActions: ['transform'],
    requiredState: ['isConscious', 'canUseNen'],
    perspectiveTransition: {
      canChangeBody: false,
      canChangeConsciousness: false,
      canFollowAura: false,
    },
    customComponent: 'MetamorphosenView',
  }),
})
