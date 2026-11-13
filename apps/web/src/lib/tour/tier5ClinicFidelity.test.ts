import { describe, expect, it } from 'vitest'
import { certificationIssuesFor, evidenceFor } from './sourceBoundRoomTestSupport'

describe('the Tier 5 medical clinic', () => {
  it('keeps the plan-established clinic free of invented equipment', () => {
    const { spaces, structures } = evidenceFor('tier-5-medical-clinic')

    expect(spaces).toHaveLength(1)
    expect(spaces[0]?.provenance).toBe('plan')
    expect(structures).toHaveLength(0)
    expect(certificationIssuesFor('tier-5-medical-clinic')).toEqual([])
  })
})
