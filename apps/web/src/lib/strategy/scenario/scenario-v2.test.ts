import { describe, expect, it } from 'vitest'
import factions from '../../../../../../data/factions/factions.json'
import locations from '../../../../../../data/locations/locations.json'
import characters from '../../../../../../data/characters/characters.json'
import chapters from '../../../../../../data/chapters/chapters.json'
import { GUARDS_359_SCENARIO } from './guards359'
import { listStrategyScenarios, requireStrategyScenario } from './registry'
import { validateStrategyScenario } from './validate'

const context = {
  factionIds: new Set(factions.map((entry) => entry.id)),
  characterIds: new Set(characters.map((entry) => entry.id)),
  locationIds: new Set(locations.map((entry) => entry.id)),
  chapterNumbers: new Set(chapters.map((entry) => entry.number)),
  characterFirstChapter: Object.fromEntries(
    characters.map((entry) => [
      entry.id,
      Number(entry.firstAppearanceChapterId?.replace('ch-', '') ?? 0),
    ]),
  ),
}

describe('StrategyScenarioV2', () => {
  it('registers the versioned guards scenario', () => {
    expect(requireStrategyScenario().schemaVersion).toBe(2)
    expect(requireStrategyScenario().playableFactions).toHaveLength(3)
    expect(listStrategyScenarios()).toHaveLength(3)
  })

  it('references production factions, characters and locations', () => {
    for (const scenario of listStrategyScenarios())
      expect(validateStrategyScenario(scenario, context)).toEqual([])
    for (const faction of GUARDS_359_SCENARIO.playableFactions) {
      expect(GUARDS_359_SCENARIO.locationIds).toContain(faction.initialLocationId)
      expect(faction.requiredCharacterIds.length).toBeGreaterThan(0)
    }
  })

  it('reports precise invalid references and impossible values', () => {
    const invalid = structuredClone(GUARDS_359_SCENARIO)
    invalid.locationIds.push('invented-room')
    const outsideLocationId = locations.find(
      (location) => !invalid.locationIds.includes(location.id),
    )!.id
    invalid.playableFactions[0].initialLocationId = outsideLocationId
    invalid.events[0].turn = 99
    invalid.chapterNumber = 358
    expect(validateStrategyScenario(invalid, context)).toEqual(
      expect.arrayContaining([
        { path: 'locationIds', message: 'unknown location invented-room' },
        {
          path: 'playableFactions.0.initialLocationId',
          message: `location outside scenario ${outsideLocationId}`,
        },
        { path: 'events.security-alert.turn', message: 'outside scenario duration' },
        {
          path: 'playableFactions.1.requiredCharacterIds',
          message: 'musse is not revealed until chapter 363',
        },
      ]),
    )
  })
})
