import { describe, expect, it } from 'vitest'
import { evidenceFor } from './sourceBoundRoomTestSupport'

describe('the published first-class residential plan', () => {
  it('keeps six cabins, six WC cells and only the drawn beds and storage', () => {
    const { spaces, structures } = evidenceFor('tier-3-residential-first-class')

    expect(spaces).toHaveLength(16)
    expect(spaces.filter(({ provenance }) => provenance === 'inferred')).toHaveLength(1)
    expect(spaces.find(({ provenance }) => provenance === 'inferred')?.id).toBe(
      'tier-3-residential-first-class-companionway',
    )
    expect(structures).toHaveLength(12)
    expect(structures.every(({ provenance }) => provenance === 'plan')).toBe(true)
  })
})
