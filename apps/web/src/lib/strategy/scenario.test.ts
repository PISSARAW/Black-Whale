import { describe, expect, it } from 'vitest'
import {
  SCENARIO_MAX_TURNS,
  buildScenarioRoster,
  scenarioEventForTurn,
  scenarioMoveChance,
  selectScenarioLocationIds,
} from './scenario'

describe('strategy scenario', () => {
  it('builds a closed three-faction roster around the player', () => {
    const factions = ['prince-benjamin', 'prince-camilla', 'prince-woble', 'irrelevant'].map(
      (id) => ({ id }),
    )
    const roster = buildScenarioRoster(factions, 'prince-camilla')
    expect(roster).toHaveLength(3)
    expect(roster[0].id).toBe('prince-camilla')
  })

  it('keeps occupied locations inside the scenario', () => {
    const all = Array.from({ length: 20 }, (_, index) => `room-${index}`)
    const selected = selectScenarioLocationIds(all, ['room-19', 'room-18'])
    expect(selected).toContain('room-19')
    expect(selected).toContain('room-18')
    expect(selected).toHaveLength(12)
  })

  it('applies scheduled pressure to the AI', () => {
    expect(SCENARIO_MAX_TURNS).toBe(8)
    expect(scenarioEventForTurn(4)?.kind).toBe('BLACKOUT')
    expect(scenarioMoveChance(2)).toBeGreaterThan(scenarioMoveChance(1))
    expect(scenarioMoveChance(6)).toBeLessThan(scenarioMoveChance(1))
  })
})
