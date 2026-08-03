import { describe, expect, it } from 'vitest'
import { securityPolicy } from './security'

describe('collective security', () => {
  it('changes concrete procedures during lockdown', () => {
    expect(securityPolicy('normal', 'exit').verifyDocuments).toBe(false)
    expect(securityPolicy('lockdown', 'exit')).toMatchObject({
      pairPatrols: true,
      lockedExits: ['exit'],
      searchLastKnown: true,
    })
  })
})
