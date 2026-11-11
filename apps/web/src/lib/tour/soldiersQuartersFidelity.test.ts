import { describe, expect, it } from 'vitest'
import { certificationIssuesFor, evidenceFor } from './sourceBoundRoomTestSupport'

describe('the published soldiers’ quarters plan', () => {
  it('keeps eight plan rooms and their ninety-six mapped bunks without panel claims', () => {
    const { spaces, structures } = evidenceFor('tier-1-soldiers-living-quarters')

    expect(spaces).toHaveLength(9)
    expect(spaces.every(({ provenance }) => provenance === 'plan')).toBe(true)
    expect(structures).toHaveLength(96)
    expect(structures.every(({ kind, provenance }) => kind === 'bed' && provenance === 'map')).toBe(
      true,
    )
    expect(certificationIssuesFor('tier-1-soldiers-living-quarters')).toEqual([])
  })
})
