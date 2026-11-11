import { describe, expect, it } from 'vitest'
import { evidenceFor } from './sourceBoundRoomTestSupport'

describe('the Central Police dorm room', () => {
  it('does not invent an interior for the catalogue-only room', () => {
    const { spaces, structures } = evidenceFor('tier-3-residential-units')

    expect(spaces).toHaveLength(1)
    expect(spaces[0]?.provenance).toBe('inferred')
    expect(structures).toHaveLength(0)
  })
})
