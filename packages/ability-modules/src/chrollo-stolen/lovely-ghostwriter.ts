import {
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  knowledgeGrant,
  numberParam,
  person,
  requiresTarget,
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
    predict: {
      label: 'Écrire la prédiction',
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
