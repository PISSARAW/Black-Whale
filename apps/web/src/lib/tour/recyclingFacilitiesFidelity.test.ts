import { describe, expect, it } from 'vitest'
import { evidenceFor } from './sourceBoundRoomTestSupport'

describe('the recycling and sewage facilities', () => {
  it('marks the minimal machinery in both plan volumes as inferred', () => {
    const { spaces, structures } = evidenceFor('tier-4-recycling-sewage-facilities')

    expect(spaces).toHaveLength(2)
    expect(spaces.every(({ provenance }) => provenance === 'plan')).toBe(true)
    expect(structures).toHaveLength(6)
    expect(structures.every(({ provenance }) => provenance === 'inferred')).toBe(true)
    expect(structures.every(({ sides }) => sides === 20)).toBe(true)
  })
})
