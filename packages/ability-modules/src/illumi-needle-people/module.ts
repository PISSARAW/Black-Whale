import {
  buildManifest,
  canUseNen,
  controlLink,
  defineAbility,
  effectIsLive,
  isConscious,
  masked,
  param,
  perceptionMask,
  person,
  requiresTarget,
  setEffectState,
  shown,
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

  arena: {
    effect: 'bind',
    cost: 18,
    persistent: true,
    condition: 'needle-contact-and-order',
    risk: 'consumes-target',
    mechanic: 'manipulation',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    'plant-needle': {
      label: 'Planter une aiguille',
      evidence: shown('ch. 288 — l’aiguille plantée, le corps devient jetable'),
      gyo: 'l’aiguille et le lien de contrôle qui remonte vers Illumi',
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
      evidence: shown('ch. 43 — Gittarackur, le visage tenu par les aiguilles'),
      gyo: 'les aiguilles qui tiennent le visage en place',
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

    'order-in-advance': {
      label: 'Laisser une consigne à retardement',
      // The needle keeps its order without Illumi in the room, which is what
      // makes his puppets a threat on a ship he is not standing on.
      evidence: shown('ch. 288 — la consigne tient sans lui'),
      conditions: [effectIsLive('effectId', 'Une aiguille est plantée')],
      effects: [
        setEffectState({
          state: 'ACTIVE',
          attributes: (ctx) => ({ standingOrder: param(ctx, 'order'), unattended: true }),
        }),
      ],
    },

    'control-without-a-needle': {
      label: 'Contrôler sans planter d’aiguille',
      refusal: 'Le contrôle passe par l’aiguille : sans elle, il n’y a pas de pantin',
    },

    'remove-needle': {
      label: 'Retirer l’aiguille',
      evidence: shown('ch. 288 — l’aiguille retirée rend le corps à lui-même'),
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
