import {
  asserted,
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  knowledgeGrant,
  numberParam,
  person,
  requiresTarget,
  shown,
  unrevealed,
} from '@black-whale/ability-sdk'

/**
 * Lovely Ghostwriter — stolen from Neon Nostrade
 *
 * Predictions in verse, for a page that no longer works: Neon lost her ability,
 * so the sheet is historical. Modelling the loss is the point — the catalogue
 * should show what a hatsu *was*, dated.
 */
export const lovelyGhostwriter = defineAbility({
  id: 'lovely-ghostwriter',
  name: 'Lovely Ghostwriter',
  owner: 'chrollo-lucilfer',
  category: 'specialist',

  site: {
    kind: 'prophecy',
    instruction:
      'Select a subject carrying a name, a date and a type; the first quatrain is always its past, and the foretold links become routes.',
    rule: 'Automatic writing predicts the target’s immediate future in cryptic verse while hiding their own prophecy from them.',
    cost: 'Target information and written medium',
    color: '#d8c7ed',
    action: 'Choose a subject for prophecy',
  },

  conditions: [canUseNen()],

  notes: [
    unrevealed(
      'ghostwriter-loss',
      'Capacité perdue par Neon ; la page ne fonctionne plus (date exacte non révélée)',
    ),
  ],

  targets: [person()],

  cost: { label: 'Des informations sur la cible et un support écrit', unit: 'page' },

  actions: {
    'read-the-poem': {
      label: 'Lire la prédiction',
      // The poem is the interface: what it says is a belief, never a fact, and
      // the site has to keep that difference visible.
      evidence: shown('ch. 143 — le poème se lit, il ne se prouve pas'),
      conditions: [requiresTarget('Un sujet est visé')],
      effects: [
        knowledgeGrant({
          factId: (ctx) => `prophecy-read:${ctx.targets[0] ?? 'subject'}`,
          state: 'BELIEVED',
          confidence: 0.8,
        }),
      ],
    },

    'predict-on-demand': {
      label: 'Prédire à la demande',
      refusal: 'Les poèmes arrivent quand ils arrivent : la capacité ne se commande pas',
      evidence: asserted('les prédictions couvrent le mois, sans requête'),
    },

    'use-after-neons-loss': {
      label: 'Employer la capacité aujourd’hui',
      refusal: 'La capacité a disparu avec sa propriétaire : la fiche est historique',
      evidence: shown('ch. 143 — la capacité est perdue lorsqu’elle est volée'),
    },

    predict: {
      label: 'Écrire la prédiction',
      evidence: shown('ch. 143 — les prédictions en quatrains'),
      conditions: [requiresTarget('Un sujet est visé')],
      effects: [
        knowledgeGrant({
          factId: (ctx) => `prophecy:${ctx.targets[0] ?? 'subject'}`,
          state: 'BELIEVED',
          confidence: 0.8,
        }),
        effect({
          kind: 'CUSTOM',
          discriminator: 'prophecy',
          attributes: (ctx) => ({
            form: 'poem',
            coversMonths: numberParam(ctx, 'coversMonths') ?? 1,
            subjectId: ctx.targets[0],
          }),
        }),
      ],
    },
  },

  ui: { componentKey: 'ProphecyPoem' },

  interactionManifest: buildManifest('lovely-ghostwriter', {
    inputMode: 'CUSTOM',
    allowedTargets: ['CHARACTER', 'EVENT', 'LOCATION'],
    overlays: ['FUTURE'],
    entryActions: ['predict'],
    requiredState: ['canUseNen'],
    customComponent: 'ProphecyPoem',
  }),
})
