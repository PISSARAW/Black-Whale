import { describe, expect, it } from 'vitest'
import { confrontWitnesses } from './confrontation'

describe('witness confrontation', () => {
  it('deduces separate visibility rules from Loberry and Furykov', () => {
    const result = confrontWitnesses(['loberry', 'furykov'], ['loberry-vision', 'bill-testimony'])
    expect(result.tone).toBe('deduction')
    expect(result.evidenceIds).toEqual(['visibility-split'])
  })

  it('requires the underlying declarations first', () => {
    expect(confrontWitnesses(['loberry', 'furykov'], []).tone).toBe('insufficient')
  })
})
