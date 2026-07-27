import {
  buildManifest,
  canUseNen,
  combine,
  defineAbility,
  isConscious,
  knowledgeGrant,
  moveEntity,
  param,
  person,
  requiresTarget,
} from '@black-whale/ability-sdk'

/**
 * Dowsing Chain — Kurapika, ring finger
 *
 * The one chain that changes nothing physical: its whole output is knowledge.
 * A dowse produces a *probable* position, never a confirmed one; a lie test
 * produces a fact about somebody else's statement.
 */
export const dowsingChain = defineAbility({
  id: 'dowsing-chain',
  name: 'Dowsing Chain',
  owner: 'kurapika',
  category: 'conjurer',

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    dowse: {
      label: 'Sonder une position',
      conditions: [requiresTarget('Une cible est sondée')],
      effects: [
        combine(
          knowledgeGrant({
            factId: (ctx) => `position:${ctx.targets[0] ?? 'unknown'}`,
            state: 'BELIEVED',
            confidence: 0.7,
          }),
          // The pendulum narrows a zone; it never points at a room.
          moveEntity({ precision: 'ZONE', certainty: 'PROBABLE', probability: 0.7 }),
        ),
      ],
    },

    'detect-lie': {
      label: 'Détecter un mensonge',
      conditions: [requiresTarget('Un interrogé est visé')],
      effects: [
        knowledgeGrant({
          factId: (ctx) =>
            `lie:${ctx.targets[0] ?? 'unknown'}:${param(ctx, 'statementId') ?? 'statement'}`,
          state: 'KNOWN',
        }),
      ],
    },
  },

  ui: { componentKey: 'ChainInteraction' },

  interactionManifest: buildManifest('dowsing-chain', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'LOCATION'],
    overlays: ['RANGE'],
    entryActions: ['select-finger'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'ChainInteraction',
  }),
})
