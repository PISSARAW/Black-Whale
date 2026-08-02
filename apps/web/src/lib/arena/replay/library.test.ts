import { describe, expect, it } from 'vitest'
import { initialCombatState } from '../../combat/reducer'
import { buildCombatTerrain } from '../terrain'
import { ArenaRecorder } from './recorder'
import { challengeSeed, compareReplays, loadReplayLibrary, saveReplayToLibrary } from './library'

function replay() {
  const terrain = buildCombatTerrain()
  const setup = {
    playerAt: terrain.spawns[0],
    opponentAt: terrain.spawns[1],
    terrain: { id: terrain.id, footprint: terrain.footprint, walls: terrain.walls },
  }
  return new ArenaRecorder(setup, 'counter', 'fighter').finish(initialCombatState(setup))
}

describe('Arena V3 replay library', () => {
  it('stores authenticated replays without duplicates', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }
    const item = replay()
    saveReplayToLibrary(storage, item)
    saveReplayToLibrary(storage, item)
    expect(loadReplayLibrary(storage)).toHaveLength(1)
  })

  it('produces stable asynchronous challenge seeds and comparisons', () => {
    const item = replay()
    expect(challengeSeed(item)).toBe(challengeSeed(item))
    expect(compareReplays(item, item)).toEqual({
      durationDelta: 0,
      commandDelta: 0,
      hitDelta: 0,
      auraDelta: 0,
    })
  })
})
