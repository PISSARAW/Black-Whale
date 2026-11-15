import { describe, expect, it } from 'vitest'
import { readShipUrlState, writeShipUrlState } from './shipUrlState'

const locations = [
  { id: 'ship', slug: 'black-whale-1', parentLocationId: null },
  { id: 'tier-3-id', slug: 'tier-3', parentLocationId: 'ship' },
  { id: 'cineplex-id', slug: 'tier-3-cineplex', parentLocationId: 'tier-3-id' },
  { id: 'hospital-id', slug: 'tier-3-central-hospital', parentLocationId: 'tier-3-id' },
  { id: 'tier-5-id', slug: 'tier-5', parentLocationId: 'ship' },
  { id: 'warehouse-id', slug: 'tier-5-warehouse', parentLocationId: 'tier-5-id' },
]

describe('ship URL state', () => {
  it('reads valid spatial and filter state without accepting unknown values', () => {
    const url = new URL(
      'https://example.test/ship?tier=tier-3&location=t3-cinema&positions=0&entity=characters&faction=hunters&faction=nope&lineage=any&unknown=1',
    )
    expect(readShipUrlState(url, locations)).toEqual({
      tier: 'tier-3',
      location: 't3-cinema',
      showEntities: false,
      entityType: 'characters',
      factions: ['hunters'],
      beyondLineage: 'any',
      showUnknownPositions: true,
    })
  })

  it('drops a room when no valid tier accompanies it', () => {
    const state = readShipUrlState(
      new URL('https://example.test/ship?tier=unknown&location=cineplex'),
      locations,
    )
    expect(state.tier).toBeNull()
    expect(state.location).toBeNull()
  })

  it('drops an unknown room while preserving a valid tier and filters', () => {
    const state = readShipUrlState(
      new URL(
        'https://example.test/ship?tier=tier-3&location=not-a-room&entity=objects&faction=mafia',
      ),
      locations,
    )
    expect(state.tier).toBe('tier-3')
    expect(state.location).toBeNull()
    expect(state.entityType).toBe('objects')
    expect(state.factions).toEqual(['mafia'])
  })

  it('drops a room from another tier while preserving the valid tier', () => {
    const state = readShipUrlState(
      new URL('https://example.test/ship?tier=tier-3&location=t5-warehouses'),
      locations,
    )
    expect(state.tier).toBe('tier-3')
    expect(state.location).toBeNull()
  })

  it('accepts a room on a secondary deck of the same canonical tier', () => {
    const state = readShipUrlState(
      new URL('https://example.test/ship?tier=tier-3-b&location=room-3101'),
      [
        ...locations,
        {
          id: 'room-3101-id',
          slug: 'tier-3-residential-room-3101',
          parentLocationId: 'tier-3-id',
        },
      ],
    )
    expect(state.tier).toBe('tier-3-b')
    expect(state.location).toBe('room-3101')
  })

  it('omits defaults and keeps unrelated timeline parameters', () => {
    const url = writeShipUrlState(new URL('https://example.test/ship?eventId=e1'), {
      tier: 'tier-3',
      location: 't3-cinema',
      showEntities: true,
      entityType: 'all',
      factions: [],
      beyondLineage: 'all',
      showUnknownPositions: false,
    })
    expect(url.search).toBe('?eventId=e1&tier=tier-3&location=t3-cinema')
  })
})
