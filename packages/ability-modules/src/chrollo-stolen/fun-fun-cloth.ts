import {
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  effectIsLive,
  isConscious,
  moveEntity,
  object,
  person,
  requiresTarget,
  setEffectState,
  shown,
} from '@black-whale/ability-sdk'

/**
 * Fun Fun Cloth — stolen from Owl
 *
 * Transport of an entity by another entity: whatever is wrapped leaves the
 * board — `containedIn` rather than a position — and comes back intact
 * elsewhere. Canonically used to carry corpses off the sumo arena.
 */
export const funFunCloth = defineAbility({
  id: 'fun-fun-cloth',
  name: 'Fun Fun Cloth',
  owner: 'chrollo-lucilfer',
  category: 'conjurer',

  site: {
    kind: 'pocket',
    instruction:
      'Click any section to wrap it down to a palm-sized bundle; click the bundle to let it back out at full size, undamaged.',
    rule: 'Anything wrapped by the cloth is reduced and stored without damage.',
    cost: 'Stored targets remain bound',
    color: '#d9d1bd',
    action: 'Wrap and shrink a section',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person(), object()],

  cost: { label: 'Les cibles rangées restent prisonnières du tissu', unit: 'aura' },

  actions: {
    wrap: {
      label: 'Envelopper',
      evidence: shown('ch. 372 — les corps emportés hors de l’arène'),
      conditions: [requiresTarget('Une cible est enveloppée')],
      effects: [
        effect({
          kind: 'CONSTRAINT',
          discriminator: 'wrapped',
          attributes: (ctx) => ({
            containedIn: `fun-fun-cloth:${ctx.actorId}`,
            miniaturised: true,
            rules: ['La cible est miniaturisée et restituée intacte.'],
          }),
        }),
      ],
    },

    'carry-away': {
      label: 'Emporter le paquet',
      // Transport of an entity by an entity: the target leaves the board and
      // comes back somewhere else, intact.
      evidence: shown('ch. 372 — ce qui est enveloppé quitte la scène avec Chrollo'),
      conditions: [effectIsLive('effectId', 'Une cible est enveloppée')],
      effects: [
        moveEntity({
          entity: (ctx) => ctx.actor ?? { id: ctx.actorId, kind: 'CHARACTER' },
          certainty: 'CONFIRMED',
        }),
      ],
    },

    'damage-the-contents': {
      label: 'Abîmer ce qui est enveloppé',
      refusal: 'Ce que le tissu rend, il le rend intact : il transporte, il ne détruit pas',
    },

    unwrap: {
      label: 'Déballer',
      evidence: shown('ch. 372 — la restitution intacte'),
      conditions: [effectIsLive('effectId', 'Une cible est enveloppée')],
      effects: [
        setEffectState({ state: 'ENDED' }),
        moveEntity({ certainty: 'CONFIRMED', precision: 'EXACT_ROOM' }),
      ],
    },
  },

  ui: { componentKey: 'ContainerView' },

  interactionManifest: buildManifest('fun-fun-cloth', {
    inputMode: 'DRAG',
    allowedTargets: ['CHARACTER', 'BODY', 'OBJECT'],
    overlays: ['RANGE'],
    entryActions: ['wrap'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'ContainerView',
  }),
})
