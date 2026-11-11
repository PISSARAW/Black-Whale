import { describe, expect, it } from 'vitest'
import { evidenceFor } from './sourceBoundRoomTestSupport'

describe('the Central Courthouse plan', () => {
  it('keeps only the six fixtures named by the courtroom plan', () => {
    const { spaces, structures } = evidenceFor('tier-3-central-courthouse')

    expect(spaces).toHaveLength(2)
    expect(spaces.every(({ provenance }) => provenance === 'plan')).toBe(true)
    expect(structures).toHaveLength(6)
    expect(structures.every(({ provenance }) => provenance === 'plan')).toBe(true)
    expect(structures.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        'tier-3-central-courthouse-bench-dais',
        'tier-3-central-courthouse-bench',
        'tier-3-central-courthouse-clerks',
        'tier-3-central-courthouse-prosecution',
        'tier-3-central-courthouse-defence',
        'tier-3-central-courthouse-dock',
      ]),
    )
  })
})
