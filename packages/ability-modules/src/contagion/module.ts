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
  constraint,
  revealedAt,
  setEffectState,
  spawnNenEntity,
} from '@black-whale/ability-sdk'
import type { EffectBuilder } from '@black-whale/ability-sdk'
import type { AbilityContext } from '@black-whale/nen-engine'

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
  type AnswerCard,
  type GameEnding,
  type MorenaGame,
  type QuestionCard,
} from './game.js'

/** What an effect builder hands back, named once so the helpers below can say it. */
type Emitted = ReturnType<EffectBuilder>

const COHORT_ID = 'heil-ly-infected'

/**
 * The chapter that first shows the negotiation game being played.
 *
 * Every event the game emits is stamped with it, so a reader held before ch.
 * 407 is told the recruitment procedure is unknown rather than shown twelve
 * cards nobody has drawn yet. `docs/jeu-de-morena.md` §5 asks for exactly this.
 */
const GAME_REVEALED_AT = 407

/** Canon point values: an ordinary victim is worth one level, a prince fifty. */
const KILL_VALUES: Record<string, number> = {
  ordinary: 1,
  'nen-user': 10,
  prince: 50,
}

/** The level at which an infected member generates an ability of their own. */
const UNIQUE_ABILITY_LEVEL = 20
/** Member Zero. */
const MEMBER_ZERO_LEVEL = 100
/** Morena can hold at most twenty-two infected at a time. */
const NETWORK_CAPACITY = 22

function killValue(status: string | undefined): number {
  return status ? (KILL_VALUES[status] ?? KILL_VALUES['ordinary']!) : KILL_VALUES['ordinary']!
}

// ──────────────────────────────────────────────
// The negotiation game
//
// The first condition of Contagion used to be a checklist step somebody else
// ticked. It is now a game with rules, and the rules are in `./game.ts`: pure,
// engine-free, and shared with the walk at `/tour/morena`.
//
// The bridge is deliberately thin. Every action below does the same three
// things — read the hand out of the effect it is stored in, put one move
// through the reducer, and write the whole new hand back as one
// `EFFECT_ATTRIBUTE_CHANGED`. One move, one event, which is what makes a
// negotiation replayable beat by beat on the timeline.
// ──────────────────────────────────────────────

/** Where a running game lives, and what it is called on the effect. */
const GAME_DISCRIMINATOR = 'game'

/** Reads the hand back off the effect the caller named. `null` if there is none. */
function gameInPlay(ctx: AbilityContext): MorenaGame | null {
  const id = param(ctx, 'effectId')
  if (!id || !ctx.worldState) return null
  const held = ctx.worldState.effects[id]?.attributes['game']
  return held ? (held as MorenaGame) : null
}

/**
 * Puts one move through the reducer and writes the result back.
 *
 * Returns no events at all when there is nothing to move — no effect named, no
 * game in it, or a move the rules refuse. That is the SDK's convention for a
 * builder that has nothing to say, and it keeps the "Why?" projection honest:
 * an illegal move simply produces no change rather than a thrown error.
 */
function moveTheGame(step: (game: MorenaGame, ctx: AbilityContext) => MorenaGame) {
  return (ctx: AbilityContext): Emitted => {
    const before = gameInPlay(ctx)
    const id = param(ctx, 'effectId')
    if (!before || !id) return []
    const after = step(before, ctx)
    if (after === before) return []
    return [
      {
        type: 'EFFECT_ATTRIBUTE_CHANGED',
        payload: { effectId: id, attributes: summariseGame(after) },
        revealedAtChapter: GAME_REVEALED_AT,
      },
    ]
  }
}

/**
 * The Manipulation, as the engine sees it.
 *
 * Canon: cheating or walking out limits the answer to Yes or No. The reducer
 * has already taken Back, Joker and X off the table by the time this runs — so
 * what is left to record is the thing a reader needs to be *shown*: the effect
 * is `TRIGGERED` rather than merely running, and there is a `CONSTRAINT` on the
 * candidate naming the two words they have left. `docs/jeu-de-morena.md` §4.2
 * asks for both, and the "Why?" panel can print the rules array as it stands.
 */
function recordTheManipulation(ctx: AbilityContext, after: MorenaGame): Emitted {
  const id = param(ctx, 'effectId')
  if (!id) return []
  return [
    {
      type: 'EFFECT_STATE_CHANGED',
      payload: {
        effectId: id,
        state: 'TRIGGERED',
        attributes: { manipulated: true, allowedAnswers: ['yes', 'no'] },
      },
      revealedAtChapter: GAME_REVEALED_AT,
    },
    ...constraint({
      rules: [
        'La réponse est limitée à Oui ou Non.',
        'Retour, Joker et X ont quitté la table.',
        after.ending === 'abandoned'
          ? 'Déclenchée par l’abandon, que le canon punit comme la triche.'
          : 'Déclenchée par une triche vue depuis la pièce.',
      ],
      attributes: { allowedAnswers: ['yes', 'no'], cohortId: COHORT_ID },
    })(ctx).map((event) => ({ ...event, revealedAtChapter: GAME_REVEALED_AT })),
  ]
}

/**
 * A move, plus the Manipulation when the move is what triggered it.
 *
 * Every action that can be caught goes through here rather than through
 * `moveTheGame` alone: the sanction is not a separate decision the caller makes,
 * it is a consequence of the move, and the events have to say so in that order.
 */
function moveAndCatch(step: (game: MorenaGame, ctx: AbilityContext) => MorenaGame) {
  const move = moveTheGame(step)
  return (ctx: AbilityContext): Emitted => {
    const before = gameInPlay(ctx)
    const events = move(ctx)
    if (!before || !events.length) return events
    const after = step(before, ctx)
    if (after.manipulated && !before.manipulated) {
      return [...events, ...recordTheManipulation(ctx, after)]
    }
    return events
  }
}

/**
 * Chance, made replayable.
 *
 * Morena reaches into the hand at random, and a branch that replayed to a
 * different hand would not be a replay. So the shuffle is derived from the
 * event that carries the move rather than drawn from `Math.random`: the same
 * event on the same round always takes the same card, and appending the branch
 * twice gives the same negotiation twice.
 *
 * A plain FNV-1a over the two, folded to the unit interval. It is not a good
 * generator and does not have to be — it has to be a *function*.
 */
function seededRandom(ctx: AbilityContext): () => number {
  const round = gameInPlay(ctx)?.round ?? 0
  const seed = `${ctx.eventId}:${ctx.actionId ?? ''}:${round}`
  let draws = 0
  return () => {
    let hash = 0x811c9dc5
    for (const character of `${seed}:${draws++}`) {
      hash ^= character.charCodeAt(0)
      hash = Math.imul(hash, 0x01000193) >>> 0
    }
    return hash / 0x100000000
  }
}

/** The card a caller named, when it is one of the five. */
function answerParam(ctx: AbilityContext, key: string): AnswerCard | undefined {
  const value = param(ctx, key)
  return value && ['yes', 'no', 'back', 'joker', 'x'].includes(value)
    ? (value as AnswerCard)
    : undefined
}

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

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    'open-network': {
      label: 'Ouvrir le réseau',
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
      conditions: [effectIsLive('effectId', 'La partie est en cours')],
      effects: [moveTheGame((game) => refuseTheDeal(game))],
    },

    // Everything a Hatsu does at this table goes through one action: what it
    // buys is the technique's business, and whether the room saw it is the
    // room's. Both are decided in `./game.ts`.
    'play-technique': {
      label: 'Jouer l’aura',
      conditions: [effectIsLive('effectId', 'La partie est en cours')],
      effects: [moveAndCatch((game, ctx) => playTechnique(game, { random: seededRandom(ctx) }))],
    },

    // Walking out. Canon punishes it exactly as it punishes fraud, so it is a
    // move with a price rather than a way out of the game.
    'leave-table': {
      label: 'Quitter la table',
      conditions: [effectIsLive('effectId', 'La partie est en cours')],
      effects: [moveAndCatch((game) => leaveTheTable(game))],
    },

    settle: {
      label: 'Jouer la dernière carte',
      conditions: [effectIsLive('effectId', 'La partie est en cours')],
      effects: [moveAndCatch((game, ctx) => settle(game, answerParam(ctx, 'choice')))],
    },

    'close-game': {
      label: 'Clore la partie',
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

    'end-game': {
      label: 'Clore le jeu',
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
