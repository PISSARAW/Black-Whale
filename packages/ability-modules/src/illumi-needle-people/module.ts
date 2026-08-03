import {
  buildManifest,
  canUseNen,
  controlLink,
  defineAbility,
  isConscious,
  masked,
  param,
  perceptionMask,
  person,
  requiresTarget,
  setEffectState,
} from '@black-whale/ability-sdk'

/**
 * Needle People — Illumi Zoldyck
 *
 * One needle, two very different effects. Planted in a body it takes it over —
 * a disposable puppet, shown on the map with a dotted line back to Illumi in the
 * omniscient view and nothing at all in a naive one. Planted in his own skull it
 * is a lasting disguise, which is Gittarackur.
 */
export const illumiNeedlePeople = defineAbility({
  id: 'illumi-needle-people',
  name: 'Needle People',
  owner: 'illumi',
  category: 'manipulator',

  site: {
    kind: 'needle',
    instruction:
      'Pierce an element with one needle and one order; it carries the order out until it burns itself out, and survives crippled.',
    rule: 'Needles overwrite autonomy and turn people into disposable puppets until exhaustion or death.',
    cost: 'One needle per puppet',
    color: '#b6a4d8',
    action: 'Insert a control needle',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    'plant-needle': {
      label: 'Planter une aiguille',
      conditions: [requiresTarget('Une cible est piquée')],
      effects: [
        // Masked: the link is only visible to Gyo and to the omniscient view.
        masked(
          controlLink({
            vector: 'needle',
            mode: 'control',
            attributes: { disposable: true, survivesOwnerAbsence: true },
          }),
        ),
      ],
      cost: { label: 'Corps jetable', amount: 1, unit: 'pantin' },
    },

    reshape: {
      label: 'Remodeler un visage',
      conditions: [requiresTarget('Un visage est remodelé')],
      effects: [
        perceptionMask({
          appearsAs: (ctx) => param(ctx, 'appearsAs'),
          auraDetectable: false,
          attributes: { vector: 'needle', durable: true },
        }),
      ],
      hint: 'Déguisement durable — Gittarackur, infiltration',
    },

    'remove-needle': {
      label: 'Retirer l’aiguille',
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  ui: { componentKey: 'NeedlePuppetView' },

  interactionManifest: buildManifest('illumi-needle-people', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'BODY'],
    overlays: ['CONTROL_LINK', 'AURA'],
    entryActions: ['plant-needle'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'NeedlePuppetView',
  }),
})
