import {
  asserted,
  buildManifest,
  canUseNen,
  constraint,
  defineAbility,
  effect,
  isConscious,
  numberParam,
  person,
  requiresTarget,
  setEffectState,
  shown,
  spawnNenEntity,
} from '@black-whale/ability-sdk'

/**
 * Priest's staff — Saiyu
 *
 * A staff of variable length, used as readily to hold an ally back as to finish
 * an opponent. The dual use is worth keeping as two actions: the Zodiacs
 * restrain far more often than they kill.
 */
export const saiyuPriestStaff = defineAbility({
  id: 'saiyu-priest-staff',
  name: 'Priest Staff',
  owner: 'saiyu',
  category: 'conjurer',

  site: {
    kind: 'staff',
    instruction:
      'Plant the staff and lengthen it: every thrust reaches one body further out along the row.',
    rule: 'The conjured staff extends and strikes with force at close or mid range.',
    cost: 'One controlled staff',
    color: '#d5a94f',
    action: 'Plant the staff',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Un seul bâton tenu et contrôlé', amount: 1, unit: 'bâton' },

  actions: {
    conjure: {
      label: 'Matérialiser le bâton',
      evidence: shown({ kind: 'chapter', chapter: 349, label: 'ch. 349 — le bâton matérialisé' }),
      effects: [
        spawnNenEntity({
          id: (ctx) => `saiyu-staff-${ctx.actorId}`,
          kind: 'CONSTRUCT',
          label: 'Bâton du prêtre',
          metadata: { lengthIsVariable: true },
        }),
      ],
    },

    'lengthen-the-staff': {
      label: 'Allonger le bâton',
      evidence: shown({
        kind: 'chapter',
        chapter: 349,
        label: 'ch. 349 — la longueur est ce qui se règle',
      }),
      effects: [
        constraint({
          rules: ['La longueur du bâton se règle à volonté.'],
          attributes: (ctx) => ({ lengthMeters: numberParam(ctx, 'lengthMeters') }),
        }),
      ],
    },

    restrain: {
      label: 'Retenir un allié',
      evidence: shown({
        kind: 'chapter',
        chapter: 349,
        label: 'ch. 349 — le bâton retient sans blesser',
      }),
      conditions: [requiresTarget('Un allié est retenu')],
      effects: [
        constraint({
          rules: ['Le bâton immobilise sans blesser.'],
          attributes: (ctx) => ({ lengthMeters: numberParam(ctx, 'lengthMeters') }),
        }),
      ],
    },

    strike: {
      label: 'Frapper à distance',
      evidence: shown({
        kind: 'chapter',
        chapter: 349,
        label: 'ch. 349 — le bâton s’allonge jusqu’à la cible',
      }),
      conditions: [requiresTarget('Un adversaire est frappé')],
      effects: [
        constraint({
          rules: ['Le bâton s’allonge pour atteindre une cible éloignée.'],
          attributes: (ctx) => ({ lengthMeters: numberParam(ctx, 'lengthMeters'), lethal: true }),
        }),
      ],
    },
  },

  ui: { componentKey: 'StaffView' },

  interactionManifest: buildManifest('saiyu-priest-staff', {
    inputMode: 'DRAG',
    allowedTargets: ['CHARACTER', 'BODY', 'OBJECT'],
    overlays: ['RANGE', 'TRAJECTORY'],
    entryActions: ['conjure'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'StaffView',
  }),
})

/** The three monkeys, and the sense each one takes away. */
const MONKEYS = [
  { id: 'mizaru', sense: 'sight', label: 'Mizaru — la vue' },
  { id: 'kikazaru', sense: 'hearing', label: 'Kikazaru — l’ouïe' },
  { id: 'iwazaru', sense: 'speech', label: 'Iwazaru — la parole' },
] as const

/**
 * Three monkeys — Saiyu
 *
 * Each monkey cuts one channel of perception, which plugs straight into the
 * knowledge engine: a target under Mizaru stops generating visual facts, so
 * their perspective goes dark instead of merely being annotated "blinded".
 */
export const saiyuThreeMonkeys = defineAbility({
  id: 'saiyu-three-monkeys',
  name: 'Three Monkeys',
  owner: 'saiyu',
  category: 'conjurer',

  site: {
    kind: 'senses',
    instruction:
      'Each click seals sight, hearing, then speech across the site; the fourth releases all three senses.',
    rule: 'Three Nen monkeys rob the target of vision, hearing and speech when their attacks connect.',
    cost: 'Three successful sensory strikes',
    color: '#c58c5b',
    action: 'Seal sight',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Une frappe réussie par sens retiré', amount: 3, unit: 'frappes' },

  actions: Object.fromEntries([
    [
      'restore-a-sense',
      {
        label: 'Rendre un sens',
        evidence: asserted({
          kind: 'other',
          label: 'ce que les singes retirent, ils peuvent le rendre',
        }),
        effects: [setEffectState({ state: 'ENDED' })],
      },
    ],
    [
      'seal-without-a-hit',
      {
        label: 'Retirer un sens sans toucher la cible',
        refusal: 'Un sens retiré coûte une frappe réussie : sans contact, rien n’est scellé',
      },
    ],
    [
      'seal-a-fourth-sense',
      {
        label: 'Retirer un quatrième sens',
        refusal: 'Trois singes, trois sens : la vue, l’ouïe et la parole',
      },
    ],
    ...MONKEYS.map((monkey) => [
      `send-${monkey.id}`,
      {
        label: `Envoyer ${monkey.label}`,
        evidence: shown({
          kind: 'chapter',
          chapter: 349,
          label: 'ch. 349 — les trois singes coupent chacun leur canal',
        }),
        conditions: [requiresTarget('Une cible est visée')],
        effects: [
          spawnNenEntity({
            id: `saiyu-${monkey.id}`,
            kind: 'NEN_ENTITY',
            label: monkey.label,
            metadata: { sense: monkey.sense },
          }),
          effect({
            kind: 'CONSTRAINT',
            discriminator: monkey.id,
            attributes: {
              sense: monkey.sense,
              rules: [
                `La cible perd ${monkey.sense === 'sight' ? 'la vue' : monkey.sense === 'hearing' ? 'l’ouïe' : 'la parole'}.`,
                'La perte des trois sens perturbe gravement la cible.',
              ],
            },
          }),
        ],
      },
    ]),
  ]),

  ui: { componentKey: 'SensesView' },

  interactionManifest: buildManifest('saiyu-three-monkeys', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'BODY'],
    overlays: ['CONTROL_LINK', 'RANGE'],
    entryActions: ['send-mizaru'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'SensesView',
  }),
})

export const SAIYU_MONKEYS = MONKEYS
