import {
  attributeCounter,
  buildManifest,
  canUseNen,
  curse,
  defineAbility,
  effectAttributeAtLeast,
  effectIsLive,
  knowledgeGrant,
  person,
  requiresTarget,
  setEffectState,
  shown,
} from '@black-whale/ability-sdk'

/** Canon: the third lie is the one that transforms you. */
const FATAL_LIE_COUNT = 3

/**
 * Tserriednich's guardian — lie marks
 *
 * A counter worn on the skin. Theta's interrogation happens under this sword:
 * she can see her own tally, so the module publishes it in her perspective — the
 * dread is that she knows exactly how many lies she has left.
 */
export const tserriednichGuardianLieMarks = defineAbility({
  id: 'tserriednich-guardian-lie-marks',
  name: 'Three-Lie Transformation',
  owner: 'prince-tserriednich',
  category: 'unknown',

  site: {
    kind: 'lie-marks',
    instruction:
      'The beast judges each answer and only marks the ones it reads as lies: a cut, then an infected warning, then something no longer itself.',
    rule: 'Each lie escalates the curse and the third transforms the liar into something no longer human.',
    cost: 'Three lies told in Tserriednich’s presence',
    color: '#9e6d89',
    action: 'Detect the first lie',
  },

  conditions: [canUseNen()],

  targets: [person()],

  actions: {
    mark: {
      label: 'Marquer un interrogé',
      evidence: shown('ch. 391 — la marque posée sur l’interrogé'),
      conditions: [requiresTarget('Un interrogé est marqué')],
      effects: [
        curse({
          trigger: 'third-lie',
          rules: [
            'Chaque mensonge ajoute une marque.',
            'La troisième marque déclenche la transformation.',
          ],
          attributes: { lieCount: 0, fatalLieCount: FATAL_LIE_COUNT, visibleToBearer: true },
        }),
      ],
    },

    'count-lie': {
      label: 'Compter un mensonge',
      evidence: shown('ch. 391 — chaque mensonge ajoute sa marque'),
      conditions: [effectIsLive('effectId', 'Une marque est en place')],
      effects: [attributeCounter({ increments: { lieCount: 1 } })],
      cost: { label: 'Une marque de plus', amount: 1, unit: 'marque' },
    },

    transform: {
      label: 'Troisième mensonge',
      evidence: shown('ch. 391 — au troisième mensonge, la transformation'),
      conditions: [
        effectIsLive('effectId', 'Une marque est en place'),
        effectAttributeAtLeast({
          key: 'lieCount',
          threshold: FATAL_LIE_COUNT,
          label: `Trois mensonges ont été comptés`,
        }),
      ],
      effects: [setEffectState({ state: 'TRIGGERED', attributes: { transformed: true } })],
    },

    'show-the-count-to-the-bearer': {
      label: 'Afficher le compteur au porteur',
      // Theta knows exactly how many she has left: the interrogation lives under
      // that sword, and her perspective has to show it.
      evidence: shown('ch. 391 — la porteuse sait où elle en est'),
      conditions: [effectIsLive('effectId', 'Une marque est en place')],
      effects: [
        knowledgeGrant({
          factId: (ctx) => `lie-count:${ctx.targets[0] ?? 'bearer'}`,
          state: 'KNOWN',
        }),
      ],
    },

    'erase-a-mark': {
      label: 'Effacer une marque',
      refusal: 'Les marques s’ajoutent, elles ne se retirent pas',
    },
  },

  ui: { componentKey: 'LieMarkCounter' },

  interactionManifest: buildManifest('tserriednich-guardian-lie-marks', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'BODY', 'OBJECT'],
    overlays: ['AURA'],
    entryActions: ['mark'],
    requiredState: ['canUseNen'],
    customComponent: 'LieMarkCounter',
  }),
})

export const TSERRIEDNICH_FATAL_LIE_COUNT = FATAL_LIE_COUNT
