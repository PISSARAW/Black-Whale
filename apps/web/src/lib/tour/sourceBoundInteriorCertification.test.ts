import { describe, expect, it } from 'vitest'
import { certificationIssuesFor } from './sourceBoundRoomTestSupport'
import { SOURCE_BOUND_INTERIOR_STYLES } from './sourceBoundInteriorStyles'

const CERTIFIED_LOCATIONS = [
  'tier-1-soldiers-living-quarters',
  'tier-3-royal-army-local-section',
  'tier-3-central-courthouse',
  'tier-3-heilly-family-office',
  'tier-3-residential-first-class',
  'tier-3-residential-standard',
  'tier-3-residential-units',
  'tier-4-ei-i-family-office',
  'tier-4-recycling-sewage-facilities',
  'tier-4-xi-yu-family-office',
  'tier-5-medical-clinic',
  'tier-5-standard-cabins',
] as const

describe('source-bound interior certification', () => {
  it('covers exactly the twelve declared programmes', () => {
    expect(SOURCE_BOUND_INTERIOR_STYLES.map(({ locationId }) => locationId).sort()).toEqual(
      [...CERTIFIED_LOCATIONS].sort(),
    )
  })

  for (const locationId of CERTIFIED_LOCATIONS) {
    it(`certifies every space belonging to ${locationId}`, () => {
      expect(certificationIssuesFor(locationId)).toEqual([])
    })
  }
})
