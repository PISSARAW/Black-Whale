import type { AnswerCard, MorenaGame, Verdict } from '@black-whale/ability-modules'

const VERSION = 1
const MAX_STREAK = 999
const MAX_ROUNDS = 99

export type MorenaChallengeVerdict = Extract<Verdict, 'infected' | 'forced'>

export interface MorenaChallenge {
  v: typeof VERSION
  /** The deterministic draw shared by every player in this chain. */
  seed: number
  /** Consecutive players Morena has beaten before the recipient sits down. */
  streak: number
  /** How long the player who sent the invitation lasted. */
  rounds: number
  /** How Morena beat the sender. */
  verdict: MorenaChallengeVerdict
  /** The original table may be canonical or clean; the recipient gets the same one. */
  marked: AnswerCard | null
}

export type MorenaChallengeOutcome = 'morena' | 'player' | 'abandoned' | 'unfinished'

export function challengeOutcome(game: MorenaGame): MorenaChallengeOutcome {
  if (game.phase !== 'over') return 'unfinished'
  if (game.ending !== 'played') return 'abandoned'
  if (game.verdict === 'infected' || game.verdict === 'forced') return 'morena'
  return game.verdict === 'refused' || game.verdict === 'cancelled' ? 'player' : 'abandoned'
}

export function nextMorenaChallenge(
  game: MorenaGame,
  seed: number,
  previousStreak: number,
): MorenaChallenge | null {
  if (challengeOutcome(game) !== 'morena') return null
  return {
    v: VERSION,
    seed: seed >>> 0,
    streak: Math.min(MAX_STREAK, Math.max(0, previousStreak) + 1),
    rounds: Math.min(MAX_ROUNDS, Math.max(1, Math.trunc(game.round))),
    verdict: game.verdict as MorenaChallengeVerdict,
    marked: game.marked,
  }
}

export function encodeMorenaChallenge(challenge: MorenaChallenge): string {
  const json = JSON.stringify(challenge)
  return btoa(json).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}

function integerInRange(value: unknown, minimum: number, maximum: number): value is number {
  return (
    typeof value === 'number' && Number.isInteger(value) && value >= minimum && value <= maximum
  )
}

function isChallengeVerdict(value: unknown): value is MorenaChallengeVerdict {
  return value === 'infected' || value === 'forced'
}

function isAnswerCard(value: unknown): value is AnswerCard | null {
  return (
    value === null ||
    value === 'yes' ||
    value === 'no' ||
    value === 'back' ||
    value === 'joker' ||
    value === 'x'
  )
}

function isMorenaChallenge(value: Partial<MorenaChallenge>): value is MorenaChallenge {
  if (value.v !== VERSION) return false
  if (!integerInRange(value.seed, 0, 0xffffffff)) return false
  if (!integerInRange(value.streak, 1, MAX_STREAK)) return false
  if (!integerInRange(value.rounds, 1, MAX_ROUNDS)) return false
  if (!isChallengeVerdict(value.verdict)) return false
  return isAnswerCard(value.marked)
}

export function decodeMorenaChallenge(encoded: string | null): MorenaChallenge | null {
  if (!encoded || encoded.length > 256) return null
  try {
    const padded = encoded
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(encoded.length + ((4 - (encoded.length % 4)) % 4), '=')
    const value = JSON.parse(atob(padded)) as Partial<MorenaChallenge>
    return isMorenaChallenge(value) ? value : null
  } catch {
    return null
  }
}

/** Small deterministic generator: the same invitation starts from the same draw. */
export function morenaChallengeRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = state
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 0x100000000
  }
}

export const newMorenaChallengeSeed = (random: () => number = Math.random): number =>
  Math.floor(random() * 0x100000000) >>> 0
