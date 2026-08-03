import { describe, expect, it } from 'vitest'
import { assessAlert } from './alerts'

describe('alert state machine', () => {
  it('requires reports rather than an isolated percentage', () => {
    expect(assessAlert([], 0).level).toBe('normal')
    expect(assessAlert([], 1).level).toBe('doubt')
    expect(assessAlert([{ witnessId: 'guard', certainty: 80 }], 1).level).toBe('search')
  })
  it('distinguishes corroboration and confirmed identity', () => {
    expect(
      assessAlert(
        [
          { witnessId: 'guard', certainty: 80 },
          { witnessId: 'steward', certainty: 75 },
        ],
        2,
      ).level,
    ).toBe('lockdown')
    expect(assessAlert([{ witnessId: 'guard', certainty: 96 }], 1).level).toBe('identified')
  })
})
