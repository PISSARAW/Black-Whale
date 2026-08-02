import { describe, expect, it } from 'vitest'
import { combatReducer, initialCombatState } from '../../combat/reducer'
import { advanceArena } from '../ai'
import { ArenaRecorder } from './recorder'
import { playReplay } from './player'
import { parseReplay, serializeReplay } from './codec'
import { projectFrame } from './perspective'

describe('deterministic Arena replay', () => {
  it('reconstructs player commands, movement and AI to the same checksum', () => {
    const setup = initialCombatState().terrain
    const combatSetup = { playerAt: [0, 0] as const, opponentAt: [7, 0] as const, terrain: setup }
    const recorder = new ArenaRecorder(combatSetup, 'artillery', 'master')
    let state = initialCombatState(combatSetup)

    for (let tick = 0; tick < 180 && state.outcome === 'playing'; tick += 1) {
      if (tick === 2) {
        const action = { type: 'MODE', side: 'player', mode: 'ren' } as const
        recorder.record(action)
        state = combatReducer(state, action)
      }
      if (tick === 20) {
        const action = { type: 'SYNC_POSITION', side: 'player', position: [1, 0] } as const
        recorder.record(action)
        state = combatReducer(state, action)
      }
      if (tick === 40) {
        const action = { type: 'STRIKE', side: 'player', zone: 'torso' } as const
        recorder.record(action)
        state = combatReducer(state, action)
      }
      state = advanceArena(state, 1 / 60, 'artillery', 'master')
      recorder.advance()
    }

    const replay = recorder.finish(state)
    const played = playReplay(replay)
    expect(played.checksum).toBe(replay.checksum)
    expect(playReplay(replay).checksum).toBe(played.checksum)
    expect(parseReplay(serializeReplay(replay))).toEqual(replay)
  })

  it('projects concealed information according to each observer', () => {
    const base = initialCombatState()
    const state = {
      ...base,
      opponent: {
        ...base.opponent,
        in: true,
        guard: 'head' as const,
        intent: { zone: 'legs' as const, remaining: 0.3, targetAt: base.player.position },
      },
    }
    expect(projectFrame(state, 'player').opponent.reading?.intentZone).toBeNull()
    expect(projectFrame(state, 'reality').opponent.aura).toBe(100)
    expect(
      projectFrame({ ...state, player: { ...state.player, gyo: true } }, 'player').opponent.reading
        ?.intentZone,
    ).toBe('legs')
  })

  it('rejects tampered and unknown replay payloads', () => {
    expect(() => parseReplay('{"version":99}')).toThrow('Invalid Arena replay')
  })
})
