import { describe, expect, it } from 'vitest'
import { emptyMemory, remember, transmit } from './memory'

describe('actor memory', () => {
  it('tracks repeated exposure without duplicating observations', () => {
    const seen = {
      id: 'seen-1',
      at: 1,
      observerId: 'guard',
      kind: 'sight' as const,
      subject: 'player',
      value: 'maintenance',
      certainty: 40,
    }
    const once = remember(emptyMemory(), seen)
    expect(remember(once, seen)).toEqual(once)
    expect(once.exposureBySubject.player).toBe(1)
  })

  it('transmits provenance and loses certainty', () => {
    const memory = remember(emptyMemory(), {
      id: 'trace-1',
      at: 1,
      observerId: 'guard',
      kind: 'trace',
      subject: 'player',
      value: 'intruder',
      certainty: 70,
    })
    expect(transmit(memory, 'trace-1', 'steward', 4)).toMatchObject({
      sourceId: 'trace-1',
      observerId: 'steward',
      certainty: 58,
    })
  })
})
