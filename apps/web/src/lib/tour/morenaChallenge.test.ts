import { dealTheGame, type MorenaGame } from '@black-whale/ability-modules'
import { describe, expect, it } from 'vitest'
import {
  challengeOutcome,
  decodeMorenaChallenge,
  encodeMorenaChallenge,
  morenaChallengeRandom,
  morenaDetectionSeed,
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
      v: 2,
      seed: 0xf00dcafe,
      detectionSeed: 0x0ddba11,
      streak: 7,
      rounds: 5,
      verdict: 'forced',
      marked: 'back',
      loadout: { technique: 'dowsing', bookmark: 'prophecy' },
    }
    expect(decodeMorenaChallenge(encodeMorenaChallenge(challenge))).toEqual(challenge)
  })

  it('rejects malformed and inflated invitations', () => {
    expect(decodeMorenaChallenge('not-json')).toBeNull()
    expect(decodeMorenaChallenge('a'.repeat(513))).toBeNull()
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

  it('upgrades old invitations to an honest hand with an independent detection stream', () => {
    const seed = 407
    const legacy = btoa(
      JSON.stringify({
        v: 1,
        seed,
        streak: 2,
        rounds: 4,
        verdict: 'infected',
        marked: 'back',
      }),
    )

    expect(decodeMorenaChallenge(legacy)).toEqual({
      v: 2,
      seed,
      detectionSeed: morenaDetectionSeed(seed),
      streak: 2,
      rounds: 4,
      verdict: 'infected',
      marked: 'back',
      loadout: { technique: null, bookmark: null },
    })
  })

  it('only extends the chain after Morena wins a completed hand', () => {
    expect(challengeOutcome(finished('infected'))).toBe('morena')
    expect(challengeOutcome(finished('forced'))).toBe('morena')
    expect(challengeOutcome(finished('refused'))).toBe('player')
    expect(challengeOutcome(finished('cancelled'))).toBe('player')
    expect(challengeOutcome(finished('cancelled', 'abandoned'))).toBe('abandoned')
    const loaded = { ...finished('forced'), technique: 'dowsing' as const }
    expect(nextMorenaChallenge(loaded, 42, { previousStreak: 3, detectionSeed: 84 })).toMatchObject(
      {
        v: 2,
        seed: 42,
        detectionSeed: 84,
        streak: 4,
        rounds: 6,
        verdict: 'forced',
        marked: 'back',
        loadout: { technique: 'dowsing', bookmark: null },
      },
    )
    expect(nextMorenaChallenge(finished('refused'), 42, { previousStreak: 3 })).toBeNull()
  })

  it('replays the same random draw from the same seed', () => {
    const a = morenaChallengeRandom(1234)
    const b = morenaChallengeRandom(1234)
    expect([a(), a(), a(), a()]).toEqual([b(), b(), b(), b()])
  })
})
