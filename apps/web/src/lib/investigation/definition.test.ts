import { describe, expect, it } from 'vitest'
import { INVESTIGATION_SCHEMA_VERSION } from './definition'

describe('investigation definition schema', () => {
  it('has an explicit publication schema version', () => {
    expect(INVESTIGATION_SCHEMA_VERSION).toBeGreaterThan(1)
  })
})
