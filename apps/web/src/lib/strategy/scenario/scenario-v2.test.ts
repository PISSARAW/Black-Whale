import { describe, expect, it } from 'vitest'
import factions from '../../../../../../data/factions/factions.json'
import locations from '../../../../../../data/locations/locations.json'
import characters from '../../../../../../data/characters/characters.json'
import { GUARDS_359_SCENARIO } from './guards359'
import { requireStrategyScenario } from './registry'
import { validateStrategyScenario } from './validate'

const context = {
  factionIds: new Set(factions.map((entry) => entry.id)),
  characterIds: new Set(characters.map((entry) => entry.id)),
  locationIds: new Set(locations.map((entry) => entry.id)),
}

describe('StrategyScenarioV2', () => {
  it('registers the versioned guards scenario', () => {
    expect(requireStrategyScenario().schemaVersion).toBe(2)
    expect(requireStrategyScenario().playableFactions).toHaveLength(3)
  })

  it('references production factions, characters and locations', () => {
    expect(validateStrategyScenario(GUARDS_359_SCENARIO, context)).toEqual([])
  })

  it('reports precise invalid references and impossible values', () => {
    const invalid = structuredClone(GUARDS_359_SCENARIO)
    invalid.locationIds.push('invented-room')
    invalid.events[0].turn = 99
    expect(validateStrategyScenario(invalid, context)).toEqual(
      expect.arrayContaining([
        { path: 'locationIds', message: 'unknown location invented-room' },
        { path: 'events.security-alert.turn', message: 'outside scenario duration' },
      ]),
    )
  })
})
