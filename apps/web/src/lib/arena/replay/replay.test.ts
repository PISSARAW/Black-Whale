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
    const recorder = new ArenaRecorder({
      setup: combatSetup,
      doctrine: 'artillery',
      difficulty: 'master',
    })
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
      state = advanceArena(state, 1 / 60, { doctrine: 'artillery', difficulty: 'master' })
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

  it('replays the player blow that ends the match after the last tick', () => {
    const setup = { playerAt: [0, 0] as const, opponentAt: [1.5, 0] as const }
    const combatSetup = { ...setup, terrain: initialCombatState().terrain }
    const recorder = new ArenaRecorder({
      setup: combatSetup,
      doctrine: 'counter',
      difficulty: 'initiate',
    })
    let state = initialCombatState(combatSetup)
    for (let tick = 0; tick < 20_000 && state.outcome === 'playing'; tick += 1) {
      if (state.player.cooldown <= 0 && state.player.condition === 'ready') {
        const action = { type: 'STRIKE', side: 'player', zone: 'head' } as const
        recorder.record(action)
        state = combatReducer(state, action)
        if (state.outcome !== 'playing') break
      }
      state = advanceArena(state, 1 / 60, { doctrine: 'counter', difficulty: 'initiate' })
      recorder.advance()
    }

    const replay = recorder.finish(state)
    expect(state.outcome).toBe('won')
    expect(replay.commands.at(-1)?.tick).toBe(replay.ticks)
    expect(playReplay(replay).state.outcome).toBe('won')
    expect(parseReplay(serializeReplay(replay))).toEqual(replay)
  })

  it('rejects tampered and unknown replay payloads', () => {
    expect(() => parseReplay('{"version":99}')).toThrow('Invalid Arena replay')
  })

  it('coalesces camera reports made during the same simulation tick', () => {
    const state = initialCombatState()
    const recorder = new ArenaRecorder({
      setup: {
        playerAt: state.player.position,
        opponentAt: state.opponent.position,
        terrain: state.terrain,
      },
      doctrine: 'counter',
      difficulty: 'fighter',
    })
    recorder.record({ type: 'SYNC_POSITION', side: 'player', position: [1, 0] })
    recorder.record({ type: 'SYNC_POSITION', side: 'player', position: [2, 0] })
    const replay = recorder.finish(
      combatReducer(state, { type: 'SYNC_POSITION', side: 'player', position: [2, 0] }),
    )
    expect(replay.commands).toHaveLength(1)
    expect(replay.commands[0].action).toEqual({
      type: 'SYNC_POSITION',
      side: 'player',
      position: [2, 0],
    })
    expect(playReplay(replay).checksum).toBe(replay.checksum)
  })
})
