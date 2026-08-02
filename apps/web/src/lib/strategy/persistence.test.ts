import { describe, expect, it } from 'vitest'
import { decodeStrategySave, encodeStrategySave, type StrategySave } from './persistence'

describe('strategy persistence', () => {
  it('round-trips a valid save', () => {
    const save = {
      version: 1,
      savedAt: '2026-08-02T00:00:00.000Z',
      baseEventId: 'event',
      selectedFactionId: 'faction',
      turns: [
        { orders: [], diplomacy: [] },
        { orders: [], diplomacy: [] },
      ],
    } satisfies StrategySave
    expect(decodeStrategySave(encodeStrategySave(save))?.turns).toHaveLength(2)
  })

  it('rejects malformed saves', () => {
    expect(decodeStrategySave('{bad')).toBeNull()
    expect(decodeStrategySave('{"version":2}')).toBeNull()
  })
})
