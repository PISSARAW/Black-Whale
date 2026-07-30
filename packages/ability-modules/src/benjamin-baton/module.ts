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

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'La mort du soldat et une loyauté militaire jurée', unit: 'vie' },

  actions: {
    'muster-army': {
      label: 'Constituer l’armée',
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
      conditions: [
        requiresTarget('Un soldat est enrôlé'),
        effectIsLive('effectId', 'L’armée est constituée'),
      ],
      effects: [attributeCounter({ append: (ctx) => ({ memberIds: ctx.targets }) })],
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
