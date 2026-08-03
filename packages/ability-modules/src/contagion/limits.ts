import { constraint, param } from '@black-whale/ability-sdk'
import type { EffectBuilder } from '@black-whale/ability-sdk'
import type { AbilityContext } from '@black-whale/nen-engine'

import { summariseGame, type AnswerCard, type MorenaGame } from './game.js'

/**
 * The constants and helpers the ability's actions are written against: the
 * canon limits, the negotiation stored on the effect, and the two combinators
 * that move a game forward and record what the move cost.
 */

/** What an effect builder hands back, named once so the helpers below can say it. */
type Emitted = ReturnType<EffectBuilder>

export const COHORT_ID = 'heil-ly-infected'

/**
 * The chapter that first shows the negotiation game being played.
 *
 * Every event the game emits is stamped with it, so a reader held before ch.
 * 407 is told the recruitment procedure is unknown rather than shown twelve
 * cards nobody has drawn yet. `docs/jeu-de-morena.md` §5 asks for exactly this.
 */
export const GAME_REVEALED_AT = 407

/** Canon point values: an ordinary victim is worth one level, a prince fifty. */
export const KILL_VALUES: Record<string, number> = {
  ordinary: 1,
  'nen-user': 10,
  prince: 50,
}

/** The level at which an infected member generates an ability of their own. */
export const UNIQUE_ABILITY_LEVEL = 20
/** Member Zero. */
export const MEMBER_ZERO_LEVEL = 100
/** Morena can hold at most twenty-two infected at a time. */
export const NETWORK_CAPACITY = 22

export function killValue(status: string | undefined): number {
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
export const GAME_DISCRIMINATOR = 'game'

/** Reads the hand back off the effect the caller named. `null` if there is none. */
export function gameInPlay(ctx: AbilityContext): MorenaGame | null {
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
export function moveTheGame(step: (game: MorenaGame, ctx: AbilityContext) => MorenaGame) {
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
export function recordTheManipulation(ctx: AbilityContext, after: MorenaGame): Emitted {
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
export function moveAndCatch(step: (game: MorenaGame, ctx: AbilityContext) => MorenaGame) {
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
export function seededRandom(ctx: AbilityContext): () => number {
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
export function answerParam(ctx: AbilityContext, key: string): AnswerCard | undefined {
  const value = param(ctx, key)
  return value && ['yes', 'no', 'back', 'joker', 'x'].includes(value)
    ? (value as AnswerCard)
    : undefined
}
