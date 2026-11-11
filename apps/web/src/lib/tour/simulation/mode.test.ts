import { describe, expect, it } from 'vitest'
import { assertTourMutationAllowed, tourModePolicy, tourWorldMode } from './mode'

describe('Tour world modes', () => {
  it('keeps the canonical reconstruction immutable', () => {
    expect(tourWorldMode(null)).toBe('CANONICAL_VISIT')
    expect(tourModePolicy('CANONICAL_VISIT')).toMatchObject({
      canonical: true,
      persistentConsequences: false,
    })
    expect(() => assertTourMutationAllowed('CANONICAL_VISIT')).toThrow(/read-only/)
  })

  it('separates free life from canon-changing alternative simulation', () => {
    expect(tourModePolicy(tourWorldMode('free')).mayAlterNamedCharacters).toBe(false)
    expect(tourModePolicy(tourWorldMode('alternative')).mayAlterNamedCharacters).toBe(true)
  })
})
