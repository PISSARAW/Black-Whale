import { describe, expect, it } from 'vitest'
import { evidenceFor } from './sourceBoundRoomTestSupport'

describe('the Central Police dorm room', () => {
  it('keeps its minimal functional programme explicitly inferred', () => {
    const { spaces, structures } = evidenceFor('tier-3-residential-units')

    expect(spaces).toHaveLength(1)
    expect(spaces[0]?.provenance).toBe('inferred')
    expect(structures).toHaveLength(6)
    expect(structures.every(({ provenance }) => provenance === 'inferred')).toBe(true)
    expect(structures.filter(({ kind }) => kind === 'bed')).toHaveLength(4)
    expect(structures.filter(({ kind }) => kind === 'cabinet')).toHaveLength(2)
  })
})
