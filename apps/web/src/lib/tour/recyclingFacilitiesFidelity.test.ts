import { describe, expect, it } from 'vitest'
import { evidenceFor } from './sourceBoundRoomTestSupport'

describe('the recycling and sewage facilities', () => {
  it('keeps both plan volumes free of invented machinery', () => {
    const { spaces, structures } = evidenceFor('tier-4-recycling-sewage-facilities')

    expect(spaces).toHaveLength(2)
    expect(spaces.every(({ provenance }) => provenance === 'plan')).toBe(true)
    expect(structures).toHaveLength(0)
  })
})
