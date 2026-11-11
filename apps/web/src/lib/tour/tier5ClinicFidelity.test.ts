import { describe, expect, it } from 'vitest'
import { certificationIssuesFor, evidenceFor } from './sourceBoundRoomTestSupport'

describe('the Tier 5 medical clinic', () => {
  it('keeps its plan-established volume separate from inferred equipment', () => {
    const { spaces, structures } = evidenceFor('tier-5-medical-clinic')

    expect(spaces).toHaveLength(1)
    expect(spaces[0]?.provenance).toBe('plan')
    expect(structures).toHaveLength(3)
    expect(structures.every(({ provenance }) => provenance === 'inferred')).toBe(true)
    expect(structures.filter(({ kind }) => kind === 'bed')).toHaveLength(2)
    expect(structures.filter(({ kind }) => kind === 'cabinet')).toHaveLength(1)
    expect(certificationIssuesFor('tier-5-medical-clinic')).toEqual([])
  })
})
