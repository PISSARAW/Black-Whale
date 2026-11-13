import { describe, expect, it } from 'vitest'
import { EMPTY_INFECTION_PROGRESS, dealTheGame } from './morena'
import { morenaChallengeRandom } from './morenaChallenge'
import {
  MAX_MORENA_SAVE_BYTES,
  decodeMorenaSave,
  encodeMorenaSave,
  type MorenaSaveV1,
} from './morenaPersistence'

const save = (): MorenaSaveV1 => ({
  version: 1,
  savedAt: '2026-11-13T00:00:00.000Z',
  active: {
    game: dealTheGame(),
    choice: null,
    mode: 'canonical',
    seed: 12,
    detectionSeed: 34,
    drawCursor: 2,
    detectionCursor: 1,
    previousStreak: 0,
    loadout: { tableKind: null, carryingBook: false },
    epilogue: null,
    emperorTimeLifeHours: 0,
  },
  labUnlocked: false,
  labHatsuId: null,
  discoveredQuestions: ['goal'],
  history: [],
  progress: EMPTY_INFECTION_PROGRESS,
})

describe('Morena save codec', () => {
  it('round-trips a resumable deterministic hand', () => {
    expect(decodeMorenaSave(encodeMorenaSave(save()))).toMatchObject({
      version: 1,
      active: { seed: 12, drawCursor: 2 },
      discoveredQuestions: ['goal'],
    })
  })

  it('rejects unknown versions, invalid games and oversized payloads', () => {
    expect(decodeMorenaSave('{"version":2}')).toBeNull()
    expect(decodeMorenaSave(JSON.stringify({ ...save(), active: { game: {} } }))).toBeNull()
    expect(decodeMorenaSave('x'.repeat(MAX_MORENA_SAVE_BYTES + 1))).toBeNull()
  })

  it('resumes the random stream from its persisted cursor', () => {
    const stream = morenaChallengeRandom(42)
    stream()
    stream()
    const expected = stream()
    expect(morenaChallengeRandom(42, 2)()).toBe(expected)
  })
})
