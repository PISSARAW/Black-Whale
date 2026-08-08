import {
  abilityGrant,
  attributeCounter,
  belowCapacity,
  buildManifest,
  canUseNen,
  checklist,
  controlLink,
  defineAbility,
  effect,
  effectAttributeAtLeast,
  effectIsLive,
  isConscious,
  knowledgeGrant,
  param,
  person,
  requiresParameter,
  requiresTarget,
  revealedAt,
  setEffectState,
  shown,
  spawnNenEntity,
} from '@black-whale/ability-sdk'

import {
  INFECTION_STEPS,
  askMorena,
  dealTheGame,
  leaveTheTable,
  playTechnique,
  refuseTheDeal,
  settle,
  summariseGame,
  takeTheDeal,
  worksAtTheTable,
  type GameEnding,
  type QuestionCard,
} from './game.js'
import {
  COHORT_ID,
  GAME_DISCRIMINATOR,
  GAME_REVEALED_AT,
  KILL_VALUES,
  MEMBER_ZERO_LEVEL,
  NETWORK_CAPACITY,
  UNIQUE_ABILITY_LEVEL,
  answerParam,
  gameInPlay,
  killValue,
  moveAndCatch,
  moveTheGame,
  seededRandom,
} from './limits.js'

/**
 * Contagion (Et tu, Juliet) — Morena Prudo
 *
 * The ability that exercises every engine at once: a bounded cohort, a per-member
 * counter that levels up on kills, a permanent knowledge feed back to Morena, and
 * an ability granted at level 20. The three canonical infection conditions are a
 * checklist rather than a paragraph, so the "Why?" panel can show which of them
 * a given candidate has already met.
 */
export const contagion = defineAbility({
  id: 'contagion',
  name: 'Contagion',
  owner: 'morena-prudo',
  category: 'manipulator',

  site: {
    kind: 'infection',
    instruction:
      'Infect a member at level 0, then point it at targets: a plain one is worth 1, a character 10, a heading 50, an ability comes at 20 and Member Zero at 100.',
    rule: 'Members gain levels through murder and unlock power at thresholds while infection spreads only by Morena’s kiss.',
    cost: 'Membership, targets and escalating levels',
    color: '#d94f68',
    action: 'Create a level-one member',
  },

  arena: {
    effect: 'enhance',
    cost: 8,
    persistent: true,
    condition: 'infected-member-level',
    risk: 'requires-kills',
    mechanic: 'progression',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    'open-network': {
      label: 'Ouvrir le réseau',
      evidence: shown('ch. 375 — le réseau ouvert, vingt-deux places au plus'),
      effects: [
        spawnNenEntity({ id: COHORT_ID, kind: 'COHORT', label: 'Infectés Heil-Ly' }),
        effect({
          kind: 'CUSTOM',
          discriminator: 'network',
          targets: () => [{ id: COHORT_ID, kind: 'COHORT' }],
          attributes: {
            cohortId: COHORT_ID,
            memberIds: [],
            capacity: NETWORK_CAPACITY,
            rules: [
              'Vingt-deux infectés au maximum.',
              'La contamination passe par la salive.',
              'Le jeu prend fin à la mort de Morena, à la mort de la cible, ou lorsqu’il est accompli.',
            ],
          },
        }),
      ],
    },

    infect: {
      label: 'Infecter',
      evidence: shown('ch. 375 — la triple condition : jeu gagné, baiser, meurtre observé'),
      conditions: [
        requiresTarget('Une cible est embrassée'),
        checklist(
          'infection',
          'Les trois conditions d’infection sont remplies (jeu gagné en « Yes », baiser, meurtre observé)',
          [...INFECTION_STEPS],
        ),
        belowCapacity('memberCount', NETWORK_CAPACITY, 'Le réseau compte moins de 22 infectés'),
        effectIsLive('effectId', 'Le réseau est ouvert'),
      ],
      effects: [
        attributeCounter({ append: (ctx) => ({ memberIds: ctx.targets }) }),
        // One effect per member: this is what the Heil-Ly dashboard reads.
        effect({
          kind: 'CUSTOM',
          discriminator: 'member',
          attributes: (ctx) => ({
            cohortId: COHORT_ID,
            memberId: ctx.targets[0],
            level: 0,
            kills: 0,
          }),
        }),
        // Morena sees the position, the state and the score of every member.
        controlLink({ vector: 'saliva', mode: 'listen', attributes: { cohortId: COHORT_ID } }),
        knowledgeGrant({
          factId: (ctx) => `infected:${ctx.targets[0] ?? 'unknown'}`,
          state: 'KNOWN',
        }),
      ],
      cost: { label: 'Une place du réseau', amount: 1, unit: 'slot sur 22' },
    },

    // ── The negotiation game ──────────────────

    'open-game': {
      label: 'Ouvrir la partie',
      evidence: shown('ch. 407 — Morena ouvre la partie de négociation avec Borksen'),
      conditions: [requiresTarget('Un candidat est assis en face')],
      effects: [
        revealedAt(
          effect({
            kind: 'CUSTOM',
            discriminator: GAME_DISCRIMINATOR,
            attributes: (ctx) => ({
              cohortId: COHORT_ID,
              candidateId: ctx.targets[0],
              ...summariseGame(
                dealTheGame({
                  // She cheats, and she marks the Back card. A caller may deal
                  // clean instead, which is a hand she has never actually
                  // played and a mode the archive is honest about offering.
                  marked: param(ctx, 'clean') === 'true' ? null : 'back',
                  technique: (() => {
                    const carried = param(ctx, 'technique')
                    return worksAtTheTable(carried) ? carried : null
                  })(),
                }),
              ),
              rules: [
                'Sept questions contre cinq réponses : Oui, Non, Retour, Joker, X.',
                'Une question dépensée par tour, une réponse retirée au hasard.',
                'Ce qui reste quand les questions s’épuisent est la réponse donnée.',
                'Tricher ou abandonner limite la réponse à Oui ou Non.',
                'La partie s’achève à la mort de Morena, à celle de la cible, ou quand elle est accomplie.',
              ],
            }),
          }),
          GAME_REVEALED_AT,
        ),
      ],
      hint: 'Douze cartes, chap. 407-410',
    },

    ask: {
      label: 'Dépenser une question',
      evidence: shown('ch. 407-409 — chaque question dépense une carte'),
      conditions: [
        effectIsLive('effectId', 'La partie est en cours'),
        requiresParameter('question', 'Une question est choisie'),
      ],
      effects: [
        moveTheGame((game, ctx) =>
          askMorena(game, param(ctx, 'question') as QuestionCard, {
            random: seededRandom(ctx),
          }),
        ),
      ],
    },

    // The kiss, which is one of the three conditions in its own right — so
    // taking the deal is not a free card, it is a third of the infection paid
    // for a card. `stake` in the language of docs/jeu-de-morena.md §4.1.
    stake: {
      label: 'Accepter le baiser',
      evidence: shown('ch. 409 — Borksen accepte le baiser pour reprendre une carte'),
      conditions: [
        effectIsLive('effectId', 'La partie est en cours'),
        requiresParameter('card', 'Une carte du cimetière est nommée'),
      ],
      effects: [
        moveAndCatch((game, ctx) => {
          const card = answerParam(ctx, 'card')
          return card ? takeTheDeal(game, card) : game
        }),
      ],
    },

    'refuse-stake': {
      label: 'Refuser le baiser',
      evidence: shown('ch. 375 — le refus met fin à la partie'),
      conditions: [effectIsLive('effectId', 'La partie est en cours')],
      effects: [moveTheGame((game) => refuseTheDeal(game))],
    },

    // Everything a Hatsu does at this table goes through one action: what it
    // buys is the technique's business, and whether the room saw it is the
    // room's. Both are decided in `./game.ts`.
    'play-technique': {
      label: 'Jouer l’aura',
      evidence: shown('ch. 375 — l’aura jouée à la table'),
      conditions: [effectIsLive('effectId', 'La partie est en cours')],
      effects: [moveAndCatch((game, ctx) => playTechnique(game, { random: seededRandom(ctx) }))],
    },

    // Walking out. Canon punishes it exactly as it punishes fraud, so it is a
    // move with a price rather than a way out of the game.
    'leave-table': {
      label: 'Quitter la table',
      evidence: shown('ch. 375 — quitter la table est une réponse'),
      conditions: [effectIsLive('effectId', 'La partie est en cours')],
      effects: [moveAndCatch((game) => leaveTheTable(game))],
    },

    settle: {
      label: 'Jouer la dernière carte',
      evidence: shown('ch. 410 — la dernière carte conduit Borksen à choisir Oui'),
      conditions: [effectIsLive('effectId', 'La partie est en cours')],
      effects: [moveAndCatch((game, ctx) => settle(game, answerParam(ctx, 'choice')))],
    },

    'close-game': {
      label: 'Clore la partie',
      evidence: shown('ch. 410 — la partie se clôt sur le Oui de Borksen'),
      conditions: [effectIsLive('effectId', 'La partie est en cours')],
      effects: [
        (ctx) => {
          const id = param(ctx, 'effectId')
          if (!id) return []
          const game = gameInPlay(ctx)
          const reason = (param(ctx, 'reason') ?? 'game-completed') as GameEnding
          return [
            {
              type: 'EFFECT_STATE_CHANGED',
              payload: {
                effectId: id,
                state: 'ENDED',
                attributes: {
                  reason,
                  // What the hand established, in the vocabulary `infect` reads:
                  // a Yes won at the table, and the kiss if it was taken. The
                  // murder is not this game's to give.
                  completedSteps: game ? summariseGame(game)['completedSteps'] : [],
                },
              },
              revealedAtChapter: GAME_REVEALED_AT,
            },
          ]
        },
      ],
      hint: 'Trois fins : accomplie, Morena morte, cible morte',
    },

    'record-kill': {
      label: 'Enregistrer un meurtre',
      evidence: shown('ch. 384 — un niveau par quidam, dix par utilisateur, cinquante par prince'),
      conditions: [
        effectIsLive('effectId', 'Le membre est toujours infecté'),
        requiresParameter('victimStatus', 'Le statut de la victime est connu'),
      ],
      effects: [
        // The engine knows whether the victim was an ordinary person, a Nen user
        // or a prince, so the score does not have to be supplied by the caller.
        attributeCounter({
          increments: (ctx) => ({
            kills: 1,
            level: killValue(param(ctx, 'victimStatus')),
          }),
        }),
        knowledgeGrant({
          factId: (ctx) => `kill:${param(ctx, 'victimId') ?? 'unknown'}`,
          observerId: 'morena-prudo',
          state: 'KNOWN',
        }),
      ],
    },

    'grant-unique-ability': {
      label: 'Générer la capacité unique (niveau 20)',
      evidence: shown('ch. 384 — la capacité propre gagnée au niveau 20'),
      conditions: [
        effectIsLive('effectId', 'Le membre est toujours infecté'),
        effectAttributeAtLeast({
          key: 'level',
          threshold: UNIQUE_ABILITY_LEVEL,
          label: `Le membre a atteint le niveau ${UNIQUE_ABILITY_LEVEL}`,
        }),
      ],
      effects: [abilityGrant({ ownerId: (ctx) => param(ctx, 'memberId') ?? ctx.targets[0] })],
      hint: `Requiert le niveau ${UNIQUE_ABILITY_LEVEL}`,
    },

    'infect-beyond-the-cap': {
      label: 'Infecter au-delà de vingt-deux',
      refusal: 'Le réseau ne tient que vingt-deux infectés : au-delà, la salive ne prend pas',
      evidence: shown('ch. 375 — le plafond énoncé avec la capacité'),
    },

    'infect-without-the-game': {
      label: 'Infecter sans la partie gagnée',
      refusal:
        'Les trois conditions sont indissociables : partie gagnée en « oui », baiser, meurtre observé',
      evidence: shown('ch. 375 — les trois conditions posées ensemble'),
    },

    'lose-sight-of-a-member': {
      label: 'Perdre un membre de vue',
      refusal: 'Morena voit en permanence la position et l’état de chaque infecté',
      evidence: shown('ch. 384 — le suivi permanent du réseau'),
    },

    'end-game': {
      label: 'Clore le jeu',
      evidence: shown(
        'ch. 375 — le jeu finit à la mort de Morena, à celle de la cible, ou accompli',
      ),
      conditions: [effectIsLive('effectId', 'Le réseau est ouvert')],
      effects: [setEffectState({ state: 'ENDED', attributes: { reason: 'game-completed' } })],
    },
  },

  ui: { componentKey: 'ContagionDashboard' },

  interactionManifest: buildManifest('contagion', {
    // Infection is a sequence, not a click: game, kiss, witnessed murder.
    inputMode: 'SEQUENCE',
    allowedTargets: ['CHARACTER'],
    overlays: ['CONTROL_LINK', 'RANGE'],
    entryActions: ['open-network', 'infect'],
    requiredState: ['isConscious', 'canUseNen'],
    perspectiveTransition: {
      canChangeBody: false,
      canChangeConsciousness: false,
      canFollowAura: true,
    },
    customComponent: 'ContagionDashboard',
  }),
})

export const CONTAGION_LIMITS = {
  cohortId: COHORT_ID,
  capacity: NETWORK_CAPACITY,
  uniqueAbilityLevel: UNIQUE_ABILITY_LEVEL,
  memberZeroLevel: MEMBER_ZERO_LEVEL,
  infectionSteps: INFECTION_STEPS,
  killValues: KILL_VALUES,
  /** Where a running negotiation is stored, for anything reading the branch. */
  gameDiscriminator: GAME_DISCRIMINATOR,
  gameRevealedAtChapter: GAME_REVEALED_AT,
}
