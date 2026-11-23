import { describe, expect, it } from 'vitest'
import { combatReducer } from '../../combat/reducer'
import { initialArenaMatchState } from '../match'
import { ArenaRecorder } from './recorder'
import { playReplay } from './player'
import { DEFAULT_REPLAY_MATCH } from './types'

describe('Blinky replay', () => {
  it('records the selected solid and reconstructs its stored state', () => {
    const setup = {
      playerAt: [0, 0] as const,
      opponentAt: [8, 0] as const,
      terrain: {
        id: 'blinky-replay-room',
        footprint: [
          [-10, -10],
          [10, -10],
          [10, 10],
          [-10, 10],
        ] as [number, number][],
        walls: [],
      },
    }
    const match = {
      ...DEFAULT_REPLAY_MATCH,
      fighterId: 'shizuku' as const,
      opponentFighterId: 'hisoka' as const,
    }
    const action = {
      type: 'FIGHTING_MOVE',
      side: 'player',
      fighterId: 'shizuku',
      slot: 'neutralSpecial',
      targetAt: [3, 0],
      targetObject: { id: 'banquet-chair', position: [2, 0] },
    } as const
    const recorder = new ArenaRecorder({
      setup,
      match,
      doctrine: 'counter',
      difficulty: 'fighter',
    })
    recorder.record(action)
    const state = combatReducer(initialArenaMatchState(setup, match), action)
    const replay = recorder.finish(state)
    const played = playReplay(replay)

    expect(played.state.physicalObjects).toEqual(state.physicalObjects)
    expect(played.checksum).toBe(replay.checksum)
  })
})
