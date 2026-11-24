import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from '../engine'
import type { FightState } from '../types'
import { matchVoiceLines } from './matchVoiceLines'

const ready = () => createFight('kurapika', 'chrollo', { mode: 'versus-local' })

describe('ship announcements', () => {
  it('announces the start once, then a tied final round', () => {
    const pending = ready()
    const running = beginFight(pending)
    expect(matchVoiceLines(pending, running)).toEqual(['start'])
    expect(matchVoiceLines(running, running)).toEqual([])
    const decisive: FightState = {
      ...pending,
      roundNumber: 3,
      roundsWon: { player: 1, opponent: 1 },
    }
    expect(matchVoiceLines(decisive, beginFight(decisive))).toEqual(['decisive'])
    expect(matchVoiceLines(null, { ...running, frame: 500 })).toEqual([])
    expect(matchVoiceLines(pending, { ...running, mode: 'training' })).toEqual([])
  })

  it('identifies a points decision at the time limit in the Heavens Arena', () => {
    const running: FightState = {
      ...beginFight(ready()),
      formatId: 'heavens-arena',
      score: { player: 4, opponent: 2 },
    }
    expect(
      matchVoiceLines(running, {
        ...running,
        phase: 'finished',
        finishReason: 'time',
        winner: 'player',
      }),
    ).toEqual(['time', 'points', 'player'])
  })

  it.each([
    ['knockout', 'opponent', null, ['knockout', 'opponent']],
    ['hits', 'player', 'player', ['points', 'player-match']],
    ['technical-knockout', 'player', null, ['technical', 'player']],
    ['expulsion', 'opponent', null, ['expulsion', 'opponent']],
    ['time', 'player', null, ['time', 'player']],
    ['time', 'draw', null, ['time', 'draw']],
  ] as const)(
    'announces %s only for the fresh verdict',
    (finishReason, winner, matchWinner, lines) => {
      const running = beginFight(ready())
      const result: FightState = {
        ...running,
        phase: 'finished',
        finishReason,
        winner,
        matchWinner,
      }
      expect(matchVoiceLines(running, result)).toEqual(lines)
      expect(matchVoiceLines(result, result)).toEqual([])
    },
  )
})
