import {
  asserted,
  bodyState,
  buildManifest,
  canUseNen,
  constraint,
  controlLink,
  defineAbility,
  effect,
  hypothesis,
  isConscious,
  knowledgeGrant,
  listParam,
  masked,
  param,
  perceptionMask,
  person,
  requiresParameter,
  requiresTarget,
  setEffectState,
  shown,
  spawnNenEntity,
} from '@black-whale/ability-sdk'

const dollId = (targetId: string): string => `kalluto-doll-${targetId}`

/**
 * Surveillance Paper Dolls — Kalluto Zoldyck
 *
 * An undetectable listening post. What it changes on the site is provenance: in
 * the Troupe's perspective, facts start arriving "via Kalluto", and the UI can
 * finally answer how the Spiders know what they know.
 */
export const surveillancePaperDolls = defineAbility({
  id: 'surveillance-paper-dolls',
  name: 'Surveillance Paper Dolls',
  owner: 'kalluto-zoldyck',
  category: 'manipulator',

  site: {
    kind: 'paper-spy',
    instruction:
      'Attach paper dolls to sections; they count and report every DOM change occurring inside their target.',
    rule: 'Tiny paper figures eavesdrop remotely and relay activity to their user.',
    cost: 'One paper observer per area',
    color: '#efb9c8',
    action: 'Deploy a paper observer',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Une figurine de papier par zone écoutée', amount: 1, unit: 'figurine/zone' },

  actions: {
    plant: {
      label: 'Poser une poupée',
      evidence: shown('ch. 358 — la poupée posée là où l’on parle'),
      conditions: [requiresTarget('Une cible est suivie')],
      effects: [
        spawnNenEntity({
          id: (ctx) => dollId(ctx.targets[0] ?? 'target'),
          kind: 'NEN_ENTITY',
          label: 'Poupée de papier',
          metadata: { undetectable: true },
        }),
        // Listening, never controlling: the distinction matters for the action
        // wheel, since the target keeps their own agency.
        masked(controlLink({ vector: 'paper-doll', mode: 'listen' })),
      ],
    },

    report: {
      label: 'Écouter',
      evidence: shown('ch. 358 — Kalluto rapporte ce que la poupée a entendu'),
      conditions: [requiresParameter('locationId', 'Une pièce est écoutée')],
      effects: [
        (ctx) =>
          listParam(ctx, 'overheardFactIds').flatMap((factId) =>
            knowledgeGrant({ factId, state: 'KNOWN' })(ctx).map((event) => ({
              ...event,
              // Provenance, so the site can say "heard by Kalluto's doll".
              sourceIds: [dollId(ctx.targets[0] ?? 'target')],
            })),
          ),
      ],
    },

    'plant-on-a-person': {
      label: 'Poser la poupée sur quelqu’un',
      evidence: asserted('la figurine suit une cible aussi bien qu’une pièce'),
      conditions: [requiresTarget('Une personne est suivie')],
      effects: [controlLink({ vector: 'paper-doll', mode: 'listen' })],
    },

    'act-through-the-doll': {
      label: 'Agir par la poupée',
      refusal: 'La poupée écoute : elle ne frappe pas et ne déplace rien',
    },

    dismiss: {
      label: 'Retirer la poupée',
      evidence: asserted('la figurine se reprend sans laisser de trace'),
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  ui: { componentKey: 'PaperDollSurveillance' },

  interactionManifest: buildManifest('surveillance-paper-dolls', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'LOCATION'],
    overlays: ['CONTROL_LINK', 'RANGE'],
    entryActions: ['plant'],
    requiredState: ['isConscious', 'canUseNen'],
    perspectiveTransition: {
      canChangeBody: false,
      canChangeConsciousness: false,
      canFollowAura: true,
    },
    customComponent: 'PaperDollSurveillance',
  }),
})

/**
 * Dance of the Serpent's Bite — Kalluto Zoldyck
 *
 * Confetti that marks before it cuts. The marker is an effect in its own right,
 * so a target can be tagged long before anything happens to them.
 */
export const danceOfTheSerpentsBite = defineAbility({
  id: 'dance-of-the-serpents-bite',
  name: "Dance of the Serpent's Bite",
  owner: 'kalluto-zoldyck',
  category: 'manipulator',

  site: {
    kind: 'shred',
    instruction:
      'The first confetti sticks at the exact point you click; every volley after that converges on that same wound, wherever you aim.',
    rule: 'A fan controls razor paper confetti capable of tracking and cutting a chosen target.',
    cost: 'Sustained paper swarm',
    color: '#f1a7bb',
    action: 'Begin the paper dance',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Essaim de papier maintenu à l’éventail', unit: 'aura' },

  actions: {
    mark: {
      label: 'Marquer de confettis',
      evidence: shown('ch. 358 — les confettis déposés avant la frappe'),
      conditions: [requiresTarget('Une cible est marquée')],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'confetti',
          attributes: { marker: 'confetti', guidesAttacks: true },
        }),
      ],
    },

    'swarm-blade': {
      label: 'Frapper en nuée',
      evidence: shown('ch. 358 — l’essaim de papier tranche'),
      conditions: [requiresTarget('Une cible est prise dans la nuée')],
      effects: [bodyState({ state: 'INJURED' })],
    },

    'screen-with-confetti': {
      label: 'Masquer un déplacement',
      evidence: hypothesis('la nuée employée comme rideau plutôt que comme lame'),
      effects: [perceptionMask({ attributes: { screen: 'confetti' } })],
    },

    strike: {
      label: 'Frapper',
      evidence: shown('ch. 358 — la cible marquée est atteinte'),
      conditions: [requiresTarget('Une cible marquée est frappée')],
      effects: [
        constraint({
          rules: ['Les confettis guident l’attaque vers la cible marquée.'],
          attributes: (ctx) => ({ markerId: param(ctx, 'effectId') }),
        }),
      ],
    },
  },

  ui: { componentKey: 'ConfettiMarkers' },

  interactionManifest: buildManifest('dance-of-the-serpents-bite', {
    inputMode: 'DRAW',
    allowedTargets: ['CHARACTER', 'LOCATION', 'OBJECT'],
    overlays: ['TRAJECTORY', 'RANGE'],
    entryActions: ['mark'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'ConfettiMarkers',
  }),
})
