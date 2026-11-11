import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { buildShip, ceilingOf, floorOf } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { buildPrinceApartmentEnvelope } from './princeApartmentEnvelope'

const ship = buildShip()
const rooms = ship.blueprint.spaces.filter((space) =>
  /^interior-room-10(0[1-9]|1[0-4])$/.test(space.tierId),
)

describe('the shared manga envelope of the princely apartments', () => {
  it('covers every internal room of all fourteen princes', () => {
    expect(rooms).toHaveLength(112)
    for (const room of rooms) {
      const plan = ship.plans.get(room.tierId)!
      const model = buildPrinceApartmentEnvelope({
        THREE,
        plan,
        spaceId: room.id,
        reveal: false,
      })

      expect(model, room.id).not.toBeNull()
      expect(model!.children.length, room.id).toBeGreaterThan(0)
      const bounds = new THREE.Box3().setFromObject(model!)
      expect(bounds.min.y, room.id).toBeGreaterThanOrEqual(floorOf(room, plan.tier) - 0.01)
      expect(bounds.max.y, room.id).toBeLessThanOrEqual(
        floorOf(room, plan.tier) + ceilingOf(room, plan.tier) + 0.01,
      )
      disposeBanquetDetails(model!)
    }
  })

  it('does not dress non-princely rooms or provenance reveal mode', () => {
    const room = rooms[0]!
    const plan = ship.plans.get(room.tierId)!
    expect(buildPrinceApartmentEnvelope({ THREE, plan, spaceId: room.id, reveal: true })).toBeNull()
    expect(
      buildPrinceApartmentEnvelope({
        THREE,
        plan: ship.plans.get('tier-1')!,
        spaceId: 'tier-1-banquet-hall',
        reveal: false,
      }),
    ).toBeNull()
  })
})
