import {
  buildManifest,
  canUseNen,
  controlLink,
  defineAbility,
  isConscious,
  knowledgeGrant,
  listParam,
  moveEntity,
  numberParam,
  param,
  requiresParameter,
  spawnNenEntity,
  zone,
} from '@black-whale/ability-sdk'

const OWL_IDS = ['secret-window-owl-1', 'secret-window-owl-2', 'secret-window-owl-3']

/**
 * Secret Window — Musse, then Benjamin
 *
 * Three owls that hear through walls, and a replay that the site already knows
 * how to do: "reviewing the recordings" is a timeline query restricted to what
 * an owl observed. Benjamin's wall of screens is a grid of filtered
 * perspectives, one per owl.
 */
export const secretWindow = defineAbility({
  id: 'secret-window',
  name: 'Secret Window',
  owner: 'musse',
  category: 'conjurer',

  conditions: [canUseNen(), isConscious()],

  targets: [zone()],

  cost: { label: 'Une chouette attachée par cible surveillée', amount: 1, unit: 'chouette' },

  actions: {
    deploy: {
      label: 'Déployer les hiboux',
      effects: [
        ...OWL_IDS.map((owlId, index) =>
          spawnNenEntity({
            id: owlId,
            kind: 'NEN_ENTITY',
            label: `Hibou ${index + 1}`,
            metadata: { hearsThroughWalls: true, records: true },
          }),
        ),
        controlLink({
          vector: 'owl',
          mode: 'listen',
          targets: () => OWL_IDS.map((id) => ({ id, kind: 'NEN_ENTITY' as const })),
        }),
      ],
    },

    perch: {
      label: 'Poster un hibou',
      conditions: [
        requiresParameter('owlId', 'Un hibou est choisi'),
        requiresParameter('locationId', 'Une pièce est choisie'),
      ],
      effects: [
        moveEntity({
          entity: (ctx) => ({ id: param(ctx, 'owlId') ?? OWL_IDS[0]!, kind: 'NEN_ENTITY' }),
        }),
      ],
    },

    replay: {
      label: 'Revoir les enregistrements',
      conditions: [requiresParameter('owlId', 'Un hibou est choisi')],
      effects: [
        // The replay grants what the owl observed, dated to when it observed it:
        // the timeline engine does the rest.
        (ctx) =>
          listParam(ctx, 'recordedFactIds').flatMap((factId) =>
            knowledgeGrant({ factId, state: 'KNOWN' })(ctx).map((event) => ({
              ...event,
              sourceIds: [param(ctx, 'owlId') ?? OWL_IDS[0]!],
              ...(numberParam(ctx, 'recordedAtChapter') === undefined
                ? {}
                : { revealedAtChapter: numberParam(ctx, 'recordedAtChapter') }),
            })),
          ),
      ],
    },
  },

  ui: { componentKey: 'OwlScreenWall' },

  interactionManifest: buildManifest('secret-window', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['LOCATION', 'EVENT'],
    overlays: ['CONTROL_LINK', 'RANGE'],
    entryActions: ['deploy'],
    requiredState: ['isConscious', 'canUseNen'],
    perspectiveTransition: {
      canChangeBody: false,
      canChangeConsciousness: false,
      canFollowAura: true,
    },
    customComponent: 'OwlScreenWall',
  }),
})

export const SECRET_WINDOW_OWL_IDS = OWL_IDS
