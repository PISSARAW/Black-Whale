import { describe, expect, it } from 'vitest'
import { readShipUrlState, writeShipUrlState } from './shipUrlState'

const locations = [{ slug: 'cineplex' }, { slug: 'central-hospital' }]

describe('ship URL state', () => {
  it('reads valid spatial and filter state without accepting unknown values', () => {
    const url = new URL(
      'https://example.test/ship?tier=tier-3&location=cineplex&positions=0&entity=characters&faction=hunters&faction=nope&lineage=any&unknown=1',
    )
    expect(readShipUrlState(url, locations)).toEqual({
      tier: 'tier-3',
      location: 'cineplex',
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

  it('omits defaults and keeps unrelated timeline parameters', () => {
    const url = writeShipUrlState(new URL('https://example.test/ship?eventId=e1'), {
      tier: 'tier-3',
      location: 'cineplex',
      showEntities: true,
      entityType: 'all',
      factions: [],
      beyondLineage: 'all',
      showUnknownPositions: false,
    })
    expect(url.search).toBe('?eventId=e1&tier=tier-3&location=cineplex')
  })
})
