import { describe, expect, it } from 'vitest'
import { initialCombatState } from '../../combat/types'
import { ArenaRecorder } from '../replay/recorder'
import { evaluateChallenge } from './evaluate'

describe('Arena challenges', () => {
  it('evaluates mastery from replay commands rather than UI state', () => {
    const state = initialCombatState()
    const recorder = new ArenaRecorder(
      {
        playerAt: state.player.position,
        opponentAt: state.opponent.position,
        terrain: state.terrain,
      },
      'counter',
      'fighter',
    )
    recorder.record({ type: 'RYU', side: 'player', guard: 'head' })
    recorder.record({ type: 'RYU', side: 'player', guard: 'arms' })
    const replay = recorder.finish(state)
    const result = evaluateChallenge(
      {
        id: 'test',
        titleFr: '',
        titleEn: '',
        objectives: [{ kind: 'use', action: 'RYU', count: 2 }],
      },
      replay,
    )
    expect(result.complete).toBe(true)
    expect(result.grade).toBe('S')
  })
})
