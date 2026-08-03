import {
  buildManifest,
  canUseNen,
  defineAbility,
  detach,
  elasticConnection,
  isConscious,
  masked,
  maxDistance,
  object,
  param,
  person,
  postMortem,
  release,
  requiresTarget,
  retract,
  self,
  setEffectState,
  stretch,
  surface,
  attach,
  wheelEntry,
  bodyState,
} from '@black-whale/ability-sdk'

/**
 * Bungee Gum — Hisoka Morrow
 *
 * His Nen has properties of both rubber and gum.
 * Can be attached to any target and used to stretch, retract, and rebound.
 *
 * Interaction grammar (section 17):
 *   1. Select an anchor point (DRAG origin)
 *   2. Pull the filament toward a target
 *   3. Attach to a second point
 *   4. Adjust tension
 *   5. Release or retract
 *
 * The three canonical limits the module enforces rather than describes:
 *   - a filament separated from the body snaps past ten metres;
 *   - concealed with In it is invisible to every perspective but Gyo;
 *   - programmed before death it keeps working afterwards (ch. 357).
 */
export const bungeeGum = defineAbility({
  id: 'bungee-gum',
  name: 'Bungee Gum',
  owner: 'hisoka',
  category: 'transmuter',

  site: {
    kind: 'elastic',
    instruction:
      'Link map characters within emitted range; click a linked target again to retract every filament toward the first anchor.',
    rule: 'Elastic force rises with tension, emitted strands snap beyond ten meters and five seconds of stillness isolates linked targets.',
    cost: 'Continuous aura · range and increasing tension',
    color: '#f06bb5',
    action: 'Attach the first filament',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person(), object(), surface(), self()],

  interactions: [attach(), stretch(), retract(), detach(), release()],

  effects: [elasticConnection()],

  actions: {
    attach: {
      label: 'Attacher',
      conditions: [requiresTarget('Un point d’ancrage est visé')],
      effects: [elasticConnection()],
    },

    'set-trap': {
      label: 'Poser un piège (In)',
      conditions: [requiresTarget('Une surface est visée')],
      // Real, invisible, and only revealed by the Gyo toggle.
      effects: [masked(elasticConnection())],
      hint: 'Visible uniquement en Gyo ou en mode omniscient',
    },

    detach: {
      label: 'Détacher le filament',
      // Separated from his body, the filament breaks past ten metres.
      conditions: [maxDistance(10)],
      effects: [
        setEffectState({
          state: 'ACTIVE',
          attributes: { detached: true, maxDistanceMeters: 10 },
        }),
      ],
    },

    'program-post-mortem': {
      label: 'Programmer post-mortem',
      effects: [
        postMortem((ctx) =>
          elasticConnection()(ctx).map((event) =>
            event.type === 'EFFECT_CREATED'
              ? {
                  ...event,
                  payload: {
                    effect: {
                      ...event.payload.effect,
                      attributes: {
                        ...event.payload.effect.attributes,
                        organ: param(ctx, 'organ') ?? 'heart',
                        purpose: 'resuscitation',
                      },
                    },
                  },
                }
              : event,
          ),
        ),
      ],
      cost: { label: 'Aura maintenue après la mort', unit: 'aura' },
      hint: 'Cœur, poumons, prothèses — actif après la mort de Hisoka (ch. 357)',
    },

    rebound: {
      label: 'Renvoi',
      conditions: [requiresTarget('Un projectile ou attaque physique est visé')],
      effects: [elasticConnection()],
      hint: "Utilise l'élasticité pour renvoyer une attaque",
    },

    propulsion: {
      label: 'Propulsion',
      conditions: [requiresTarget('Un point d’ancrage solide')],
      effects: [elasticConnection()],
      hint: 'Se propulser à grande vitesse',
    },

    'false-tissue': {
      label: 'Faux tissu',
      // Worked on himself, so there is nothing to require of a target: `self()`
      // is one of the ability's targets, not a condition on this mode.
      effects: [bodyState({ state: 'STABILIZED' })],
      hint: "Stoppe l'hémorragie et referme les blessures",
    },

    release: {
      label: 'Relâcher',
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  ui: { componentKey: 'BungeeGumInteraction' },

  interactionManifest: buildManifest('bungee-gum', {
    inputMode: 'DRAG',
    allowedTargets: ['CHARACTER', 'OBJECT', 'LOCATION'],
    overlays: ['AURA', 'TENSION'],
    entryActions: ['select-anchor'],
    requiredState: ['isConscious', 'canUseNen'],
    perspectiveTransition: {
      canChangeBody: false,
      canChangeConsciousness: false,
      canFollowAura: false,
    },
    customComponent: 'BungeeGumInteraction',
  }),

  actionWheel: [
    wheelEntry({
      id: 'attach',
      label: 'Attacher',
      abilityId: 'bungee-gum',
      visibility: 'available',
    }),
    wheelEntry({
      id: 'set-trap',
      label: 'Poser un piège (In)',
      abilityId: 'bungee-gum',
      visibility: 'available',
      hint: 'Invisible sauf en Gyo',
    }),
    wheelEntry({
      id: 'stretch',
      label: 'Étirer',
      abilityId: 'bungee-gum',
      visibility: 'locked',
      hint: "Requiert un point d'ancrage actif",
    }),
    wheelEntry({
      id: 'retract',
      label: 'Rétracter',
      abilityId: 'bungee-gum',
      visibility: 'locked',
      hint: 'Requiert un filament tendu',
    }),
    wheelEntry({
      id: 'detach',
      label: 'Détacher',
      abilityId: 'bungee-gum',
      visibility: 'locked',
      hint: 'Rompt au-delà de 10 m une fois séparé du corps',
    }),
    wheelEntry({
      id: 'program-post-mortem',
      label: 'Programmer post-mortem',
      abilityId: 'bungee-gum',
      visibility: 'warning',
      hint: 'Survit à la mort de Hisoka',
    }),
    wheelEntry({
      id: 'rebound',
      label: 'Renvoi',
      abilityId: 'bungee-gum',
      visibility: 'available',
      hint: 'Renvoie projectiles ou attaques',
    }),
    wheelEntry({
      id: 'propulsion',
      label: 'Propulsion',
      abilityId: 'bungee-gum',
      visibility: 'available',
      hint: 'Déplacement à grande vitesse',
    }),
    wheelEntry({
      id: 'false-tissue',
      label: 'Faux tissu',
      abilityId: 'bungee-gum',
      visibility: 'available',
      hint: 'Stoppe les saignements',
    }),
    wheelEntry({
      id: 'release',
      label: 'Relâcher',
      abilityId: 'bungee-gum',
      visibility: 'available',
    }),
  ],
})
