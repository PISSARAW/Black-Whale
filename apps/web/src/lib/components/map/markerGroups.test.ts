import { describe, expect, it } from 'vitest'
import { aggregateCertainty, groupMarkersForZoom, markerInitials } from './markerGroups'
import type { MapMarker } from './markerProjection'

function marker(id: string, locationId: string, certainty = 'CONFIRMED'): MapMarker {
  return {
    id,
    locationId,
    tierId: 'tier-3',
    x: 40,
    y: 30,
    overviewX: 50,
    overviewY: 50,
    body: id,
    consciousness: id,
    appearance: id,
    perceivedIdentity: id,
    knowledgeState: 'confirmed',
    certainty,
  }
}

describe('map marker groups', () => {
  it('uses safe, localized initials', () => {
    expect(markerInitials('Kurapika')).toBe('K')
    expect(markerInitials('Prince Benjamin')).toBe('PB')
    expect(markerInitials('Individu inconnu')).toBe('?')
  })

  it('groups a tier by room in stable order', () => {
    const groups = groupMarkersForZoom([marker('b', 'hospital'), marker('a', 'hospital')], 'TIER')
    expect(groups).toHaveLength(1)
    expect(groups[0]?.markers.map(({ id }) => id)).toEqual(['a', 'b'])
    expect(groups[0]?.y).toBe(30)
  })

  it('uses the least certain member for a cluster', () => {
    expect(aggregateCertainty([marker('a', 'room'), marker('b', 'room', 'LAST_KNOWN')])).toBe(
      'LAST_KNOWN',
    )
  })
})
