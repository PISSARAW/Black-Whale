import { describe, expect, it } from 'vitest'

import type { MapWorldState } from './types'
import { projectEventDelta, projectEventDeltaPoint } from './eventDelta'

const tier = {
  id: 'tier-1-id',
  slug: 'tier-1',
  name: 'Tier 1',
  type: 'TIER',
  parentLocationId: null,
}
const quarters = {
  id: 'quarters-id',
  slug: 'tier-1-queens-living-quarters',
  name: 'Queens living quarters',
  type: 'AREA',
  parentLocationId: tier.id,
}
const roomOne = {
  id: 'room-01-id',
  slug: 'tier-1-queens-living-quarters-room-01',
  name: 'Room 01',
  type: 'ROOM',
  parentLocationId: quarters.id,
}
const roomTwo = {
  id: 'room-02-id',
  slug: 'tier-1-queens-living-quarters-room-02',
  name: 'Room 02',
  type: 'ROOM',
  parentLocationId: quarters.id,
}
const elsewhere = {
  id: 'elsewhere-id',
  slug: 'tier-1-vvip-prison-beyond',
  name: 'VVIP prison',
  type: 'ROOM',
  parentLocationId: tier.id,
}

const world = {
  locations: [tier, quarters, roomOne, roomTwo, elsewhere],
  characters: [{ id: 'character-a', slug: 'unma' }],
  bodies: [{ id: 'body-a', originalCharacterId: 'character-a' }],
  presences: [
    {
      id: 'presence-a',
      entityType: 'BODY',
      entityId: 'body-a',
      locationId: roomOne.id,
      fromEventId: 'event-a',
      precision: 'EXACT_ROOM',
      certainty: 'CONFIRMED',
    },
  ],
  consciousnesses: [],
  occupancies: [],
  appearances: [],
} as unknown as MapWorldState

describe('event delta projection', () => {
  it('projects every known tier in the overview', () => {
    const point = projectEventDeltaPoint('body-a', roomOne.id, {
      world,
      zoom: 'OVERVIEW',
      selectedTier: null,
      selectedLocationSlug: null,
    })

    expect(point).toEqual({ x: 50, y: expect.any(Number) })
  })

  it('keeps tier points inside the selected deck only', () => {
    const context = {
      world,
      zoom: 'TIER' as const,
      selectedLocationSlug: null,
      currentEventTitle: null,
    }

    expect(
      projectEventDeltaPoint('body-a', roomOne.id, { ...context, selectedTier: 'tier-1' }),
    ).toEqual({ x: expect.any(Number), y: expect.any(Number) })
    expect(
      projectEventDeltaPoint('body-a', roomOne.id, { ...context, selectedTier: 'tier-2' }),
    ).toBeNull()
  })

  it('draws a route when both rooms belong to the current local plan', () => {
    const projected = projectEventDelta(
      {
        entityId: 'body-a',
        kind: 'moved',
        fromLocationId: roomOne.id,
        toLocationId: roomTwo.id,
      },
      {
        world,
        zoom: 'LOCAL',
        selectedTier: 'tier-1',
        selectedLocationSlug: quarters.slug,
      },
    )

    expect(projected.visual).toBe('route')
    expect(projected.from).not.toBeNull()
    expect(projected.to).not.toBeNull()
    expect(projected.from?.x).not.toBe(projected.to?.x)
  })

  it('marks a local arrival or departure when only one side is visible', () => {
    const context = {
      world,
      zoom: 'LOCAL' as const,
      selectedTier: 'tier-1',
      selectedLocationSlug: quarters.slug,
    }
    const arriving = projectEventDelta(
      {
        entityId: 'body-a',
        kind: 'moved',
        fromLocationId: elsewhere.id,
        toLocationId: roomOne.id,
      },
      context,
    )
    const leaving = projectEventDelta(
      {
        entityId: 'body-a',
        kind: 'moved',
        fromLocationId: roomOne.id,
        toLocationId: elsewhere.id,
      },
      context,
    )

    expect(arriving).toMatchObject({ from: null, visual: 'arrival' })
    expect(arriving.to).not.toBeNull()
    expect(leaving).toMatchObject({ to: null, visual: 'departure' })
    expect(leaving.from).not.toBeNull()
  })

  it('keeps non-movement changes as state badges without inventing a route', () => {
    const context = {
      world,
      zoom: 'LOCAL' as const,
      selectedTier: 'tier-1',
      selectedLocationSlug: quarters.slug,
    }
    const dead = projectEventDelta(
      {
        entityId: 'body-a',
        kind: 'dead',
        fromLocationId: roomOne.id,
        toLocationId: roomOne.id,
      },
      context,
    )

    expect(dead.visual).toBe('status')
    expect(dead.from).not.toBeNull()
    expect(dead.to).not.toBeNull()
  })
})
