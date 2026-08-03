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
  asserted,
  shown,
  hypothesis,
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

  arena: {
    effect: 'bind',
    cost: 18,
    persistent: true,
    condition: 'anchor-or-contact',
    risk: 'tether-counterforce',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person(), object(), surface(), self()],

  interactions: [attach(), stretch(), retract(), detach(), release()],

  effects: [elasticConnection()],

  actions: {
    attach: {
      label: 'Attacher',
      evidence: shown('ch. 39 — le filament attaché à distance'),
      conditions: [requiresTarget('Un point d’ancrage est visé')],
      effects: [elasticConnection()],
    },

    'set-trap': {
      label: 'Poser un piège (In)',
      evidence: shown('ch. 359 — le piège posé et attendu'),
      gyo: 'le filament tendu en travers du passage, et son point d’ancrage',
      conditions: [requiresTarget('Une surface est visée')],
      // Real, invisible, and only revealed by the Gyo toggle.
      effects: [masked(elasticConnection())],
      hint: 'Visible uniquement en Gyo ou en mode omniscient',
    },

    detach: {
      label: 'Détacher le filament',
      evidence: shown('ch. 39 — le filament séparé du corps rompt au-delà de dix mètres'),
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
      evidence: shown('ch. 357 — cœur et poumons reprogrammés avant la mort'),
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
      evidence: shown('ch. 176 — les cartes et les projectiles renvoyés'),
      conditions: [requiresTarget('Un projectile ou attaque physique est visé')],
      effects: [elasticConnection()],
      hint: "Utilise l'élasticité pour renvoyer une attaque",
    },

    propulsion: {
      label: 'Propulsion',
      evidence: shown('ch. 39 — Hisoka se tire vers son ancrage'),
      conditions: [requiresTarget('Un point d’ancrage solide')],
      effects: [elasticConnection()],
      hint: 'Se propulser à grande vitesse',
    },

    'false-tissue': {
      label: 'Faux tissu',
      evidence: shown('ch. 357 — les plaies refermées pendant le combat'),
      // Worked on himself, so there is nothing to require of a target: `self()`
      // is one of the ability's targets, not a condition on this mode.
      effects: [bodyState({ state: 'STABILIZED' })],
      hint: "Stoppe l'hémorragie et referme les blessures",
    },

    'wall-run': {
      label: 'Courir sur les murs',
      evidence: asserted('la capacité sert aussi à se coller aux surfaces'),
      effects: [elasticConnection()],
    },

    'attach-to-aura': {
      label: 'Attacher à l’aura d’autrui',
      refusal: 'Bungee Gum prend sur une surface, un corps ou un objet — pas sur une aura',
    },

    'ko-strike': {
      label: 'Frapper en Ko',
      evidence: hypothesis('Bungee Gum concentré en Ko sur un seul point'),
      effects: [elasticConnection()],
    },

    release: {
      label: 'Relâcher',
      evidence: asserted('ce qui est attaché se détache à volonté'),
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

  // No static wheel: the derived one is built from the actions above, so an
  // added use can never be missing from the wheel that offers it.
})
