import {
  buildManifest,
  canUseNen,
  constraint,
  controlLink,
  defineAbility,
  effect,
  isConscious,
  knowledgeGrant,
  listParam,
  masked,
  param,
  person,
  requiresParameter,
  requiresTarget,
  setEffectState,
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

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    plant: {
      label: 'Poser une poupée',
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

    dismiss: {
      label: 'Retirer la poupée',
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

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    mark: {
      label: 'Marquer de confettis',
      conditions: [requiresTarget('Une cible est marquée')],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'confetti',
          attributes: { marker: 'confetti', guidesAttacks: true },
        }),
      ],
    },

    strike: {
      label: 'Frapper',
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
    allowedTargets: ['CHARACTER', 'LOCATION'],
    overlays: ['TRAJECTORY', 'RANGE'],
    entryActions: ['mark'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'ConfettiMarkers',
  }),
})
