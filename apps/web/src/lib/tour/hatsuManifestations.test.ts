import { describe, expect, it } from 'vitest'
import { buildShip } from './blueprint'
import { apparitionsOn, type Footing } from './apparitions'
import { EMPTY_WORLD, centroid, type TourWorld } from './hatsu'
import { hatsuManifestations } from './hatsuManifestations'
import { beastApparitions } from './cast/beasts'

const ship = buildShip()
const space = [...ship.spaces.values()][0]
const visitor: Footing = { spaceId: space.id, tierId: space.tierId, at: centroid(space) }
const world = (patch: Partial<TourWorld>): TourWorld => ({
  ...structuredClone(EMPTY_WORLD),
  ...patch,
})

describe('physical Nen manifestations', () => {
  it('does not present an unknown Predator counter as the Salé-salé design', () => {
    const base = world({ holding: 'predator' })
    const unknown = { ...base, body: { ...base.body, deduced: ['beast:room'] } }
    expect(hatsuManifestations(ship, unknown, { visitor })).toEqual([])
    const known = { ...base, body: { ...base.body, deduced: ['smoke:room'] } }
    expect(hatsuManifestations(ship, known, { visitor }).map((one) => one.kind)).toEqual([
      'predator-salesale',
    ])
  })

  it('removes carried tools with the held ability without mutating world state', () => {
    const active = world({ holding: 'staff' })
    const before = structuredClone(active)
    expect(hatsuManifestations(ship, active, { visitor }).map((one) => one.kind)).toEqual(['staff'])
    expect(hatsuManifestations(ship, { ...active, holding: null }, { visitor })).toEqual([])
    expect(active).toEqual(before)
  })

  it('does not summon a visible body for Woble even from a legacy ghost payload', () => {
    expect(
      beastApparitions(ship, [], {
        standing: [
          {
            ownerId: 'prince-woble',
            ownerName: 'Woble',
            silhouette: 'ghost',
            sourceChapterId: 'ch-358',
            standsWithId: 'nobody',
          },
        ],
      }),
    ).toEqual([])
  })

  it('keeps the same mouse anatomy and palette for every Momoze replica', () => {
    const seen = apparitionsOn(ship, world({ menagerie: [space.id] })).filter(
      (one) => one.kind === 'sprite',
    )
    expect(seen.length).toBeGreaterThan(1)
    expect(new Set(seen.map((one) => one.colour)).size).toBe(1)
    expect(seen.filter((one) => one.stage === 0)).toHaveLength(1)
    expect(seen.filter((one) => one.stage === 1).every((one) => one.size < seen[0].size)).toBe(true)
  })

  it('shows four Silent Majority snakes, separate from Gel’s arm', () => {
    const seen = hatsuManifestations(ship, world({ snakes: { rooms: [space.id], fed: false } }))
    expect(seen.filter((one) => one.kind === 'blood-snake')).toHaveLength(4)
    expect(seen.filter((one) => one.kind === 'snake')).toEqual([])
  })

  it('uses attested Biohazard pairs and removes them when the object is pocketed', () => {
    const camera = ship.structures.find((one) => one.kind === 'camera')!
    const active = world({ solids: { [camera.id]: { alive: true } } })
    expect(hatsuManifestations(ship, active).map((one) => one.kind)).toEqual(['animal-object'])
    active.solids[camera.id].pocketed = true
    expect(hatsuManifestations(ship, active)).toEqual([])
  })
})
