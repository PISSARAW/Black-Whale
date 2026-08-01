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
  requiresParameter,
  spawnNenEntity,
  zone,
  belowCapacity,
  wheelEntry,
} from '@black-whale/ability-sdk'

const OWL_IDS = ['secret-window-owl']

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

  actions: {
    'deploy-wandering': {
      label: 'Hibou Libre',
      conditions: [belowCapacity('secret-window-owls', 1, 'Un seul hibou autorisé à la fois')],
      effects: [
        spawnNenEntity({
          id: OWL_IDS[0]!,
          kind: 'NEN_ENTITY',
          label: `Hibou (Libre)`,
          metadata: { hearsThroughWalls: true, records: true, duration: 20, type: 'wandering' },
        }),
        controlLink({
          vector: 'owl',
          mode: 'listen',
          targets: () => [{ id: OWL_IDS[0]!, kind: 'NEN_ENTITY' }],
        }),
      ],
      cost: { label: 'Hibou libre', amount: 1, unit: 'capacité' },
      hint: 'Se balade librement dans tout le bateau (disparaît après 20s)',
    },

    'deploy-shoulder': {
      label: 'Hibou d\'Épaule',
      conditions: [belowCapacity('secret-window-owls', 1, 'Un seul hibou autorisé à la fois')],
      effects: [
        spawnNenEntity({
          id: OWL_IDS[0]!,
          kind: 'NEN_ENTITY',
          label: `Hibou (Épaule)`,
          metadata: { hearsThroughWalls: true, records: true, duration: 20, type: 'shoulder' },
        }),
        controlLink({
          vector: 'owl',
          mode: 'listen',
          targets: () => [{ id: OWL_IDS[0]!, kind: 'NEN_ENTITY' }],
        }),
      ],
      cost: { label: 'Hibou sur épaule', amount: 1, unit: 'capacité' },
      hint: 'Se pose sur l\'épaule de l\'utilisateur (disparaît après 20s)',
    },

    'deploy-random': {
      label: 'Hibou Aléatoire',
      conditions: [belowCapacity('secret-window-owls', 1, 'Un seul hibou autorisé à la fois')],
      effects: [
        spawnNenEntity({
          id: OWL_IDS[0]!,
          kind: 'NEN_ENTITY',
          label: `Hibou (Aléatoire)`,
          metadata: { hearsThroughWalls: true, records: true, duration: 20, type: 'random' },
        }),
        controlLink({
          vector: 'owl',
          mode: 'listen',
          targets: () => [{ id: OWL_IDS[0]!, kind: 'NEN_ENTITY' }],
        }),
      ],
      cost: { label: 'Hibou aléatoire', amount: 1, unit: 'capacité' },
      hint: 'Apparaît dans un lieu aléatoire (disparaît après 20s)',
    },

    perch: {
      label: 'Poster le hibou',
      conditions: [
        requiresParameter('locationId', 'Une pièce est choisie'),
      ],
      effects: [
        moveEntity({
          entity: () => ({ id: OWL_IDS[0]!, kind: 'NEN_ENTITY' }),
        }),
      ],
    },

    replay: {
      label: 'Revoir les enregistrements',
      conditions: [requiresParameter('owlId', 'Un hibou est choisi')],
      effects: [
        // The replay grants what the owl observed (limited to last 10 seconds), dated to when it observed it:
        // the timeline engine does the rest.
        (ctx) =>
          listParam(ctx, 'recordedFactIds').flatMap((factId) =>
            knowledgeGrant({ factId, state: 'KNOWN' })(ctx).map((event) => ({
              ...event,
              sourceIds: [OWL_IDS[0]!],
              ...(numberParam(ctx, 'recordedAtChapter') === undefined
                ? {}
                : { revealedAtChapter: numberParam(ctx, 'recordedAtChapter') }),
            })),
          ),
      ],
      hint: 'Récupère uniquement les 10 dernières secondes d\'enregistrement avant disparition',
    },
  },

  ui: { componentKey: 'OwlScreenWall' },

  interactionManifest: buildManifest('secret-window', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['LOCATION', 'EVENT'],
    overlays: ['CONTROL_LINK', 'RANGE'],
    entryActions: ['deploy-wandering', 'deploy-shoulder', 'deploy-random'],
    requiredState: ['isConscious', 'canUseNen'],
    perspectiveTransition: {
      canChangeBody: false,
      canChangeConsciousness: false,
      canFollowAura: true,
    },
    customComponent: 'OwlScreenWall',
  }),

  actionWheel: [
    wheelEntry({
      id: 'deploy-wandering',
      label: 'Hibou Libre',
      abilityId: 'secret-window',
      visibility: 'available',
      hint: 'Se balade librement dans tout le bateau (disparaît après 20s)',
    }),
    wheelEntry({
      id: 'deploy-shoulder',
      label: 'Hibou d\'Épaule',
      abilityId: 'secret-window',
      visibility: 'available',
      hint: 'Se pose sur l\'épaule de l\'utilisateur (disparaît après 20s)',
    }),
    wheelEntry({
      id: 'deploy-random',
      label: 'Hibou Aléatoire',
      abilityId: 'secret-window',
      visibility: 'available',
      hint: 'Apparaît dans un lieu aléatoire (disparaît après 20s)',
    }),
    wheelEntry({
      id: 'perch',
      label: 'Poster le hibou',
      abilityId: 'secret-window',
      visibility: 'available',
      hint: 'Déplacer le hibou dans une pièce',
    }),
    wheelEntry({
      id: 'replay',
      label: 'Revoir les enregistrements',
      abilityId: 'secret-window',
      visibility: 'available',
      hint: 'Récupère uniquement les 10 dernières secondes d\'enregistrement',
    }),
  ],
})

export const SECRET_WINDOW_OWL_IDS = OWL_IDS
