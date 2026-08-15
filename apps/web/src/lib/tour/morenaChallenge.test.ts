import { dealTheGame, type MorenaGame } from '@black-whale/ability-modules'
import { describe, expect, it } from 'vitest'
import {
  challengeOutcome,
  decodeMorenaChallenge,
  encodeMorenaChallenge,
  morenaChallengeRandom,
  nextMorenaChallenge,
  type MorenaChallenge,
} from './morenaChallenge'

const finished = (
  verdict: MorenaGame['verdict'],
  ending: MorenaGame['ending'] = 'played',
): MorenaGame => ({ ...dealTheGame(), phase: 'over', verdict, ending, round: 6 })

describe('Morena shared challenges', () => {
  it('round-trips a compact, language-neutral invitation', () => {
    const challenge: MorenaChallenge = {
      v: 1,
      seed: 0xf00dcafe,
      streak: 7,
      rounds: 5,
      verdict: 'forced',
      marked: 'back',
    }
    expect(decodeMorenaChallenge(encodeMorenaChallenge(challenge))).toEqual(challenge)
  })

  it('rejects malformed and inflated invitations', () => {
    expect(decodeMorenaChallenge('not-json')).toBeNull()
    expect(decodeMorenaChallenge('a'.repeat(257))).toBeNull()
    expect(
      decodeMorenaChallenge(
        btoa(
          JSON.stringify({
            v: 1,
            seed: -1,
            streak: 1,
            rounds: 2,
            verdict: 'forced',
            marked: 'back',
          }),
        ),
      ),
    ).toBeNull()
  })

  it('only extends the chain after Morena wins a completed hand', () => {
    expect(challengeOutcome(finished('infected'))).toBe('morena')
    expect(challengeOutcome(finished('forced'))).toBe('morena')
    expect(challengeOutcome(finished('refused'))).toBe('player')
    expect(challengeOutcome(finished('cancelled'))).toBe('player')
    expect(challengeOutcome(finished('cancelled', 'abandoned'))).toBe('abandoned')
    expect(nextMorenaChallenge(finished('forced'), 42, 3)).toMatchObject({
      seed: 42,
      streak: 4,
      rounds: 6,
      verdict: 'forced',
      marked: 'back',
    })
    expect(nextMorenaChallenge(finished('refused'), 42, 3)).toBeNull()
  })

  it('replays the same random draw from the same seed', () => {
    const a = morenaChallengeRandom(1234)
    const b = morenaChallengeRandom(1234)
    expect([a(), a(), a(), a()]).toEqual([b(), b(), b(), b()])
  })
})
