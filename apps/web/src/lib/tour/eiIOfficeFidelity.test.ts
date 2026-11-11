import { describe, expect, it } from 'vitest'
import { evidenceFor } from './sourceBoundRoomTestSupport'

describe('the Ei-I office cutaway', () => {
  it('separates its plan-established volume from inferred office furniture', () => {
    const { spaces, structures } = evidenceFor('tier-4-ei-i-family-office')

    expect(spaces).toHaveLength(1)
    expect(spaces[0]?.provenance).toBe('plan')
    expect(structures).toHaveLength(5)
    expect(structures.every(({ provenance }) => provenance === 'inferred')).toBe(true)
    expect(structures.map(({ kind }) => kind).sort()).toEqual([
      'cabinet',
      'cabinet',
      'seat',
      'seat',
      'table',
    ])
  })
})
