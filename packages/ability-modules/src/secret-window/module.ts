import {
  asserted,
  belowCapacity,
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
  shown,
  spawnNenEntity,
  zone,
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

  site: {
    kind: 'surveillance',
    instruction:
      'Attach one owl to a map character to retain a live feed and expose movement or death recorded in the next chapter. Press R to choose which owl is sent: working the ship, on your shoulder, or let go unaimed.',
    rule: 'The owl eavesdrops through barriers, follows by touch and retains earlier footage for later review.',
    cost: 'One attached surveillance owl',
    color: '#a8b7d8',
    action: 'Attach the owl',
  },

  arena: {
    effect: 'enhance',
    cost: 8,
    persistent: true,
    condition: 'attach-owl-to-target',
    risk: 'observer-is-exposed',
    mechanic: 'surveillance',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [zone()],

  actions: {
    'deploy-wandering': {
      label: 'Hibou Libre',
      evidence: shown('ch. 363 — le hibou qui va où il veut'),
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
      label: "Hibou d'Épaule",
      evidence: shown('ch. 363 — le hibou posté sur l’épaule'),
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
      hint: "Se pose sur l'épaule de l'utilisateur (disparaît après 20s)",
    },

    'deploy-random': {
      label: 'Hibou Aléatoire',
      evidence: shown('ch. 363 — le hibou qui surgit ailleurs'),
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
      evidence: shown('ch. 363 — le hibou écoute à travers la cloison'),
      conditions: [requiresParameter('locationId', 'Une pièce est choisie')],
      effects: [
        moveEntity({
          entity: () => ({ id: OWL_IDS[0]!, kind: 'NEN_ENTITY' }),
        }),
      ],
    },

    replay: {
      label: 'Revoir les enregistrements',
      evidence: shown('ch. 363 — les observations revues après coup'),
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
      hint: "Récupère uniquement les 10 dernières secondes d'enregistrement avant disparition",
    },

    'deploy-second-owl': {
      label: 'Déployer un deuxième hibou',
      refusal: 'Un seul hibou tient l’air à la fois : il faut attendre sa disparition',
      evidence: asserted('la capacité en compte trois, jamais deux en vol'),
    },

    'replay-beyond-the-window': {
      label: 'Remonter plus loin que la fenêtre',
      refusal: 'L’enregistrement ne rend que ses dix dernières secondes',
      evidence: shown('ch. 363 — la fenêtre d’écoute est courte'),
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

  // No static wheel: it is derived from the actions above, so a use that is
  // added — or refused — can never be missing from the wheel.
})

export const SECRET_WINDOW_OWL_IDS = OWL_IDS
