import { TABLE_KINDS } from '@black-whale/ability-modules'
import type { AnswerCard, MorenaGame, TableKind, Verdict } from '@black-whale/ability-modules'

const VERSION = 2
const MAX_STREAK = 999
const MAX_ROUNDS = 99

export type MorenaChallengeVerdict = Extract<Verdict, 'infected' | 'forced'>

export interface MorenaChallengeLoadout {
  technique: TableKind | null
  bookmark: TableKind | null
}

export interface MorenaChallenge {
  v: typeof VERSION
  /** Deterministic card removals and non-detection technique effects. */
  seed: number
  /** A separate stream for LSDF detection checks. */
  detectionSeed: number
  /** Consecutive players Morena has beaten before the recipient sits down. */
  streak: number
  /** How long the player who sent the invitation lasted. */
  rounds: number
  /** How Morena beat the sender. */
  verdict: MorenaChallengeVerdict
  /** The original table may be canonical or clean; the recipient gets the same one. */
  marked: AnswerCard | null
  /** The exact technique pages carried by the sender. */
  loadout: MorenaChallengeLoadout
}

interface LegacyMorenaChallenge extends Omit<MorenaChallenge, 'v' | 'detectionSeed' | 'loadout'> {
  v: 1
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
  options: { previousStreak: number; detectionSeed?: number },
): MorenaChallenge | null {
  if (challengeOutcome(game) !== 'morena') return null
  return {
    v: VERSION,
    seed: seed >>> 0,
    detectionSeed: (options.detectionSeed ?? morenaDetectionSeed(seed)) >>> 0,
    streak: Math.min(MAX_STREAK, Math.max(0, options.previousStreak) + 1),
    rounds: Math.min(MAX_ROUNDS, Math.max(1, Math.trunc(game.round))),
    verdict: game.verdict as MorenaChallengeVerdict,
    marked: game.marked,
    loadout: {
      technique: game.technique,
      bookmark: game.bookmark?.kind ?? null,
    },
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

function isTableKind(value: unknown): value is TableKind | null {
  return value === null || TABLE_KINDS.includes(value as TableKind)
}

function isLoadout(value: unknown): value is MorenaChallengeLoadout {
  if (!value || typeof value !== 'object') return false
  const loadout = value as Partial<MorenaChallengeLoadout>
  return isTableKind(loadout.technique) && isTableKind(loadout.bookmark)
}

function isMorenaChallenge(value: Partial<MorenaChallenge>): value is MorenaChallenge {
  if (value.v !== VERSION) return false
  if (!integerInRange(value.seed, 0, 0xffffffff)) return false
  if (!integerInRange(value.detectionSeed, 0, 0xffffffff)) return false
  if (!integerInRange(value.streak, 1, MAX_STREAK)) return false
  if (!integerInRange(value.rounds, 1, MAX_ROUNDS)) return false
  if (!isChallengeVerdict(value.verdict)) return false
  return isAnswerCard(value.marked) && isLoadout(value.loadout)
}

function isLegacyChallenge(value: Partial<LegacyMorenaChallenge>): value is LegacyMorenaChallenge {
  if (value.v !== 1) return false
  if (!integerInRange(value.seed, 0, 0xffffffff)) return false
  if (!integerInRange(value.streak, 1, MAX_STREAK)) return false
  if (!integerInRange(value.rounds, 1, MAX_ROUNDS)) return false
  if (!isChallengeVerdict(value.verdict)) return false
  return isAnswerCard(value.marked)
}

/** Stable second stream for old links and newly generated challenges alike. */
export const morenaDetectionSeed = (seed: number): number =>
  (Math.imul(seed >>> 0, 0x9e3779b1) ^ 0xa5a5a5a5) >>> 0

export function decodeMorenaChallenge(encoded: string | null): MorenaChallenge | null {
  if (!encoded || encoded.length > 512) return null
  try {
    const padded = encoded
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(encoded.length + ((4 - (encoded.length % 4)) % 4), '=')
    const value = JSON.parse(atob(padded)) as Record<string, unknown>
    if (isMorenaChallenge(value)) return value
    if (!isLegacyChallenge(value)) return null
    return {
      ...value,
      v: VERSION,
      detectionSeed: morenaDetectionSeed(value.seed),
      loadout: { technique: null, bookmark: null },
    }
  } catch {
    return null
  }
}

/** One addressable value in the deterministic stream, suitable for persistence. */
export function morenaChallengeValue(seed: number, index: number): number {
  const state = (seed + Math.imul(Math.max(0, Math.trunc(index)) + 1, 0x6d2b79f5)) >>> 0
  let mixed = state
  mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
  mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
  return ((mixed ^ (mixed >>> 14)) >>> 0) / 0x100000000
}

/** Small deterministic generator: the same invitation starts from the same draw. */
export function morenaChallengeRandom(seed: number, offset = 0): () => number {
  let index = Math.max(0, Math.trunc(offset))
  return () => morenaChallengeValue(seed, index++)
}

export const newMorenaChallengeSeed = (random: () => number = Math.random): number =>
  Math.floor(random() * 0x100000000) >>> 0
