import {
  bodyState,
  buildManifest,
  canUseNen,
  combine,
  defineAbility,
  hypothesis,
  isConscious,
  knowledgeGrant,
  moveEntity,
  object,
  param,
  person,
  requiresParameter,
  requiresTarget,
  shown,
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

  site: {
    kind: 'dowsing',
    instruction:
      'Move the pendulum to track nearby controls, then click text or a section to test its signal for uncertainty and deception.',
    rule: 'The chain combines available evidence, intuition and concentration rather than granting infallible omniscience.',
    cost: 'Sustained concentration and contextual information',
    color: '#8ecae6',
    action: 'Sweep for a target',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person(), object()],

  cost: { label: 'Concentration soutenue et indices de contexte', unit: 'concentration' },

  actions: {
    dowse: {
      label: 'Sonder une position',
      evidence: shown('ch. 369 — Kurapika situe ce qu’il cherche sans le voir'),
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

    'dowse-object': {
      label: 'Sonder un objet',
      evidence: shown('ch. 369 — la chaîne cherche ce qui a été perdu de vue'),
      conditions: [requiresParameter('objectId', 'Un objet est sondé')],
      effects: [
        knowledgeGrant({
          factId: (ctx) => `position:${param(ctx, 'objectId') ?? 'object'}`,
          state: 'BELIEVED',
          confidence: 0.7,
        }),
      ],
    },

    'detect-lie': {
      label: 'Détecter un mensonge',
      evidence: shown('ch. 85-86 — interrogatoire d’Uvogin ; ch. 380 — le pont 1'),
      conditions: [requiresTarget('Un interrogé est visé')],
      effects: [
        knowledgeGrant({
          factId: (ctx) =>
            `lie:${ctx.targets[0] ?? 'unknown'}:${param(ctx, 'statementId') ?? 'statement'}`,
          state: 'KNOWN',
        }),
      ],
    },

    strike: {
      label: 'Parer et frapper',
      // The ring finger is also a weapon: the same chain deflects and hits.
      evidence: shown('ch. 76 — la chaîne pare et frappe pendant le combat'),
      conditions: [requiresTarget('Un adversaire est visé')],
      effects: [bodyState({ state: 'INJURED' })],
      hint: 'Emploi physique de la chaîne, hors divination',
    },

    'dowse-hidden-truth': {
      label: 'Sonder une intention cachée',
      evidence: hypothesis('lire une intention plutôt qu’une position ou un mensonge'),
      effects: [
        knowledgeGrant({
          factId: (ctx) => `intent:${ctx.targets[0] ?? 'unknown'}`,
          state: 'SUSPECTED',
          confidence: 0.4,
        }),
      ],
    },
  },

  ui: { componentKey: 'ChainInteraction' },

  interactionManifest: buildManifest('dowsing-chain', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'LOCATION', 'OBJECT'],
    overlays: ['RANGE'],
    entryActions: ['select-finger'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'ChainInteraction',
  }),
})
