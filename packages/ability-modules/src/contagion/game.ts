/**
 * Morena's negotiation game, as rules rather than as a table.
 *
 * Ch. 407-410 sits Borksen down opposite Morena Prudo in the Heil-Ly hideout
 * and plays twelve cards between them: seven questions in Morena's hand, five
 * answers in her guest's. The recruit spends a question a round to learn what
 * they are agreeing to, and Morena takes an answer a round at random until one
 * is left. That last card is the answer, whatever it turns out to be — which is
 * the whole cruelty of it: you buy knowledge with the only thing that can still
 * say no.
 *
 * This is the reducer `docs/jeu-de-morena.md` §4.1 asks for: a pure, total
 * function on a small state, with chance injected as `random` so a test can
 * settle a deal it did not shuffle. It has **no engine dependency at all** —
 * not the SDK, not the world engine, not three.js — because it is consumed
 * from both ends: `module.ts` turns each move into world events, and the walk
 * at `/tour/morena` plays it move by move in front of the visitor.
 *
 * What it does not do is decide what anything is called. A card is an id; what
 * Morena *says* when she answers a question belongs to whoever is rendering.
 */

/**
 * The five cards the recruit holds.
 *
 * - `yes` — the contract. Contagion, and level zero until the first kill.
 * - `no` — the refusal, which Morena honours: the game is a restriction, and a
 *   restriction she broke would cost her the ability.
 * - `back` — retrieves an answer out of the graveyard. Not an answer itself,
 *   which is why holding it to the end is a bet rather than a plan.
 * - `joker` — becomes Yes or No, decided when it is played.
 * - `x` — cancels the negotiation outright. Neither side gets anything.
 */
export type AnswerCard = 'yes' | 'no' | 'back' | 'joker' | 'x'

/**
 * The seven questions, in the order Morena's fan holds them.
 *
 * Five are named in the manga — her objective, her power, what a Yes costs,
 * what a No costs, and the contract itself. The other two are the ones Borksen
 * actually gets answered on the page: where Morena comes from, and what the
 * recruit is worth to her.
 */
export type QuestionCard = 'goal' | 'power' | 'if-yes' | 'if-no' | 'contract' | 'origin' | 'price'

export const ANSWER_CARDS: readonly AnswerCard[] = ['yes', 'no', 'back', 'joker', 'x']

export const QUESTION_CARDS: readonly QuestionCard[] = [
  'goal',
  'power',
  'if-yes',
  'if-no',
  'contract',
  'origin',
  'price',
]

/**
 * Where the game has got to.
 *
 * - `asking` — there is more than one answer left, so a question may be spent.
 * - `deal` — Morena has offered the kiss, and nothing else moves until it is
 *   taken or refused. It interrupts `asking` exactly once.
 * - `settling` — one answer is left and it needs a decision before it means
 *   anything: a Joker to point, or a Back to spend.
 * - `over` — `verdict` is set.
 */
export type GamePhase = 'asking' | 'deal' | 'settling' | 'over'

/**
 * How it ended.
 *
 * - `infected` — a Yes given freely.
 * - `refused` — a No, and Morena lets the guest walk.
 * - `cancelled` — the X, which ends the negotiation and nothing else.
 * - `forced` — a Yes that was not given. Morena marked a card; reaching for it
 *   at the end hands her the manipulative half of Contagion, which narrows the
 *   final answer to Yes or No and then chooses.
 */
export type Verdict = 'infected' | 'refused' | 'cancelled' | 'forced'

/**
 * What a technique buys at this table.
 *
 * Eight verbs, and every capability in `TABLE_TECHNIQUES` is one of them. The
 * point of keeping the vocabulary this small is that the game stays a game:
 * twenty bespoke exceptions would be twenty ways for a Hatsu to simply win,
 * where eight shared verbs are eight things the table already knows how to
 * price.
 *
 * - `read` — her fan turns face up. You stop guessing which questions are left.
 * - `foresee` — you are told which answer she is about to take, before you
 *   spend the question that lets her take it.
 * - `pass` — the round costs no answer. The only legal pause in the game.
 * - `recover` — a card out of the graveyard, without the kiss. The kiss is
 *   Morena's price for exactly this, so anything that does it for free is
 *   taking money out of her hand.
 * - `forge` — a card that is not yours joins the hand. It plays like any other
 *   until somebody touches it.
 * - `shield` — the Manipulation cannot narrow you.
 * - `hide` — the room stops watching, so what you do next is not seen.
 * - `proxy` — you are not the person in the chair.
 * - `rider` — nothing to the hand at all; everything to what the verdict turns
 *   out to be worth.
 */
export type TableEffect =
  | 'read'
  | 'foresee'
  | 'pass'
  | 'recover'
  | 'forge'
  | 'shield'
  | 'hide'
  | 'proxy'
  | 'blind'
  | 'rider'

/**
 * What a technique hangs on the outcome rather than on the hand.
 *
 * The canon result of this game is a word — «Oui» — and a word on its own binds
 * nobody. These are the things that make the word worth something, in either
 * direction.
 */
export type Rider =
  'bound' | 'moon' | 'stolen' | 'sworn' | 'smoke' | 'taxed' | 'trapped' | 'deterred'

/** What a rider actually did, once the last card is down. */
export type Aftermath =
  | 'bound'
  | 'moon'
  | 'stolen'
  | 'sworn-struck'
  | 'smoke'
  | 'taxed'
  | 'trapped'
  | 'deterred'
  | 'proxied'

/** One line of what happened, in the order it happened. */
export type Beat =
  | { kind: 'asked'; round: number; question: QuestionCard }
  | { kind: 'taken'; round: number; card: AnswerCard }
  | { kind: 'offered'; round: number }
  | { kind: 'kissed'; round: number; card: AnswerCard }
  | { kind: 'declined'; round: number }
  | { kind: 'recovered'; round: number; card: AnswerCard }
  | { kind: 'marked'; round: number; card: AnswerCard }
  | { kind: 'settled'; round: number; card: AnswerCard; verdict: Verdict }
  /** A technique played at the table, and whether the room saw it. */
  | { kind: 'played'; round: number; technique: TableKind; seen: boolean }
  /** The sanction the canon names: the vocabulary narrowed to Yes and No. */
  | { kind: 'narrowed'; round: number; because: 'cheating' | 'leaving' }
  /** A forged card given away by the one thing in the game that is a touch. */
  | { kind: 'exposed'; round: number; card: AnswerCard }
  /** What a rider did when the last card came down. */
  | { kind: 'aftermath'; round: number; what: Aftermath }

export interface MorenaGame {
  phase: GamePhase
  /** One-based, and it counts questions spent rather than cards on the table. */
  round: number
  /** Still in Morena's fan, face down to the guest. */
  questions: QuestionCard[]
  /** Spent, in the order they were asked. */
  asked: QuestionCard[]
  /** The guest's hand. */
  hand: AnswerCard[]
  /** What Morena has taken out of it. */
  graveyard: AnswerCard[]
  /**
   * The card Morena marked before dealing.
   *
   * She cheats, and the game is her own restriction — so the marking is not a
   * way to win the hand, it is a trap laid on one card. Reaching for it is what
   * lets the manipulative component in. `null` for a clean deal, which is a
   * game she never actually plays and a mode worth having anyway.
   */
  marked: AnswerCard | null
  /** Whether the kiss has been traded for a card out of the graveyard. */
  kissed: boolean
  /** Whether the offer has already been made, so it is made only once. */
  dealt: boolean
  verdict: Verdict | null
  /** The card the game came down to, once it is over. */
  finalCard: AnswerCard | null

  // ── What a Hatsu has done to this table ────────────────────────

  /** The technique the visitor sat down with, or `null` for an honest hand. */
  technique: TableKind | null
  /** How many times each move has been spent, so a one-shot stays one. */
  spent: number
  /**
   * How watchful the room is, from 0 to 1.
   *
   * One at the hideout, and the hideout is where the game is played: LSDF is
   * canon, it exists only while Morena is here, and it grades its guards on how
   * serious the offence is. That is the detector, and it is why sitting down
   * with a technique in hand is a gamble rather than a win.
   */
  watch: number
  /**
   * Whether the Manipulation has landed.
   *
   * Canon, and the one sanction the game has: cheating **or walking out**
   * narrows the answer to Yes or No. In twelve cards that is not an abstract
   * state — it is Back, Joker and X taken off the table, which is exactly what
   * "limited to Yes or No" means when the answers are objects.
   */
  manipulated: boolean
  /** Whether it cannot land: a vow is the one true immunity to it. */
  shielded: boolean
  /** Her fan, face up. */
  read: boolean
  /** Which answer she takes next, when something has told you. */
  foreseen: AnswerCard | null
  /** A card in the hand that is not yours, and what touching it would reveal. */
  forged: AnswerCard | null
  /** Whether somebody else is in the chair. */
  proxied: boolean
  /** Hung on the outcome, and paid out when the last card comes down. */
  riders: Rider[]
  /** What those riders actually did. Empty until the game is over. */
  aftermath: Aftermath[]
  /** How it closed, when it closed on something other than a card. */
  ending: 'played' | 'abandoned' | null

  log: Beat[]
}

/**
 * A technique's seat at the table.
 *
 * `exposure` is how likely the room is to see it *before* the room's own
 * watchfulness is applied, and `fraud` says whether being seen matters at all —
 * several of these are simply legal, and a game where every capability is
 * cheating is a game that has misread the canon. Playing a legal move in the
 * open is a move; playing a fraud in the open is the end of your vocabulary.
 */
export interface TableMove {
  /** The ability this is, so the panel can name it off the registry. */
  hatsuId: string
  effect: TableEffect
  rider?: Rider
  /** 0 to 1, before `watch`. */
  exposure: number
  fraud: boolean
  /** How many times it may be played in one game. */
  uses: number
}

/**
 * The capabilities that change this table, and what each of them buys.
 *
 * Keyed on the registry's own interaction kind, so the technique the visitor is
 * already carrying in the site-wide Nen dock is the technique they sit down
 * with — there is no second roster to keep in step. Everything not in this list
 * is a capability that has nothing to say to twelve cards and a chair, which is
 * most of them, and saying so is part of the point.
 *
 * The prices come out of the abilities themselves rather than out of balance:
 * the Dowsing Chain is a chain, visible and un-Zetsu-able, so it is the most
 * exposed reader in the game; Parallel Future is lived under Zetsu, so it is
 * the one fraud the room cannot see; Texture Surprise is undone by touch, and
 * this game ends in a kiss.
 */
export const TABLE_TECHNIQUES = {
  // ── Reading her hand ──────────────────────────
  dowsing: { hatsuId: 'dowsing-chain', effect: 'foresee', exposure: 0.55, fraud: true, uses: 3 },
  future: { hatsuId: 'parallel-future', effect: 'foresee', exposure: 0, fraud: true, uses: 1 },
  divination: { hatsuId: 'love-dial-6700', effect: 'foresee', exposure: 0.2, fraud: true, uses: 2 },
  prophecy: { hatsuId: 'lovely-ghostwriter', effect: 'read', exposure: 0, fraud: false, uses: 1 },
  surveillance: { hatsuId: 'secret-window', effect: 'read', exposure: 0.15, fraud: true, uses: 1 },
  scout: { hatsuId: 'little-eye', effect: 'read', exposure: 0.1, fraud: true, uses: 2 },
  'paper-spy': {
    hatsuId: 'surveillance-paper-dolls',
    effect: 'read',
    exposure: 0.3,
    fraud: true,
    uses: 2,
  },
  // A punch is a truthful answer and a punch. Certain detection, so it is worth
  // exactly one thing: the last exchange, when the Manipulation has nothing
  // left to narrow because you are already holding the card you meant to play.
  'truth-punch': { hatsuId: 'body-and-soul', effect: 'read', exposure: 1, fraud: true, uses: 1 },

  // ── Hiding yours ──────────────────────────────
  disguise: { hatsuId: 'texture-surprise', effect: 'forge', exposure: 0, fraud: true, uses: 1 },
  melody: {
    hatsuId: 'melody-enchanting-music',
    effect: 'pass',
    exposure: 0,
    fraud: false,
    uses: 2,
  },
  // Taking her sight, her hearing and her voice stops her asking the last
  // question — and a game she cannot play is a game abandoned, which the canon
  // punishes on both sides. It buys a draw, and it pays for it.
  senses: { hatsuId: 'saiyu-three-monkeys', effect: 'blind', exposure: 1, fraud: true, uses: 1 },

  // ── Making stakes ─────────────────────────────
  'coin-growth': {
    hatsuId: 'zhanglei-guardian-coins',
    effect: 'recover',
    exposure: 0,
    fraud: false,
    uses: 1,
  },
  clone: {
    hatsuId: 'gallery-fake',
    effect: 'recover',
    rider: 'smoke',
    exposure: 0,
    fraud: true,
    uses: 1,
  },
  growth: { hatsuId: 'erigeron', effect: 'recover', exposure: 0.4, fraud: true, uses: 1 },
  'drug-synthesis': {
    hatsuId: 'tubeppa-guardian-synthesis',
    effect: 'recover',
    exposure: 0.35,
    fraud: true,
    uses: 1,
  },

  // ── Changing what the answer is worth ─────────
  contract: {
    hatsuId: 'moonlight-act',
    effect: 'rider',
    rider: 'bound',
    exposure: 0,
    fraud: false,
    uses: 1,
  },
  'heart-vow': {
    hatsuId: 'judgment-chain',
    effect: 'shield',
    rider: 'sworn',
    exposure: 0,
    fraud: false,
    uses: 1,
  },
  polarity: {
    hatsuId: 'sun-and-moon',
    effect: 'rider',
    rider: 'moon',
    exposure: 0.25,
    fraud: true,
    uses: 1,
  },
  curse: {
    hatsuId: 'beyond-sacrificial-curse',
    effect: 'rider',
    rider: 'deterred',
    exposure: 0,
    fraud: false,
    uses: 1,
  },
  'desire-trap': {
    hatsuId: 'luzurus-guardian-desire-trap',
    effect: 'read',
    rider: 'trapped',
    exposure: 0.5,
    fraud: true,
    uses: 1,
  },
  'lie-marks': {
    hatsuId: 'tserriednich-guardian-lie-marks',
    effect: 'rider',
    rider: 'taxed',
    exposure: 0,
    fraud: false,
    uses: 1,
  },

  // ── Not being the person sitting ──────────────
  theft: {
    hatsuId: 'skill-hunter',
    effect: 'rider',
    rider: 'stolen',
    exposure: 0.2,
    fraud: true,
    uses: 1,
  },
  puppet: { hatsuId: 'black-voice', effect: 'proxy', exposure: 0, fraud: true, uses: 1 },
  command: { hatsuId: 'order-stamp', effect: 'proxy', exposure: 0, fraud: true, uses: 1 },
  needle: { hatsuId: 'illumi-needle-people', effect: 'proxy', exposure: 0, fraud: true, uses: 1 },
  'identity-swap': {
    hatsuId: 'convert-hands',
    effect: 'proxy',
    exposure: 0.3,
    fraud: true,
    uses: 1,
  },

  // ── The room itself ───────────────────────────
  'room-isolation': {
    hatsuId: 'marayam-guardian-isolation',
    effect: 'hide',
    exposure: 0,
    fraud: true,
    uses: 1,
  },
  'door-network': {
    hatsuId: 'voconte-hideout-doors',
    effect: 'hide',
    exposure: 0.2,
    fraud: true,
    uses: 1,
  },
} as const satisfies Record<string, TableMove>

/**
 * The interaction kinds that have something to say to twelve cards.
 *
 * Every key is the `kind` the Hatsu registry files that ability under, but the
 * type of that union lives in the web app and this package must not reach for
 * it: `apps/web/src/lib/tour/morena.ts` re-exports these and holds the compile-
 * time proof that no key here has drifted off the registry.
 */
export type TableKind = keyof typeof TABLE_TECHNIQUES

export const TABLE_KINDS = Object.keys(TABLE_TECHNIQUES) as TableKind[]

/** Whether the technique in hand can be played across this table. */
export function worksAtTheTable(kind: string | null | undefined): kind is TableKind {
  return Boolean(kind) && kind! in TABLE_TECHNIQUES
}

export function moveFor(kind: TableKind): TableMove {
  return TABLE_TECHNIQUES[kind]
}

export interface DealOptions {
  /** Which card Morena marks. Defaults to the one she marks in ch. 410. */
  marked?: AnswerCard | null
  /** The shuffle, injected so a test can play a hand it chose. */
  random?: () => number
  /** The technique the visitor is carrying as they sit down. */
  technique?: TableKind | null
  /** How watchful the room is. One at the hideout, which is where this is. */
  watch?: number
}

/**
 * A fresh game: seven questions, five answers, and a marked card.
 *
 * Nothing is shuffled — both hands are open information and the whole point of
 * the game is that neither side is guessing what the other holds. Chance enters
 * once a round, when Morena reaches into the guest's hand.
 */
export function dealTheGame(options: DealOptions = {}): MorenaGame {
  const marked = options.marked === undefined ? 'back' : options.marked
  return {
    phase: 'asking',
    round: 1,
    questions: [...QUESTION_CARDS],
    asked: [],
    hand: [...ANSWER_CARDS],
    graveyard: [],
    marked,
    kissed: false,
    dealt: false,
    verdict: null,
    finalCard: null,
    technique: options.technique ?? null,
    spent: 0,
    watch: options.watch ?? 1,
    manipulated: false,
    shielded: false,
    read: false,
    foreseen: null,
    forged: null,
    proxied: false,
    riders: [],
    aftermath: [],
    ending: null,
    log: marked ? [{ kind: 'marked', round: 0, card: marked }] : [],
  }
}

/** A game that cannot move: every step below returns this rather than throwing. */
const unchanged = (game: MorenaGame): MorenaGame => game

/** The three cards that are not Yes and are not No. */
const WIDER_VOCABULARY: readonly AnswerCard[] = ['back', 'joker', 'x']

/**
 * The Manipulation: the answer narrowed to Yes or No.
 *
 * This is the one sanction the canon gives the game, and it is worded as a
 * restriction on *vocabulary* rather than as an ejection — "limiting the answer
 * to Yes or No". In a game whose answers are objects, that has a literal
 * reading and it is the right one: Back, Joker and X leave the table. What is
 * left is what she was always going to accept.
 *
 * A guest narrowed down to nothing is handed Yes and No back out of the
 * graveyard, because the sanction is a narrowing and not a silencing: the canon
 * says the answer *is limited to* those two, which presumes there is an answer.
 *
 * It fires for cheating and for walking out, and the two are the same offence.
 */
export function narrowTheAnswer(game: MorenaGame, because: 'cheating' | 'leaving'): MorenaGame {
  if (game.manipulated || game.shielded || game.phase === 'over') return unchanged(game)

  let hand = game.hand.filter((card) => !WIDER_VOCABULARY.includes(card))
  const graveyard = game.graveyard.filter((card) => !WIDER_VOCABULARY.includes(card))
  if (hand.length === 0) {
    hand = graveyard.length ? [...graveyard] : ['yes', 'no']
  }

  const kept = new Set(hand)
  return {
    ...game,
    manipulated: true,
    hand,
    graveyard: graveyard.filter((card) => !kept.has(card)),
    // The forged card was one of those three as often as not, and a card that
    // has left the table cannot be exposed by a kiss.
    forged: game.forged && !hand.includes(game.forged) ? null : game.forged,
    foreseen: null,
    phase: hand.length <= 1 ? 'settling' : game.phase === 'deal' ? 'asking' : game.phase,
    log: [...game.log, { kind: 'narrowed', round: game.round, because }],
  }
}

/**
 * Walk out.
 *
 * Canon puts abandoning and cheating under the same sanction, so leaving is not
 * an exit — it is the Manipulation, and then a table you are still sitting at
 * with two cards in your hand. The only way out of the game is through it.
 */
export function leaveTheTable(game: MorenaGame): MorenaGame {
  if (game.phase === 'over') return unchanged(game)
  if (game.shielded) {
    // A vow is a vow. Nothing narrows, and the game simply ends unfinished —
    // which is the one door the canon leaves open, since Morena needs the Yes
    // and cannot take it off a corpse.
    return { ...game, phase: 'over', verdict: 'cancelled', ending: 'abandoned' }
  }
  return { ...narrowTheAnswer(game, 'leaving'), ending: 'abandoned' }
}

/**
 * Play the technique in hand across the table.
 *
 * One call does the whole of it: what the move buys, and whether the room saw
 * it. The room is the Heil-Ly hideout and LSDF is standing in it, so seeing is
 * the default and not the exception — a capability used here is a bet that the
 * thing it buys is worth more than the three cards it may cost.
 *
 * A move that is not a fraud is played in the open and costs nothing when it is
 * seen. That is not generosity: a contract signed at the table, a coin minted a
 * year ago, a vow taken out loud are all things the game has no rule against.
 */
export function playTechnique(
  game: MorenaGame,
  options: { random?: () => number } = {},
): MorenaGame {
  if (game.phase === 'over') return unchanged(game)
  const kind = game.technique
  if (!kind) return unchanged(game)
  const move = moveFor(kind)
  if (game.spent >= move.uses) return unchanged(game)

  const random = options.random ?? Math.random
  const seen = move.fraud && random() < move.exposure * game.watch

  let next: MorenaGame = {
    ...game,
    spent: game.spent + 1,
    log: [...game.log, { kind: 'played', round: game.round, technique: kind, seen }],
  }

  switch (move.effect) {
    case 'read':
      next = { ...next, read: true }
      break

    // Which card she reaches for next. Read off the same shuffle she will use,
    // so what you are told is what happens — this is foresight, not a hint.
    case 'foresee': {
      const reach = Math.min(
        next.hand.length - 1,
        Math.max(0, Math.floor(random() * next.hand.length)),
      )
      next = { ...next, foreseen: next.hand[reach] ?? null }
      break
    }

    // The only legal pause in the game: a round that costs no answer. It does
    // not count as walking out, which is the whole of what makes it worth
    // having — three minutes of held attention is three minutes nobody left.
    case 'pass':
      next = {
        ...next,
        round: next.round + 1,
        phase: next.hand.length <= 1 ? 'settling' : 'asking',
      }
      break

    // A card out of the graveyard without the kiss. The kiss is Morena's price
    // for exactly this, so anything that does it for free is taking money out
    // of her hand — which is why most of these are frauds.
    case 'recover': {
      const back = next.graveyard[0]
      if (!back) break
      next = {
        ...next,
        hand: [...next.hand, back],
        graveyard: next.graveyard.slice(1),
        phase: 'asking',
        log: [...next.log, { kind: 'recovered', round: next.round, card: back }],
      }
      break
    }

    // A card that is not yours. It plays like any other until somebody touches
    // it, and this game ends in a kiss — see `takeTheDeal`.
    case 'forge': {
      const wanted: AnswerCard = next.hand.includes('yes') ? 'no' : 'yes'
      next = {
        ...next,
        forged: wanted,
        hand: [...next.hand, wanted],
        phase: 'asking',
      }
      break
    }

    case 'shield':
      next = { ...next, shielded: true }
      break

    // The room stops watching. Everything played after this is played in a
    // place that cannot report it.
    case 'hide':
      next = { ...next, watch: 0 }
      break

    // Somebody else in the chair. They have no desire for Morena to name and
    // nothing of their own to stake, so the game cannot be won through them —
    // it can only be survived. See `settle`.
    case 'proxy':
      next = { ...next, proxied: true }
      break

    // She cannot see, hear or speak, so she cannot ask the last question. A
    // game she cannot play is a game abandoned, and abandonment is punished on
    // both sides: this buys a draw and pays the full price for it.
    case 'blind':
      return {
        ...leaveTheTable(next),
        phase: 'over',
        verdict: 'cancelled',
        ending: 'abandoned',
        aftermath: ['proxied'],
      }

    case 'rider':
      break
  }

  if (move.rider && !next.riders.includes(move.rider)) {
    next = { ...next, riders: [...next.riders, move.rider] }
  }

  return seen ? narrowTheAnswer(next, 'cheating') : next
}

/**
 * Spend a question, and pay for it with an answer.
 *
 * The order matters and it is the order the manga plays: the guest asks first
 * and hears the reply, *then* Morena reaches. So a question is never asked into
 * a hand that has already been narrowed by the same round — you always know
 * more than you did, and you can always do less about it.
 */
export function askMorena(
  game: MorenaGame,
  question: QuestionCard,
  options: { random?: () => number } = {},
): MorenaGame {
  if (game.phase !== 'asking') return unchanged(game)
  if (!game.questions.includes(question)) return unchanged(game)
  // A hand of one is already settling; there is nothing left to pay with.
  if (game.hand.length <= 1) return unchanged(game)

  const random = options.random ?? Math.random
  const log: Beat[] = [...game.log, { kind: 'asked', round: game.round, question }]

  // Foresight is foresight: a technique that told you which card she would take
  // is not a hint that turns out to be wrong. She takes the card you were
  // shown, and the shuffle is only consulted when nothing showed you anything.
  const foreseen = game.foreseen && game.hand.includes(game.foreseen) ? game.foreseen : null
  const reach = foreseen
    ? game.hand.indexOf(foreseen)
    : Math.min(game.hand.length - 1, Math.max(0, Math.floor(random() * game.hand.length)))
  const taken = game.hand[reach]
  const hand = game.hand.filter((_, index) => index !== reach)
  log.push({ kind: 'taken', round: game.round, card: taken })

  const next: MorenaGame = {
    ...game,
    round: game.round + 1,
    questions: game.questions.filter((held) => held !== question),
    asked: [...game.asked, question],
    hand,
    graveyard: [...game.graveyard, taken],
    // A forged card she has taken is a forged card off the table: nothing is
    // left to expose, and the fraud goes with it.
    forged: game.forged === taken ? null : game.forged,
    // Spent. Seeing one round ahead is not seeing the game.
    foreseen: null,
    log,
  }

  // The kiss is offered the moment refusing it starts to cost something: two
  // answers left, one of which is about to go. Once only, and only if the
  // graveyard has anything worth buying back.
  if (!next.dealt && !next.kissed && next.hand.length === 2 && next.graveyard.length > 0) {
    next.dealt = true
    next.phase = 'deal'
    next.log = [...log, { kind: 'offered', round: next.round }]
    return next
  }

  next.phase = next.hand.length <= 1 ? 'settling' : 'asking'
  return next
}

/**
 * Take the kiss, and take a card back out of the graveyard.
 *
 * The kiss is one of the three conditions of Contagion in its own right, which
 * is why this is a trade and not a gift: the guest buys back the answer they
 * needed and hands over a third of the infection to do it. A No won with a
 * kissed mouth is still a No — the other two conditions are not met — but the
 * game has already had its way with them.
 */
export function takeTheDeal(game: MorenaGame, card: AnswerCard): MorenaGame {
  if (game.phase !== 'deal') return unchanged(game)
  if (!game.graveyard.includes(card)) return unchanged(game)
  const graveyard = [...game.graveyard]
  graveyard.splice(graveyard.indexOf(card), 1)
  const kissed: MorenaGame = {
    ...game,
    phase: 'asking',
    kissed: true,
    hand: [...game.hand, card],
    graveyard,
    log: [
      ...game.log,
      { kind: 'kissed', round: game.round, card },
      { kind: 'recovered', round: game.round, card },
    ],
  }

  // The canon undoing of Texture Surprise is touch, and the one touch this game
  // contains is the kiss. A guest who forged a card and then took the deal has
  // handed Morena the fraud along with their mouth — which is the whole shape
  // of that capability at this table: it wins a game it cannot conclude.
  if (kissed.forged) {
    return narrowTheAnswer(
      {
        ...kissed,
        log: [...kissed.log, { kind: 'exposed', round: kissed.round, card: kissed.forged }],
      },
      'cheating',
    )
  }

  return kissed
}

/** Refuse it, and get on with the hand you have. */
export function refuseTheDeal(game: MorenaGame): MorenaGame {
  if (game.phase !== 'deal') return unchanged(game)
  return {
    ...game,
    phase: game.hand.length <= 1 ? 'settling' : 'asking',
    log: [...game.log, { kind: 'declined', round: game.round }],
  }
}

/** The one card left, once the questions have been paid for. */
export function lastCard(game: MorenaGame): AnswerCard | null {
  return game.hand.length === 1 ? game.hand[0] : null
}

/**
 * Whether settling the game still needs something from the guest.
 *
 * A Joker has to be pointed at Yes or No, and a Back has to name what it is
 * pulling out of the graveyard. The other three answer for themselves.
 */
export function needsAChoice(game: MorenaGame): 'joker' | 'back' | null {
  const card = lastCard(game)
  if (card === 'joker') return 'joker'
  if (card === 'back') return game.graveyard.length > 0 ? 'back' : null
  return null
}

/** What a settled card is worth, before the marking is taken into account. */
function verdictOf(card: AnswerCard): Verdict {
  if (card === 'yes') return 'infected'
  if (card === 'x') return 'cancelled'
  return 'refused'
}

/**
 * What the riders did, once the last card is down.
 *
 * Every one of these answers a gap the canon leaves open rather than a rule it
 * states: the game produces a word, and a word binds nobody. What each rider
 * does is decide what that word was worth — and none of them changes the word.
 */
function payTheRiders(game: MorenaGame, verdict: Verdict): Aftermath[] {
  const said = verdict === 'infected' || verdict === 'forced'
  const paid: Aftermath[] = []

  // Moonlight Act: terms, duration, penalties, enforced by Manipulation. The
  // one capability that turns a spoken answer into something anybody can hold
  // the other to — which cuts both ways, and is why it is not a fraud.
  if (game.riders.includes('bound') && verdict !== 'cancelled') paid.push('bound')

  // The Sun and Moon marks by contact, and the kiss is a contact. No kiss, no
  // mark: the mechanic is paid out of Morena's own second condition.
  if (game.riders.includes('moon') && game.kissed) paid.push('moon')

  // Skill Hunter needs the ability seen in action, its owner questioned and
  // answering, and the imprint touched — inside an hour. A negotiation game in
  // a closed room is the one place in the canon where all three fall out of the
  // thing itself: she deals, she answers, she kisses.
  if (game.riders.includes('stolen') && game.kissed && game.asked.length > 0) {
    paid.push('stolen')
  }

  // Judgment Chain, pointed at oneself: "I will not answer Yes." It is the only
  // true immunity to the Manipulation, and it is priced at a life.
  if (game.riders.includes('sworn') && said) paid.push('sworn-struck')

  // Gallery Fake: the copy is inert and gone inside a day. The fraud is not
  // detected at the table, it is detected the morning after — when the game is
  // closed and Morena has been paid in something that no longer exists.
  if (game.riders.includes('smoke')) paid.push('smoke')

  // Three-Lie Transformation taxes the bluff, for both players. It is the only
  // arrangement at this table under which playing honestly is strictly better.
  if (game.riders.includes('taxed')) paid.push('taxed')

  // Desire Trap opens by naming what the other one wants, which is Morena's own
  // opening played back at her.
  if (game.riders.includes('trapped')) paid.push('trapped')

  // The dissuasive family: your death is not worth having. It answers the clause
  // that the game ends at the death of the target — and Morena does not kill her
  // candidates in any case, she recruits them.
  if (game.riders.includes('deterred')) paid.push('deterred')

  // Somebody else was in the chair. A puppet has no desire to be named and
  // nothing of its own to stake, so a Yes taken off one is a Yes taken off
  // nobody: the game is capped at a draw, which is the correct price for the
  // best-hidden fraud in the list.
  if (game.proxied) paid.push('proxied')

  return paid
}

/**
 * Play the last card.
 *
 * `choice` is the Joker's direction, or the card a Back is reaching for. A Back
 * with an empty graveyard is nothing — there is no answer behind it — and reads
 * as a refusal, which is what a guest who spent everything and kept the wrong
 * card has actually done.
 *
 * The marking is checked on what the guest *reaches for*, not on what they end
 * up with: Morena marked a card so that touching it would open the door, and a
 * Back pulled off a marked slot hands her the answer whatever was written on
 * the card behind it.
 */
export function settle(game: MorenaGame, choice?: AnswerCard | 'yes' | 'no'): MorenaGame {
  if (game.phase !== 'settling') return unchanged(game)
  const card = lastCard(game)
  if (!card) return unchanged(game)

  /**
   * The card that was played stays on the table.
   *
   * A hand emptied at the end leaves the guest's side of the table bare, which
   * is the one thing that never happens: the answer is lying there face up,
   * and it is the only thing in the room anybody is looking at.
   */
  const close = (finalCard: AnswerCard, verdict: Verdict, extra: Beat[] = []): MorenaGame => {
    const aftermath = payTheRiders(game, verdict)
    return {
      ...game,
      phase: 'over',
      ending: 'played',
      hand: [finalCard],
      graveyard:
        finalCard === card
          ? game.graveyard
          : [...game.graveyard.filter((buried) => buried !== finalCard), card],
      verdict,
      finalCard,
      aftermath,
      log: [
        ...game.log,
        ...extra,
        { kind: 'settled', round: game.round, card: finalCard, verdict },
        ...aftermath.map((what): Beat => ({ kind: 'aftermath', round: game.round, what })),
      ],
    }
  }

  // Reaching for the marked card is the cheat springing. The manipulative half
  // of Contagion narrows the answer to Yes or No and Morena picks the Yes.
  if (game.marked === card) return close(card, 'forced')

  if (card === 'joker') {
    if (choice !== 'yes' && choice !== 'no') return unchanged(game)
    return close(choice, verdictOf(choice))
  }

  if (card === 'back') {
    if (game.graveyard.length === 0) return close('back', 'refused')
    if (!choice || !game.graveyard.includes(choice as AnswerCard)) return unchanged(game)
    const recovered = choice as AnswerCard
    // A Back that pulls a Joker still has to be pointed somewhere, and there is
    // nothing left to point it with: an unaimed Joker is a refusal.
    if (recovered === 'joker') {
      return close('joker', 'refused', [{ kind: 'recovered', round: game.round, card: recovered }])
    }
    return close(recovered, verdictOf(recovered), [
      { kind: 'recovered', round: game.round, card: recovered },
    ])
  }

  return close(card, verdictOf(card))
}

/**
 * The three conditions of Contagion, as this game left them.
 *
 * Winning the Yes is one of them; the kiss is another; the murder the recruit
 * has to witness happens after the table is cleared and is not this game's to
 * give. Reported rather than judged, because the interesting outcome is the
 * one where the guest walks out kissed and uninfected.
 */
export function infectionAfter(game: MorenaGame): {
  said: boolean
  kissed: boolean
  witnessed: boolean
  level: number | null
  /** Whether the answer, and everything after it, landed on somebody else. */
  proxied: boolean
  /** Whether Contagion itself changed hands at this table. */
  stolen: boolean
} {
  const said = game.verdict === 'infected' || game.verdict === 'forced'
  const stolen = game.aftermath.includes('stolen')
  // A Yes given by a puppet is a Yes given by nobody: the person who sat down
  // is not the person who was recruited, and the caster was never at the table
  // to be infected. It is the correct ceiling for the best-hidden fraud there
  // is — the proxy protects you and cannot win for you.
  const onMe = said && !game.proxied
  return {
    said,
    kissed: game.kissed && !game.proxied,
    witnessed: false,
    level: onMe ? 0 : null,
    proxied: game.proxied,
    stolen,
  }
}

// ── What the game hands back to Contagion ──────────────────────────

/**
 * The three canonical conditions of Contagion, in the order they are met.
 *
 * They live here rather than in `module.ts` because the first of them *is*
 * this game: the checklist step named `game-won-yes` is what a hand played to
 * a Yes produces, and the second is a card bought with a kiss. Only the third
 * happens after the table has been cleared.
 */
export const INFECTION_STEPS = ['game-won-yes', 'kiss', 'witnessed-murder'] as const

export type InfectionStep = (typeof INFECTION_STEPS)[number]

/**
 * Which of the three conditions this hand actually established.
 *
 * The shape `checklist()` wants: a list to hand back as `completedSteps` when
 * Morena comes to spend the game on an infection. A game that has not closed
 * establishes nothing — a Yes is only a Yes once the last card is down.
 *
 * A proxied game establishes nothing either. The puppet said it and the puppet
 * was kissed; whoever cast it was never at the table to be infected.
 */
export function infectionStepsFrom(game: MorenaGame): InfectionStep[] {
  if (game.phase !== 'over' || game.proxied) return []
  const met: InfectionStep[] = []
  if (game.verdict === 'infected' || game.verdict === 'forced') met.push('game-won-yes')
  if (game.kissed) met.push('kiss')
  return met
}

/**
 * The game flattened into effect attributes.
 *
 * Two readings of the same move, deliberately. The flat counters are what a
 * timeline projection or a dashboard column reads without deserialising
 * anything; `game` is the state itself, so a branch can be replayed to the
 * exact hand rather than to a summary of it. `docs/jeu-de-morena.md` §4.2 asks
 * for one event per move, and this is what that event carries.
 *
 * Everything here survives `JSON.parse(JSON.stringify(...))`, which is what the
 * world reducer does to the whole state on every event.
 */
export function summariseGame(game: MorenaGame): Record<string, unknown> {
  return {
    round: game.round,
    phase: game.phase,
    questionsLeft: game.questions.length,
    answersLeft: game.hand.length,
    asked: [...game.asked],
    hand: [...game.hand],
    graveyard: [...game.graveyard],
    kissed: game.kissed,
    manipulated: game.manipulated,
    shielded: game.shielded,
    proxied: game.proxied,
    technique: game.technique,
    riders: [...game.riders],
    aftermath: [...game.aftermath],
    verdict: game.verdict,
    finalCard: game.finalCard,
    ending: game.ending,
    completedSteps: infectionStepsFrom(game),
    game: JSON.parse(JSON.stringify(game)) as MorenaGame,
  }
}

/**
 * Why the game stopped, in the vocabulary the canon gives it.
 *
 * Three endings and no others: the hand is played out, Morena dies, or the
 * candidate does. A game that is merely paused has not ended — the canon has
 * one running across whole volumes, and `state: ACTIVE` says exactly that.
 */
export type GameEnding = 'game-completed' | 'morena-dead' | 'target-dead'
