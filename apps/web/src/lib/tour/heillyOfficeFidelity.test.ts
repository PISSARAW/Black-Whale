import { describe, expect, it } from 'vitest'
import { evidenceFor } from './sourceBoundRoomTestSupport'

describe('the registered Heil-Ly office', () => {
  it('keeps the published office and entrance sparse', () => {
    const { spaces, structures } = evidenceFor('tier-3-heilly-family-office')

    expect(spaces).toHaveLength(3)
    expect(spaces.every(({ provenance }) => provenance === 'plan')).toBe(true)
    expect(structures.map(({ id, provenance }) => [id, provenance])).toEqual([
      ['tier-3-heilly-family-office-desk', 'plan'],
      ['tier-3-heilly-family-office-files', 'plan'],
    ])
  })
})
