import { describe, expect, it } from 'vitest'
import { buildCombatTerrain } from './terrain'
import { ArenaRecorder } from './replay/recorder'
import { initialCombatState } from '../combat/reducer'
import { freshArenaProfile, loadArenaProfile, recordArenaResult, saveArenaProfile } from './profile'
import { DEFAULT_REPLAY_MATCH } from './replay/types'

function replay() {
  const terrain = buildCombatTerrain()
  const setup = {
    playerAt: terrain.spawns[0],
    opponentAt: terrain.spawns[1],
    terrain: { id: terrain.id, footprint: terrain.footprint, walls: terrain.walls },
  }
  const recorder = new ArenaRecorder({ setup, doctrine: 'counter', difficulty: 'fighter' })
  recorder.record({ type: 'MODE', side: 'player', mode: 'ren' })
  recorder.record({ type: 'RYU', side: 'player', attackShare: 0.7 })
  return recorder.finish(initialCombatState(setup))
}

describe('Arena V3 profile', () => {
  it('persists versioned progression and recovers from invalid data', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }
    saveArenaProfile(storage, freshArenaProfile())
    expect(loadArenaProfile(storage).unlocked).toContain('initiation')
    values.clear()
    expect(loadArenaProfile(storage).bouts).toBe(0)
  })

  it('learns only techniques actually issued and keeps the best grade', () => {
    const first = recordArenaResult(freshArenaProfile(), {
      replay: replay(),
      challengeId: 'ryu',
      result: { complete: true, satisfied: [true], grade: 'A' },
    })
    const second = recordArenaResult(first, {
      replay: replay(),
      challengeId: 'ryu',
      result: { complete: false, satisfied: [false], grade: 'C' },
    })
    expect(second.mastery.ren).toBe(2)
    expect(second.mastery.ryu).toBe(2)
    expect(second.mastery.ko).toBe(0)
    expect(second.bestGrades.ryu).toBe('A')
    expect(second.replayIds).toHaveLength(1)
  })

  it('does not throw when browser persistence is unavailable', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota')
      },
    }
    expect(saveArenaProfile(storage, freshArenaProfile())).toBe(false)
  })

  it('advances campaign only for the exact mission preset', () => {
    const terrain = buildCombatTerrain('tier-1-banquet-hall')
    const setup = {
      playerAt: terrain.spawns[0],
      opponentAt: terrain.spawns[1],
      terrain: { id: terrain.id, footprint: terrain.footprint, walls: terrain.walls },
    }
    const recorder = new ArenaRecorder({
      setup,
      doctrine: 'counter',
      difficulty: 'initiate',
      match: {
        ...DEFAULT_REPLAY_MATCH,
        opponentId: 'counter-student',
        challengeId: 'ryu',
        missionId: 'initiation',
      },
    })
    const valid = recorder.finish(initialCombatState(setup))
    const result = { complete: true, satisfied: [true], grade: 'S' as const }
    expect(
      recordArenaResult(freshArenaProfile(), { replay: valid, challengeId: 'ryu', result })
        .unlocked,
    ).toContain('ryu')
    expect(
      recordArenaResult(freshArenaProfile(), {
        replay: { ...valid, match: { ...valid.match, missionId: null } },
        challengeId: 'ryu',
        result,
      }).unlocked,
    ).not.toContain('ryu')
  })
})
