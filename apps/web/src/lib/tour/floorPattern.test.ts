import { describe, expect, it } from 'vitest'
import { buildShip } from './blueprint'
import { pointInPolygon } from './geometry'
import { floorPatternOf } from './floorPattern'

const ship = buildShip()
const space = (id: string) => ship.spaces.get(id)!

describe('audited floor patterns', () => {
  it('draws the four treatments the audit names', () => {
    expect(floorPatternOf(space('tier-1-king-living-quarters-living'))?.kind).toBe(
      'geometric-inlay',
    )
    expect(floorPatternOf(space('tier-1-lifeboats-port-pod-cabin'))?.kind).toBe('radial-deck')
    expect(floorPatternOf(space('tier-1-royal-residential-sector-room-1014-kitchen'))?.kind).toBe(
      'floorboards',
    )
    expect(floorPatternOf(space('tier-2-heilly-secret-hideout-processing'))?.kind).toBe('tile')
  })

  it('tiles Woble’s apartment except for the panel-shown kitchen floorboards', () => {
    const rooms = ship.blueprint.spaces.filter(
      (candidate) => candidate.tierId === 'interior-room-1014',
    )
    expect(rooms).toHaveLength(8)
    expect(rooms.map((room) => [room.id, floorPatternOf(room)?.kind])).toEqual(
      rooms.map((room) => [room.id, room.id.endsWith('-kitchen') ? 'floorboards' : 'tile']),
    )
  })

  it('does not tile Heil-Ly rooms the audit does not call tiled', () => {
    for (const id of [
      'tier-2-heilly-secret-hideout-corridor',
      'tier-2-heilly-secret-hideout-laundry',
      'tier-2-heilly-secret-hideout-communal',
      'tier-2-heilly-secret-hideout-office',
    ]) {
      expect(floorPatternOf(space(id)), id).toBeNull()
    }
  })

  it('keeps every marking inside the room that authorises it', () => {
    for (const room of ship.blueprint.spaces) {
      const pattern = floorPatternOf(room)
      if (!pattern) continue
      expect(pattern.segments.length, `${room.id} has no visible marking`).toBeGreaterThan(0)
      for (const [from, to] of pattern.segments) {
        const middle: [number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]
        expect(pointInPolygon(middle, room.footprint), `${room.id} leaks its pattern`).toBe(true)
      }
    }
  })
})
