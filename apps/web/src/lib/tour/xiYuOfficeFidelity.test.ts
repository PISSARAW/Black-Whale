import { describe, expect, it } from 'vitest'
import { evidenceFor } from './sourceBoundRoomTestSupport'

describe('the published Xi-Yu office plan', () => {
  it('keeps its guarded entrance and sole plan table', () => {
    const { spaces, structures } = evidenceFor('tier-4-xi-yu-family-office')

    expect(spaces).toHaveLength(3)
    expect(spaces.every(({ provenance }) => provenance === 'plan')).toBe(true)
    expect(structures.map(({ id, provenance }) => [id, provenance])).toEqual([
      ['tier-4-xi-yu-family-office-meeting-room-meeting-desk', 'plan'],
    ])
  })
})
