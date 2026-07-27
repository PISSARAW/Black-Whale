import {
  attributeCounter,
  buildManifest,
  canUseNen,
  curse,
  defineAbility,
  effectAttributeAtLeast,
  effectIsLive,
  person,
  requiresTarget,
  setEffectState,
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
  name: 'Tserriednich — marques de mensonge',
  owner: 'prince-tserriednich',
  category: 'unknown',

  conditions: [canUseNen()],

  targets: [person()],

  actions: {
    mark: {
      label: 'Marquer un interrogé',
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
      conditions: [effectIsLive('effectId', 'Une marque est en place')],
      effects: [attributeCounter({ increments: { lieCount: 1 } })],
      cost: { label: 'Une marque de plus', amount: 1, unit: 'marque' },
    },

    transform: {
      label: 'Troisième mensonge',
      conditions: [
        effectIsLive('effectId', 'Une marque est en place'),
        effectAttributeAtLeast('lieCount', FATAL_LIE_COUNT, `Trois mensonges ont été comptés`),
      ],
      effects: [setEffectState({ state: 'TRIGGERED', attributes: { transformed: true } })],
    },
  },

  ui: { componentKey: 'LieMarkCounter' },

  interactionManifest: buildManifest('tserriednich-guardian-lie-marks', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'BODY'],
    overlays: ['AURA'],
    entryActions: ['mark'],
    requiredState: ['canUseNen'],
    customComponent: 'LieMarkCounter',
  }),
})

export const TSERRIEDNICH_FATAL_LIE_COUNT = FATAL_LIE_COUNT
