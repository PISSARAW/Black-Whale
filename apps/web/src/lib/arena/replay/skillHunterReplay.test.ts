import { describe, expect, it } from 'vitest'
import { combatReducer } from '../../combat/reducer'
import { initialCombatState } from '../../combat/types'
import { initialArenaMatchState } from '../match'
import { ArenaRecorder } from './recorder'
import { playReplay } from './player'
import { DEFAULT_REPLAY_MATCH } from './types'

describe('Skill Hunter replay', () => {
  it('reconstructs the fifth page, its seal and the selected book slot', () => {
    const setup = {
      playerAt: [0, 0] as const,
      opponentAt: [1, 0] as const,
      terrain: initialCombatState().terrain,
    }
    const match = {
      ...DEFAULT_REPLAY_MATCH,
      fighterId: 'chrollo' as const,
      opponentFighterId: 'hisoka' as const,
    }
    const action = {
      type: 'FIGHTING_MOVE',
      side: 'player',
      fighterId: 'chrollo',
      slot: 'forwardSpecial',
      targetAt: [1, 0],
    } as const
    const initial = {
      ...initialArenaMatchState(setup, match),
      lastHatsuBySide: { player: null, opponent: 'bungee-gum' },
    }
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

    expect(played.state.player.skillHunterBook).toEqual(state.player.skillHunterBook)
    expect(played.state.nenEffects).toEqual(state.nenEffects)
    expect(played.checksum).toBe(replay.checksum)
  })
})
