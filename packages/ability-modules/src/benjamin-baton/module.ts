import {
  attributeCounter,
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  effectIsLive,
  isConscious,
  listParam,
  person,
  requiresTarget,
  shown,
  spawnNenEntity,
} from '@black-whale/ability-sdk'

const COHORT_ID = 'benjamin-army'

/**
 * Benjamin Baton — Prince Benjamin
 *
 * The dark mirror of Skill Hunter: two collectors, two mechanics, the same
 * primitive. Benjamin does not steal — he inherits, and only from loyalists who
 * graduated from the military academy.
 *
 * The inheritance itself is a world-engine invariant, not an action anybody has
 * to remember to trigger: the ABILITY_GRANT effect below declares `inheritTo`
 * and the roster, and any member's death hands their abilities over. That is
 * what makes Benjamin's sheet fill itself as his army is whittled down.
 */
export const benjaminBaton = defineAbility({
  id: 'benjamin-baton',
  name: 'Benjamin Baton',
  owner: 'prince-benjamin',
  category: 'specialist',

  site: {
    kind: 'inherit',
    instruction:
      'Select deceased loyal soldiers on the map to awaken palm stars and activate their registered Hatsu from the inheritance panel.',
    rule: 'Only deceased loyal Military Academy graduates transfer abilities; active powers remain under Benjamin’s ownership.',
    cost: 'Death and sworn military loyalty',
    color: '#ffd166',
    action: 'Identify an eligible soldier',
  },

  arena: {
    effect: 'enhance',
    cost: 12,
    persistent: true,
    condition: 'deceased-loyal-soldier',
    risk: 'fixed-inherited-loadout',
    mechanic: 'inheritance',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'La mort du soldat et une loyauté militaire jurée', unit: 'vie' },

  actions: {
    'muster-army': {
      label: 'Constituer l’armée',
      evidence: shown('ch. 361 — les quatre étoiles dans la paume, l’armée derrière'),
      effects: [
        spawnNenEntity({ id: COHORT_ID, kind: 'COHORT', label: 'Armée de Benjamin' }),
        effect({
          kind: 'ABILITY_GRANT',
          discriminator: 'baton',
          targets: () => [{ id: COHORT_ID, kind: 'COHORT' }],
          attributes: (ctx) => ({
            cohortId: COHORT_ID,
            // Read by the reducer: any death among these members feeds the heir.
            inheritTo: ctx.actorId,
            memberIds: listParam(ctx, 'memberIds'),
            rules: [
              'Hérite à la mort d’un loyaliste diplômé de l’académie militaire.',
              'Quatre étoiles dans la paume.',
              'Une capacité active continue sous son contrôle même volée ou perdue.',
            ],
          }),
        }),
      ],
    },

    enlist: {
      label: 'Enrôler un soldat',
      evidence: shown('ch. 361 — les loyalistes diplômés de l’académie'),
      conditions: [
        requiresTarget('Un soldat est enrôlé'),
        effectIsLive('effectId', 'L’armée est constituée'),
      ],
      effects: [attributeCounter({ append: (ctx) => ({ memberIds: ctx.targets }) })],
    },

    'inherit-on-death': {
      label: 'Hériter à la mort d’un soldat',
      // There is nothing to click: the reducer does this on BODY_STATE_CHANGED.
      // The entry exists so the wheel says who pays for the inheritance.
      refusal: 'L’héritage est automatique : il vient de la mort d’un homme, pas d’un geste',
      evidence: shown('ch. 385 — la mort de Vincent, et Air Blow change de main'),
    },

    'enlist-a-civilian': {
      label: 'Enrôler quelqu’un hors de l’académie',
      refusal: 'L’héritage ne prend que sur un loyaliste diplômé de l’académie militaire',
      evidence: shown('ch. 361 — la condition énoncée avec la capacité'),
    },
  },

  ui: { componentKey: 'BatonRoster' },

  interactionManifest: buildManifest('benjamin-baton', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER'],
    overlays: ['CONTROL_LINK'],
    entryActions: ['muster-army'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'BatonRoster',
  }),
})

export const BENJAMIN_ARMY_COHORT_ID = COHORT_ID
