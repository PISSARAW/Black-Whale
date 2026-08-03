import {
  asserted,
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
  shown,
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

  site: {
    kind: 'mimicry',
    instruction:
      'Spend time on a model to buy time in its form, then transform another element; the form drops by itself when that time runs out.',
    rule: 'Battle music changes Bonolenov’s appearance into a chosen identity or object.',
    cost: 'Model plus target',
    color: '#a889c8',
    action: 'Choose a form to copy',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    transform: {
      label: 'Prendre l’apparence',
      evidence: shown('ch. 388 — Bonolenov porte le visage d’un autre sur le Black Whale'),
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

    'transform-into-object': {
      label: 'Prendre la forme d’un objet',
      evidence: asserted('la capacité change son apparence en une identité ou un objet choisi'),
      conditions: [
        durationCondition(),
        requiresParameter('appearsAs', 'La forme visée est choisie'),
      ],
      effects: [
        perceptionMask({
          appearsAs: (ctx) => param(ctx, 'appearsAs'),
          attributes: { form: 'object' },
        }),
      ],
    },

    'transform-without-preparation': {
      label: 'Se transformer sans danse ni mélodie',
      refusal: 'La danse et la mélodie sont l’activation : sans elles, rien ne se produit',
      evidence: shown('ch. 388 — la préparation précède toujours la forme'),
    },

    'outlast-the-model': {
      label: 'Tenir plus longtemps que le temps côtoyé',
      refusal: 'La forme ne dure pas plus que le temps réellement passé avec le modèle',
    },

    revert: {
      label: 'Reprendre son apparence',
      evidence: asserted('la forme tombe d’elle-même quand son temps est écoulé'),
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
