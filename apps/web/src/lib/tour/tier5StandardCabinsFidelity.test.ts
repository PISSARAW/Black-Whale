import { describe, expect, it } from 'vitest'
import { certificationIssuesFor, evidenceFor } from './sourceBoundRoomTestSupport'

describe('the Tier 5 standard-cabin plan', () => {
  it('keeps twelve forward cabins with one plan bed and cupboard each', () => {
    const { spaces, structures } = evidenceFor('tier-5-standard-cabins')

    expect(spaces).toHaveLength(15)
    expect(spaces.every(({ provenance }) => provenance === 'plan')).toBe(true)
    expect(structures).toHaveLength(24)
    expect(structures.filter(({ kind }) => kind === 'bed')).toHaveLength(12)
    expect(structures.filter(({ kind }) => kind === 'cabinet')).toHaveLength(12)
    expect(structures.every(({ provenance }) => provenance === 'plan')).toBe(true)
    expect(certificationIssuesFor('tier-5-standard-cabins')).toEqual([])
  })
})
