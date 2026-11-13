import { describe, expect, it } from 'vitest'
import { certificationIssuesFor, evidenceFor } from './sourceBoundRoomTestSupport'

describe('the Ei-I office cutaway', () => {
  it('keeps the plan-established volume empty', () => {
    const { spaces, structures } = evidenceFor('tier-4-ei-i-family-office')

    expect(spaces).toHaveLength(1)
    expect(spaces[0]?.provenance).toBe('plan')
    expect(structures).toHaveLength(0)
    expect(certificationIssuesFor('tier-4-ei-i-family-office')).toEqual([])
  })
})
