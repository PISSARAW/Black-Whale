import { describe, expect, it } from 'vitest'
import { theShip } from '../blueprint'
import { auraSourcePlacement } from './auraPlacement'

const ship = theShip()
const structure = ship.structures[0]!
const space = ship.spaces.get(structure.spaceId!)!

describe('aura source placement', () => {
  it('uses an authored structure as an exact three-dimensional anchor', () => {
    const placement = auraSourcePlacement({
      ship,
      tierId: space.tierId,
      source: { id: 'glass', locationId: space.locationId ?? space.id, anchor: structure.id },
    })
    expect(placement).toMatchObject({
      at: structure.at,
      space: { id: space.id },
      approximate: false,
    })
    expect(placement!.y).toBeGreaterThan(structure.base + structure.height)
  })

  it('uses an authored space centroid without marking it approximate', () => {
    const placement = auraSourcePlacement({
      ship,
      tierId: space.tierId,
      source: { id: 'doors', locationId: space.locationId ?? space.id, anchor: space.id },
    })
    expect(placement).toMatchObject({ space: { id: space.id }, approximate: false })
  })

  it('falls back deterministically only when no anchor was declared', () => {
    const input = {
      ship,
      tierId: space.tierId,
      source: { id: 'unplaced', locationId: space.id },
    }
    expect(auraSourcePlacement(input)).toEqual(auraSourcePlacement(input))
    expect(auraSourcePlacement(input)?.approximate).toBe(true)
    expect(
      auraSourcePlacement({
        ...input,
        source: { ...input.source, anchor: 'missing-authored-anchor' },
      }),
    ).toBeNull()
  })
})
