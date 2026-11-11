import { describe, expect, it } from 'vitest'
import { pointInPolygon, structureWalls } from '../tour/geometry'
import { BANQUET_HALL_ID, SCREENING_ROOM_ID, arenaTerrainId, buildCombatTerrain } from './terrain'

describe('a combat terrain from the Black Whale', () => {
  const terrain = buildCombatTerrain()

  it('is the attested banquet hall, not authored arena geometry', () => {
    expect(terrain.id).toBe(BANQUET_HALL_ID)
    expect(terrain.space.provenance).toBe('panel')
    expect(terrain.structures.some((structure) => structure.kind === 'table')).toBe(true)
  })

  it('derives two walkable spawn points at a playable opening distance', () => {
    expect(pointInPolygon(terrain.spawns[0], terrain.footprint)).toBe(true)
    expect(pointInPolygon(terrain.spawns[1], terrain.footprint)).toBe(true)
    const distance = Math.hypot(
      terrain.spawns[0][0] - terrain.spawns[1][0],
      terrain.spawns[0][1] - terrain.spawns[1][1],
    )
    // The terrain samples clear positions on a 2.5 m grid; 24 m is a target,
    // not an exact distance available in every furnished room.
    expect(Math.abs(distance - 24)).toBeLessThanOrEqual(2.5)
  })

  it('turns attested furniture into tactical collision and cover', () => {
    const table = terrain.structures.find((structure) => structure.kind === 'table')!
    for (const wall of structureWalls(table)) expect(terrain.walls).toContainEqual(wall)
  })

  it('closes every footprint edge while a duel is running', () => {
    for (let index = 0; index < terrain.footprint.length; index += 1) {
      expect(terrain.walls).toContainEqual({
        spaceId: terrain.id,
        start: terrain.footprint[index],
        end: terrain.footprint[(index + 1) % terrain.footprint.length],
      })
    }
  })

  it('offers the attested Tier 2 screening room as a distinct second terrain', () => {
    const screening = buildCombatTerrain(SCREENING_ROOM_ID)
    expect(screening.space.provenance).toBe('panel')
    expect(screening.tierId).toBe('tier-2')
    expect(screening.structures).toHaveLength(31)
    expect(screening.footprint).not.toEqual(terrain.footprint)
    expect(screening.spawns).not.toEqual(terrain.spawns)
  })

  it('rejects unknown terrain ids at the route boundary', () => {
    expect(arenaTerrainId('unknown')).toBe(BANQUET_HALL_ID)
    expect(arenaTerrainId(SCREENING_ROOM_ID)).toBe(SCREENING_ROOM_ID)
  })
})
