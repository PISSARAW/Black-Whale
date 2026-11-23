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

  it('reconstructs covered wounds and extracted blood in the checksum', () => {
    const setup = {
      playerAt: [0, 0] as const,
      opponentAt: [3, 0] as const,
      terrain: {
        id: 'blinky-blood-room',
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
    const initial = initialArenaMatchState(setup, match)
    initial.opponent = { ...initial.opponent, openWounds: 3, pluggingWounds: true }
    const action = {
      type: 'FIGHTING_MOVE',
      side: 'player',
      fighterId: 'shizuku',
      slot: 'finisher',
      targetAt: [3, 0],
    } as const
    const recorder = new ArenaRecorder({
      setup,
      match,
      doctrine: 'counter',
      difficulty: 'fighter',
      initialState: initial,
    })
    recorder.record(action)
    const state = combatReducer(initial, action)
    const replay = recorder.finish(state)
    const played = playReplay(replay)

    expect(played.state.opponent.bloodLoss).toBe(1)
    expect(played.state.opponent.openWounds).toBe(3)
    expect(played.checksum).toBe(replay.checksum)
  })
})
