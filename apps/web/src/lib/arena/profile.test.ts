import { describe, expect, it } from 'vitest'
import { buildCombatTerrain } from './terrain'
import { ArenaRecorder } from './replay/recorder'
import { initialCombatState } from '../combat/reducer'
import { freshArenaProfile, loadArenaProfile, recordArenaResult, saveArenaProfile } from './profile'

function replay() {
  const terrain = buildCombatTerrain()
  const setup = {
    playerAt: terrain.spawns[0],
    opponentAt: terrain.spawns[1],
    terrain: { id: terrain.id, footprint: terrain.footprint, walls: terrain.walls },
  }
  const recorder = new ArenaRecorder(setup, 'counter', 'fighter')
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
    const first = recordArenaResult(freshArenaProfile(), replay(), 'ryu', {
      complete: true,
      satisfied: [true],
      grade: 'A',
    })
    const second = recordArenaResult(first, replay(), 'ryu', {
      complete: false,
      satisfied: [false],
      grade: 'C',
    })
    expect(second.mastery.ren).toBe(2)
    expect(second.mastery.ryu).toBe(2)
    expect(second.mastery.ko).toBe(0)
    expect(second.bestGrades.ryu).toBe('A')
    expect(second.replayIds).toHaveLength(1)
  })
})
