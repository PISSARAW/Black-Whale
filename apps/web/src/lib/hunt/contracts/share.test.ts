import { describe, expect, it } from 'vitest'
import { huntContractById } from './registry'
import { decodeContract, editContract, encodeContract } from './share'

describe('contract editor and sharing', () => {
  it('round-trips a valid edited contract', () => {
    const edited = editContract(huntContractById('royal-apartments')!, {
      id: 'my-pursuit',
      title: { en: 'My pursuit', fr: 'Ma traque' },
      description: { en: 'A shared challenge.', fr: 'Un défi partagé.' },
      durationSeconds: 720,
    })
    expect(decodeContract(encodeContract(edited))).toEqual(edited)
  })

  it('rejects malformed shared contracts', () => {
    expect(decodeContract('not-a-contract')).toBeNull()
  })
})
